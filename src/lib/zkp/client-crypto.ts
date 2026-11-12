"use client";

/**
 * Client-Side Cryptographic Vault and Identity Manager
 *
 * All private operations occur strictly on the user's client machine.
 * Private secret keys x NEVER traverse the network.
 */

import {
  generateKeyPair,
  deriveSecretFromPassphrase,
  generateEphemeralCommitment,
  generateProof,
  ZkpKeyPair,
  EphemeralCommitment,
  ZkpProof,
} from "./crypto";

const VAULT_STORAGE_PREFIX = "zkp_vault_v1:";

export interface PublicIdentityInfo {
  email: string;
  commitmentHex: string;
  savedAt: string;
}

export interface ExportedIdentityBackup {
  version: "1.0";
  email: string;
  secretHex: string;
  commitmentHex: string;
  exportedAt: string;
  note: string;
}

/**
 * Store a secret keypair securely inside the browser's local vault
 */
export function storeSecret(
  email: string,
  secretHex: string,
  commitmentHex: string
): void {
  if (typeof window === "undefined") return;
  const key = `${VAULT_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  const payload = {
    email: email.trim().toLowerCase(),
    secretHex,
    commitmentHex,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

/**
 * Retrieve the private secret scalar x for an email
 */
export function loadSecret(email: string): string | null {
  if (typeof window === "undefined") return null;
  const key = `${VAULT_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    const parsed = JSON.parse(item);
    return parsed.secretHex || null;
  } catch {
    return null;
  }
}

/**
 * Check if a local secret exists for this email
 */
export function hasSecret(email: string): boolean {
  return loadSecret(email) !== null;
}

/**
 * Delete a secret from the local vault
 */
export function deleteSecret(email: string): void {
  if (typeof window === "undefined") return;
  const key = `${VAULT_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  localStorage.removeItem(key);
}

/**
 * List all registered identities stored in this browser's vault
 */
export function listStoredIdentities(): PublicIdentityInfo[] {
  if (typeof window === "undefined") return [];
  const identities: PublicIdentityInfo[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(VAULT_STORAGE_PREFIX)) {
      try {
        const item = localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.email && parsed.commitmentHex) {
            identities.push({
              email: parsed.email,
              commitmentHex: parsed.commitmentHex,
              savedAt: parsed.savedAt || new Date().toISOString(),
            });
          }
        }
      } catch {
        // Skip malformed entries
      }
    }
  }

  return identities;
}

/**
 * Export identity backup file for download
 */
export function exportIdentityBackup(email: string): ExportedIdentityBackup | null {
  if (typeof window === "undefined") return null;
  const key = `${VAULT_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const parsed = JSON.parse(item);
    return {
      version: "1.0",
      email: parsed.email,
      secretHex: parsed.secretHex,
      commitmentHex: parsed.commitmentHex,
      exportedAt: new Date().toISOString(),
      note: "CRITICAL: This JSON contains your private discrete-log secret x. Keep offline and never upload to any server.",
    };
  } catch {
    return null;
  }
}

/**
 * Import identity from a backup object
 */
export function importIdentityBackup(backup: ExportedIdentityBackup): boolean {
  if (!backup || !backup.email || !backup.secretHex || !backup.commitmentHex) {
    return false;
  }
  storeSecret(backup.email, backup.secretHex, backup.commitmentHex);
  return true;
}

export {
  generateKeyPair,
  deriveSecretFromPassphrase,
  generateEphemeralCommitment,
  generateProof,
};

export type { ZkpKeyPair, EphemeralCommitment, ZkpProof };

