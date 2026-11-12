# Solidity On-Chain Verifier Contract (Sepolia Testnet)

This contract (`ZKPVerifier.sol`) provides an on-chain verification and decentralized identity commitment registry option.

---

## Capabilities
1. **Decentralized Commitment Registry (`registerCommitment`):**
   Users can store their public commitment $C = Poseidon(x)$ directly in Ethereum Sepolia storage without trusting any central server.
2. **On-Chain Groth16 Verifier (`verifyProof`):**
   Calls Ethereum EIP-197 elliptic curve pairing precompiles (address `0x08`) on the `alt_bn128` (BN254) curve to verify the ZK-SNARK in gas-efficient EVM bytecode.
3. **On-Chain Anti-Replay Guard (`consumedNonces`):**
   Stores a `keccak256` hash of used nonces to reject on-chain transaction replay attacks.

---

## Deployment Guide (Hardhat / Foundry)

```bash
# Compile
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```
