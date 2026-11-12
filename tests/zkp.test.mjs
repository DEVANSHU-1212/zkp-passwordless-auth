import test from "node:test";
import assert from "node:assert/strict";

import {
  generateKeyPair,
  deriveSecretFromPassphrase,
  generateEphemeralCommitment,
  generateProof,
  verifyProof,
  benchmarkZkp,
  SUBGROUP_ORDER,
  GENERATOR,
  hexToBigInt,
  bigIntToHex,
} from "../src/lib/zkp/crypto.ts";

import {
  registerUser,
  getUserByEmail,
  createNonce,
  validateAndConsumeNonce,
  createSession,
  validateSession,
  revokeSession,
} from "../src/lib/zkp/store.ts";

test("1. Key Generation & Public Commitment", () => {
  const keypair = generateKeyPair();
  assert.ok(keypair.secretHex, "Secret hex must exist");
  assert.ok(keypair.commitmentHex, "Commitment hex must exist");
  assert.equal(keypair.secretHex.length, 64, "Secret must be 32 bytes (64 hex characters)");

  const x = hexToBigInt(keypair.secretHex);
  assert.ok(x > 0n && x < SUBGROUP_ORDER, "Secret scalar must be in [1, L-1]");

  const expectedC = GENERATOR.multiply(x).toHex();
  assert.equal(keypair.commitmentHex, expectedC, "C must equal x · G");
});

test("2. Deterministic Passphrase Key Derivation", () => {
  const seed = "portfolio-zkp-master-seed-2026";
  const kp1 = deriveSecretFromPassphrase(seed);
  const kp2 = deriveSecretFromPassphrase(seed);

  assert.equal(kp1.secretHex, kp2.secretHex, "Identical seed must yield identical secret scalar");
  assert.equal(kp1.commitmentHex, kp2.commitmentHex, "Identical seed must yield identical public commitment");

  const diffKp = deriveSecretFromPassphrase("different-seed");
  assert.notEqual(kp1.secretHex, diffKp.secretHex, "Different seed must yield different key");
});

test("3. Complete Zero-Knowledge Identification Flow (Completeness)", () => {
  const userKeys = generateKeyPair();
  const email = "alice@zkp-auth.test";
  const nonce = "test-nonce-" + Math.random().toString(36);

  // Prover Step 1
  const ephemeral = generateEphemeralCommitment();

  // Prover Step 2
  const proof = generateProof(
    userKeys.secretHex,
    ephemeral.rHex,
    ephemeral.RHex,
    userKeys.commitmentHex,
    nonce,
    email
  );

  // Verifier Step
  const result = verifyProof(
    userKeys.commitmentHex,
    proof.RHex,
    proof.sHex,
    nonce,
    email
  );

  assert.equal(result.valid, true, "Valid proof must be accepted by verifier");
  assert.equal(result.reason, undefined);
});

test("4. Tampered Scalar s Rejection (Soundness)", () => {
  const userKeys = generateKeyPair();
  const email = "bob@zkp-auth.test";
  const nonce = "test-nonce-tamper-1";

  const ephemeral = generateEphemeralCommitment();
  const proof = generateProof(
    userKeys.secretHex,
    ephemeral.rHex,
    ephemeral.RHex,
    userKeys.commitmentHex,
    nonce,
    email
  );

  // Tamper scalar s
  const sBig = hexToBigInt(proof.sHex);
  const tamperedS = (sBig + 1n) % SUBGROUP_ORDER;
  const tamperedSHex = bigIntToHex(tamperedS);

  const result = verifyProof(
    userKeys.commitmentHex,
    proof.RHex,
    tamperedSHex,
    nonce,
    email
  );

  assert.equal(result.valid, false, "Tampered scalar s MUST be rejected");
});

test("5. Tampered Ephemeral Point R Rejection (Soundness)", () => {
  const userKeys = generateKeyPair();
  const email = "carol@zkp-auth.test";
  const nonce = "test-nonce-tamper-2";

  const ephemeral1 = generateEphemeralCommitment();
  const ephemeral2 = generateEphemeralCommitment(); // Different point
  const proof = generateProof(
    userKeys.secretHex,
    ephemeral1.rHex,
    ephemeral1.RHex,
    userKeys.commitmentHex,
    nonce,
    email
  );

  const result = verifyProof(
    userKeys.commitmentHex,
    ephemeral2.RHex, // Swapped R
    proof.sHex,
    nonce,
    email
  );

  assert.equal(result.valid, false, "Mismatched ephemeral point R MUST be rejected");
});

test("6. Replay Attack Prevention (Single-Use Nonce Invalidation)", async () => {
  const email = "david-" + Date.now() + "@zkp.test";
  const userKeys = generateKeyPair();
  const user = await registerUser(email, userKeys.commitmentHex);

  const nonce = await createNonce(user.id, 60);

  // First verification of nonce: MUST SUCCEED
  const firstUse = await validateAndConsumeNonce(nonce, user.id);
  assert.equal(firstUse.valid, true, "First nonce usage must be valid");

  // Immediate second verification (Replay Attack): MUST FAIL
  const replayAttempt = await validateAndConsumeNonce(nonce, user.id);
  assert.equal(replayAttempt.valid, false, "Replaying a consumed nonce MUST be rejected");
  assert.match(replayAttempt.reason || "", /Replay/i, "Reason must indicate replay attack");
});

test("7. Expired Nonce Rejection", async () => {
  const email = "eve-" + Date.now() + "@zkp.test";
  const userKeys = generateKeyPair();
  const user = await registerUser(email, userKeys.commitmentHex);

  // Create nonce with TTL of -1 second (already expired)
  const expiredNonce = await createNonce(user.id, -1);

  const check = await validateAndConsumeNonce(expiredNonce, user.id);
  assert.equal(check.valid, false, "Expired nonce must be rejected");
  assert.match(check.reason || "", /expired/i);
});

test("8. Cross-User Nonce Hijacking Defense", async () => {
  const u1 = await registerUser("user1-" + Date.now() + "@zkp.test", generateKeyPair().commitmentHex);
  const u2 = await registerUser("user2-" + Date.now() + "@zkp.test", generateKeyPair().commitmentHex);

  const nonceU1 = await createNonce(u1.id, 60);

  // Attacker u2 tries to verify with u1's nonce
  const check = await validateAndConsumeNonce(nonceU1, u2.id);
  assert.equal(check.valid, false, "Nonce issued to user1 cannot be claimed by user2");
  assert.match(check.reason || "", /different user/i);
});

test("9. Session Lifecycle (Create, Validate, Revoke)", async () => {
  const email = "frank-" + Date.now() + "@zkp.test";
  const user = await registerUser(email, generateKeyPair().commitmentHex);

  const session = await createSession(user.id, user.email, 1);
  assert.ok(session.token, "Session token must exist");

  const validated = await validateSession(session.token);
  assert.ok(validated, "Valid session token must return session");
  assert.equal(validated?.email, email);

  await revokeSession(session.token);
  const afterRevoke = await validateSession(session.token);
  assert.equal(afterRevoke, null, "Revoked session must return null");
});

test("10. Microbenchmark Verification (< 10ms Requirement)", () => {
  const bm = benchmarkZkp();
  assert.ok(bm.verifyMs < 10, `Verification took ${bm.verifyMs}ms (must be < 10ms)`);
  assert.ok(bm.proveMs < 10, `Proving took ${bm.proveMs}ms (must be < 10ms)`);
  assert.equal(bm.securityBits, 128);
});
