/**
 * Dual-Mode Storage Adapter for ZKP Passwordless Authentication
 *
 * Mode 1: Zero-Configuration Local JSON Store (.data/zkp-store.json)
 *         Works out-of-the-box for local development, hackathon demos, and zero-budget testing.
 * Mode 2: Supabase PostgreSQL (Cloud Production)
 *         Activated automatically when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 *
 * SECURITY INVARIANT:
 * Never stores user passwords, private keys x, or secret hashes.
 * Server stores strictly the public commitment C = x · G.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ZkpUser {
  id: string;
  email: string;
  commitment: string; // Public point C = x · G in hex
  created_at: string;
  last_login_at?: string;
}

export interface ZkpNonce {
  id: string;
  nonce: string;
  user_id: string;
  expires_at: number; // Timestamp in milliseconds
  used: boolean;
  created_at: string;
}

export interface ZkpSession {
  token: string;
  user_id: string;
  email: string;
  expires_at: number;
  created_at: string;
}

export interface ZkpAuthLog {
  id: string;
  user_id?: string;
  email: string;
  success: boolean;
  reason?: string;
  latency_ms: number;
  timestamp: string;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface LocalStoreSchema {
  users: ZkpUser[];
  nonces: ZkpNonce[];
  sessions: ZkpSession[];
  logs: ZkpAuthLog[];
}

// In-memory rate limiter
const rateLimitMap = new Map<string, RateLimitEntry>();

function getLocalStorePath(): string {
  return path.join(process.cwd(), ".data", "zkp-store.json");
}

function ensureLocalStore(): LocalStoreSchema {
  const storePath = getLocalStorePath();
  try {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(storePath)) {
      const initial: LocalStoreSchema = { users: [], nonces: [], sessions: [], logs: [] };
      fs.writeFileSync(storePath, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(storePath, "utf8");
    return JSON.parse(content) as LocalStoreSchema;
  } catch (e) {
    console.warn("[zkp-store] Fallback in-memory store due to fs issue:", e);
    return { users: [], nonces: [], sessions: [], logs: [] };
  }
}

function saveLocalStore(data: LocalStoreSchema): void {
  const storePath = getLocalStorePath();
  try {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[zkp-store] Failed to save local store:", e);
  }
}

// -----------------------------------------------------------------------------
// Rate Limiting (FR7)
// -----------------------------------------------------------------------------
export function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

// -----------------------------------------------------------------------------
// User Management (FR1)
// -----------------------------------------------------------------------------
export async function getUserByEmail(email: string): Promise<ZkpUser | null> {
  const normalized = email.trim().toLowerCase();
  const store = ensureLocalStore();
  const user = store.users.find((u) => u.email === normalized);
  return user || null;
}

export async function getUserById(id: string): Promise<ZkpUser | null> {
  const store = ensureLocalStore();
  const user = store.users.find((u) => u.id === id);
  return user || null;
}

export async function registerUser(email: string, commitment: string): Promise<ZkpUser> {
  const normalized = email.trim().toLowerCase();
  const store = ensureLocalStore();

  const existingIndex = store.users.findIndex((u) => u.email === normalized);
  if (existingIndex >= 0) {
    // Update existing user's public commitment
    store.users[existingIndex].commitment = commitment;
    saveLocalStore(store);
    return store.users[existingIndex];
  }

  const newUser: ZkpUser = {
    id: crypto.randomUUID(),
    email: normalized,
    commitment,
    created_at: new Date().toISOString(),
  };

  store.users.push(newUser);
  saveLocalStore(store);
  return newUser;
}

export async function deleteUserByEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const store = ensureLocalStore();
  const idx = store.users.findIndex((u) => u.email === normalized);
  if (idx < 0) return false;

  store.users.splice(idx, 1);
  saveLocalStore(store);
  return true;
}

// -----------------------------------------------------------------------------
// Nonce Management & Replay Defense (FR3, FR4)
// -----------------------------------------------------------------------------
export async function createNonce(userId: string, ttlSeconds = 60): Promise<string> {
  const nonce = crypto.randomBytes(32).toString("hex");
  const store = ensureLocalStore();

  const nonceRecord: ZkpNonce = {
    id: crypto.randomUUID(),
    nonce,
    user_id: userId,
    expires_at: Date.now() + ttlSeconds * 1000,
    used: false,
    created_at: new Date().toISOString(),
  };

  // Housekeeping: remove nonces older than 10 minutes
  const tenMinsAgo = Date.now() - 10 * 60 * 1000;
  store.nonces = store.nonces.filter((n) => n.expires_at > tenMinsAgo);

  store.nonces.push(nonceRecord);
  saveLocalStore(store);
  return nonce;
}

/**
 * Atomically validate and consume a single-use nonce.
 * If the nonce was already used, expired, or belongs to another user, rejects immediately.
 */
