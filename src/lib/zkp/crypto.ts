/**
 * Zero-Knowledge Proof (ZKP) Engine — Curve25519 Schnorr Sigma Protocol
 *
 * Implements a non-interactive Zero-Knowledge Proof of Knowledge of Discrete Logarithm
 * (Schnorr Identification Protocol with Fiat-Shamir heuristic bound to a fresh server nonce).
 *
 * Mathematical Foundation:
 * -----------------------------------------------------------------------------------------
 * Public Parameters:
 *   - Elliptic Curve: Curve25519 (Ed25519 prime-order subgroup)
 *   - Generator Base Point: G (standard Ed25519 base point)
 *   - Group Prime Order: L = 2^252 + 27742317777372353535851937790883648493
 *
 * Protocol Execution:
 *   1. Registration:
 *        User samples secret x ∈ [1, L-1] (stored only on device vault).
 *        User computes public commitment C = x · G.
 *        Server stores (username, C). No password or secret hash is ever stored!
 *
 *   2. Authentication (Interactive -> Non-Interactive via Fiat-Shamir):
 *        a) Client requests a fresh single-use nonce N from server (60s TTL).
 *        b) Client samples ephemeral scalar r ←$ [1, L-1], computes R = r · G.
 *        c) Fiat-Shamir challenge c = H(R || C || N || username) mod L.
 *        d) Client computes proof scalar s = (r + c · x) mod L.
 *        e) Client sends (R, s, N) to server.
 *
 *   3. Verification:
 *        Server verifies single-use nonce N (and atomically consumes it to prevent replay).
 *        Server checks: s · G =?= R + c · C.
 *        Since s · G = (r + c · x) · G = r · G + c · (x · G) = R + c · C, the equation holds
 *        if and only if the prover knows secret x.
 *
 * Security Properties:
 *   - Zero-Knowledge: Simulated transcripts (R, c, s) are indistinguishable from real ones.
 *   - Soundness: Forgery probability without knowing discrete log is ≤ 2^-252.
 *   - Anti-Replay: Bound mathematically to server nonce N in challenge hash c.
 */

import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";

// Prime order L of the Curve25519 subgroup
export const SUBGROUP_ORDER: bigint = ed25519.CURVE.n;

// Base generator point G
export const GENERATOR = ed25519.ExtendedPoint.BASE;

export interface ZkpKeyPair {
  secretHex: string;     // Private key x (hex, 32 bytes) — NEVER leaves client vault
  commitmentHex: string; // Public commitment C = x · G (hex, 32 bytes)
}

export interface EphemeralCommitment {
  rHex: string; // Ephemeral random scalar r (client secret, temporary)
  RHex: string; // Ephemeral public point R = r · G (sent in proof)
}

export interface ZkpProof {
  RHex: string;         // Ephemeral commitment point R
  sHex: string;         // Proof response scalar s = (r + c · x) mod L
  challengeHex: string; // Challenge c for audit/inspection
}

/**
 * Utility: Convert a hex string to BigInt
 */
export function hexToBigInt(hex: string): bigint {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error("Invalid hexadecimal string");
  }
  return BigInt("0x" + cleaned);
}

/**
 * Utility: Convert BigInt to padded hex string (64 characters = 32 bytes)
 */
export function bigIntToHex(value: bigint, length: number = 64): string {
  const hex = value.toString(16);
  return hex.padStart(length, "0");
}

/**
 * Generate a cryptographically secure random secret scalar x ∈ [1, L-1]
 * and its public commitment C = x · G
 */
export function generateKeyPair(): ZkpKeyPair {
  const randomBytes = ed25519.utils.randomPrivateKey();
  const rawHex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const x = hexToBigInt(rawHex) % SUBGROUP_ORDER;
  const safeX = x === 0n ? 1n : x;
  const C = GENERATOR.multiply(safeX);

  return {
    secretHex: bigIntToHex(safeX),
    commitmentHex: C.toHex(),
  };
}

/**
 * Deterministically derive a secret scalar from a human passphrase
 */
export function deriveSecretFromPassphrase(passphrase: string): ZkpKeyPair {
  const hash = sha256(new TextEncoder().encode("zkp:auth:seed:" + passphrase));
  const rawHex = Array.from(hash).map((b) => b.toString(16).padStart(2, "0")).join("");
  const x = (hexToBigInt(rawHex) % (SUBGROUP_ORDER - 1n)) + 1n;
  const C = GENERATOR.multiply(x);

  return {
    secretHex: bigIntToHex(x),
    commitmentHex: C.toHex(),
  };
}

/**
 * Derive public commitment C = x · G from a secret hex
 */
