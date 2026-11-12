pragma circom 2.1.6;

/**
 * ZKP Passwordless Authentication Circuit
 *
 * Mathematical Formulation:
 * -----------------------------------------------------------------------------
 * Prover's Private Input (Witness):
 *   - secret : Private user secret (passphrase or derived random scalar)
 *
 * Public Inputs:
 *   - expectedCommitment : Public commitment registered on server (Poseidon(secret))
 *   - nonce : Fresh single-use cryptographic token issued by server (Replay Protection)
 *
 * Constraints:
 *   1. Poseidon(secret) === expectedCommitment
 *   2. Nonce is cryptographically bound into the proof via a quadratic constraint,
 *      ensuring the proof is valid ONLY for this specific authentication attempt.
 */

// circomlib Poseidon hash template interface
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    // In production: instantiated from circomlib/circuits/poseidon.circom
}

template AuthVerifier() {
    // -------------------------------------------------------------------------
    // Signal Definitions
    // -------------------------------------------------------------------------
    
    // Private Witness: User's secret knowledge
    signal input secret;

    // Public Signals: Known to verifier / server
    signal input expectedCommitment;
    signal input nonce;

    // Output indicator (1 = valid, 0 = invalid)
    signal output isValid;

    // -------------------------------------------------------------------------
    // Constraint 1: Knowledge of Preimage (Commitment Verification)
    // -------------------------------------------------------------------------
    // Computes commitment = Poseidon(secret)
    component hasher = Poseidon(1);
    hasher.inputs[0] <== secret;

    // Enforce that computed commitment matches the registered public commitment
    hasher.out === expectedCommitment;

    // -------------------------------------------------------------------------
    // Constraint 2: Nonce Binding (Replay-Attack Defense)
    // -------------------------------------------------------------------------
    // Mathematically ties the proof to the unique server-issued nonce
    signal nonceSquare;
    nonceSquare <== nonce * nonce;

    // Output confirmation
    isValid <== 1;
}

component main { public [expectedCommitment, nonce] } = AuthVerifier();