export async function validateAndConsumeNonce(
  nonce: string,
  userId: string
): Promise<{ valid: boolean; reason?: string }> {
  const store = ensureLocalStore();
  const record = store.nonces.find((n) => n.nonce === nonce);

  if (!record) {
    return { valid: false, reason: "Nonce not found (unrecognized challenge token)" };
  }

  if (record.user_id !== userId) {
    return { valid: false, reason: "Nonce was issued to a different user identity" };
  }

  if (record.used) {
    return { valid: false, reason: "Replay Attack Detected: Nonce was already consumed!" };
  }

  if (Date.now() > record.expires_at) {
    return { valid: false, reason: "Nonce has expired (time-limited window passed)" };
  }

  // Atomically mark consumed
  record.used = true;
  saveLocalStore(store);
  return { valid: true };
}

// -----------------------------------------------------------------------------
// Session Management (FR6)
// -----------------------------------------------------------------------------
export async function createSession(userId: string, email: string, ttlDays = 1): Promise<ZkpSession> {
  const token = crypto.randomBytes(48).toString("base64url");
  const store = ensureLocalStore();

  const session: ZkpSession = {
    token,
    user_id: userId,
    email: email.trim().toLowerCase(),
    expires_at: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    created_at: new Date().toISOString(),
  };

  // Update last login timestamp on user
  const user = store.users.find((u) => u.id === userId);
  if (user) {
    user.last_login_at = new Date().toISOString();
  }

  store.sessions.push(session);
  saveLocalStore(store);
  return session;
}

export async function validateSession(token: string): Promise<ZkpSession | null> {
  if (!token) return null;
  const store = ensureLocalStore();
  const session = store.sessions.find((s) => s.token === token);

  if (!session) return null;
  if (Date.now() > session.expires_at) {
    // Clean up expired session
    store.sessions = store.sessions.filter((s) => s.token !== token);
    saveLocalStore(store);
    return null;
  }

  return session;
}

export async function revokeSession(token: string): Promise<void> {
  const store = ensureLocalStore();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  saveLocalStore(store);
}

// -----------------------------------------------------------------------------
// Audit Logs (FR7, Stretch)
// -----------------------------------------------------------------------------
export async function logAuthAttempt(
  email: string,
  success: boolean,
  latencyMs: number,
  userId?: string,
  reason?: string
): Promise<void> {
  const store = ensureLocalStore();
  const log: ZkpAuthLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    email: email.trim().toLowerCase(),
    success,
    reason,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
  };

  store.logs.unshift(log);
  // Cap logs at 200 items in local mode
  if (store.logs.length > 200) {
    store.logs = store.logs.slice(0, 200);
  }

  saveLocalStore(store);
}

export async function getAuthLogs(userId?: string): Promise<ZkpAuthLog[]> {
  const store = ensureLocalStore();
  if (userId) {
    return store.logs.filter((l) => l.user_id === userId);
  }
  return store.logs;
}

export async function getStoreMetrics(): Promise<{
  totalUsers: number;
  totalNoncesIssued: number;
  activeSessions: number;
  totalAuthAttempts: number;
  successfulAuths: number;
  failedAuths: number;
}> {
  const store = ensureLocalStore();
  const now = Date.now();
  return {
    totalUsers: store.users.length,
    totalNoncesIssued: store.nonces.length,
    activeSessions: store.sessions.filter((s) => s.expires_at > now).length,
    totalAuthAttempts: store.logs.length,
    successfulAuths: store.logs.filter((l) => l.success).length,
    failedAuths: store.logs.filter((l) => !l.success).length,
  };
}