export function deriveCommitment(secretHex: string): string {
  const x = hexToBigInt(secretHex) % SUBGROUP_ORDER;
  const C = GENERATOR.multiply(x);
  return C.toHex();
}

/**
 * Step 1 (Prover): Generate ephemeral nonce r and ephemeral commitment R = r · G
 */
export function generateEphemeralCommitment(): EphemeralCommitment {
  const rBytes = ed25519.utils.randomPrivateKey();
  const rawHex = Array.from(rBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const r = (hexToBigInt(rawHex) % (SUBGROUP_ORDER - 1n)) + 1n;
  const R = GENERATOR.multiply(r);

  return {
    rHex: bigIntToHex(r),
    RHex: R.toHex(),
  };
}

/**
 * Compute the Fiat-Shamir challenge c = SHA256(R || C || nonce || username) mod L
 * Cryptographically binds the proof to the server's single-use nonce and user identity.
 */
export function computeChallenge(
  RHex: string,
  commitmentHex: string,
  nonce: string,
  username: string
): bigint {
  const message = `${RHex.toLowerCase()}:${commitmentHex.toLowerCase()}:${nonce}:${username.trim().toLowerCase()}`;
  const digest = sha256(new TextEncoder().encode(message));
  const hex = Array.from(digest).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hexToBigInt(hex) % SUBGROUP_ORDER;
}

/**
 * Step 2 (Prover): Generate Zero-Knowledge proof response s = (r + c · x) mod L
 */
export function generateProof(
  secretHex: string,
  rHex: string,
  RHex: string,
  commitmentHex: string,
  nonce: string,
  username: string
): ZkpProof {
  const x = hexToBigInt(secretHex) % SUBGROUP_ORDER;
  const r = hexToBigInt(rHex) % SUBGROUP_ORDER;
  const c = computeChallenge(RHex, commitmentHex, nonce, username);

  // s = (r + c * x) mod L
  const s = (r + c * x) % SUBGROUP_ORDER;

  return {
    RHex,
    sHex: bigIntToHex(s),
    challengeHex: bigIntToHex(c),
  };
}

/**
 * Step 3 (Verifier): Verify that s · G ≡ R + c · C
 *
 * Returns true if and only if the prover knows secret x such that C = x · G,
 * and the proof was computed specifically for the given fresh nonce.
 */
export function verifyProof(
  commitmentHex: string,
  RHex: string,
  sHex: string,
  nonce: string,
  username: string
): { valid: boolean; reason?: string } {
  try {
    const s = hexToBigInt(sHex);
    if (s <= 0n || s >= SUBGROUP_ORDER) {
      return { valid: false, reason: "Scalar s out of bounds [1, L-1]" };
    }

    // Reconstruct curve points
    const C = ed25519.ExtendedPoint.fromHex(commitmentHex);
    const R = ed25519.ExtendedPoint.fromHex(RHex);

    // Compute challenge c = H(R || C || nonce || username) mod L
    const c = computeChallenge(RHex, commitmentHex, nonce, username);

    // LHS = s · G
    const sG = GENERATOR.multiply(s);

    // RHS = R + c · C
    const cC = C.multiply(c);
    const expected = R.add(cC);

    const valid = sG.equals(expected);
    return {
      valid,
      reason: valid ? undefined : "Cryptographic proof equation mismatch (s·G ≠ R + c·C)",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, reason: `Verification error: ${message}` };
  }
}

/**
 * Run micro-benchmarks for performance analysis
 */
export function benchmarkZkp(): {
  keygenMs: number;
  commitMs: number;
  proveMs: number;
  verifyMs: number;
  curve: string;
  securityBits: number;
} {
  const t0 = performance.now();
  const keys = generateKeyPair();
  const t1 = performance.now();

  const ephemeral = generateEphemeralCommitment();
  const t2 = performance.now();

  const nonce = "bench-nonce-" + Math.random().toString(36);
  const proof = generateProof(
    keys.secretHex,
    ephemeral.rHex,
    ephemeral.RHex,
    keys.commitmentHex,
    nonce,
    "demo@zkp.local"
  );
  const t3 = performance.now();

  const result = verifyProof(
    keys.commitmentHex,
    proof.RHex,
    proof.sHex,
    nonce,
    "demo@zkp.local"
  );
  const t4 = performance.now();

  if (!result.valid) {
    throw new Error("Self-test failed: proof did not verify");
  }

  return {
    keygenMs: Number((t1 - t0).toFixed(3)),
    commitMs: Number((t2 - t1).toFixed(3)),
    proveMs: Number((t3 - t2).toFixed(3)),
    verifyMs: Number((t4 - t3).toFixed(3)),
    curve: "Curve25519 (Ed25519 group, Edwards coordinates)",
    securityBits: 128,
  };
}

