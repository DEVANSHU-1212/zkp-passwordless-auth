# Circom 2.1 ZKP Authentication Circuit

This directory contains the Zero-Knowledge SNARK circuit definition for proving knowledge of a registered secret preimage without revealing the secret, bound to an anti-replay server nonce.

---

## 1. Circuit Architecture

### `auth.circom`
- **Private Input (Witness):** `secret` (User's private scalar)
- **Public Inputs:**
  - `expectedCommitment`: $Poseidon(secret)$ stored on server
  - `nonce`: Server-generated single-use random value (replay protection)
- **Output:** `isValid` ($1$)
- **Constraints Enforced:**
  1. $Poseidon(secret) = expectedCommitment$ (Proof of Knowledge of Preimage)
  2. Nonce is constrained to the circuit R1CS system, preventing replay forgery.

---

## 2. Compilation and Setup Pipeline

### Prerequisites
- [Circom compiler](https://docs.circom.io/getting-started/installation/) (`circom --version` >= 2.1.6)
- Node.js & `snarkjs` (`npm install -g snarkjs` or local dependency)
- `circomlib` (`npm install circomlib`)

### Step 1: Compile Circuit to R1CS and WASM
```bash
circom auth.circom --r1cs --wasm --sym -o build/
```

### Step 2: Trusted Setup (Groth16 Ceremony)
Groth16 requires a two-phase trusted setup:
1. **Phase 1 (Powers of Tau - Universal Ceremony):**
   Download an existing ceremony file (e.g., Hermez powersOfTau28_hez_final_10.ptau) to save time and ensure zero budget:
   ```bash
   curl -O https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
   ```

2. **Phase 2 (Circuit-Specific Setup):**
   ```bash
   # Generate zkey seed
   snarkjs groth16 setup build/auth.r1cs powersOfTau28_hez_final_10.ptau build/auth_0000.zkey

   # Contribute randomness
   snarkjs zkey contribute build/auth_0000.zkey build/auth_final.zkey --name="Portfolio Demo" -v -e="some random text"

   # Export verification key JSON (pinned on backend)
   snarkjs zkey export verification_key build/auth_final.zkey build/verification_key.json
   ```

### Step 3: Export Solidity Verifier Contract
```bash
snarkjs zkey export solidityverifier build/auth_final.zkey ../contracts/ZKPVerifier.sol
```

### Step 4: In-Browser Proving Workflow
The client loads:
- `build/auth_js/auth.wasm`
- `build/auth_final.zkey`

And computes the Groth16 proof using `snarkjs.groth16.fullProve()` in ~200-500ms on client CPU without disclosing the secret.

