"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Server,
  Laptop,
  Database,
  RefreshCw,
  EyeOff,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -top-20 flex items-center justify-center pointer-events-none -z-10">
          <div className="w-[600px] h-[300px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Zero-Budget Applied Cryptography Project
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Login without ever sending or{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            storing a password.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zero-Knowledge authentication system where the server holds zero passwords or hashes—only a public commitment.
          The user proves knowledge of their private secret on-device in under 5ms without ever revealing it.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Register ZKP Identity</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all hover:scale-[1.02]"
          >
            <Lock className="w-5 h-5 text-indigo-400" />
            <span>Live Prover Demo & Attacks</span>
          </Link>

          <Link
            href="/benchmark"
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Benchmark Engine</span>
          </Link>
        </div>

        {/* Fast metric pills */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-white font-mono">0 bits</div>
            <div className="text-xs text-slate-400 mt-1">Secret Data Stored on Server</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-emerald-400 font-mono">&lt; 5 ms</div>
            <div className="text-xs text-slate-400 mt-1">Verification Latency</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-blue-400 font-mono">60 sec</div>
            <div className="text-xs text-slate-400 mt-1">Single-Use Nonce Window</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-2xl font-bold text-purple-400 font-mono">128-bit</div>
            <div className="text-xs text-slate-400 mt-1">Classical Cryptographic Security</div>
          </div>
        </div>
      </section>

      {/* The Problem Statement Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-400">The Problem</h2>
          <p className="mt-2 text-3xl font-extrabold text-white">Why Centralized Password Stores Fail</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Database Leaks & Cracking</h3>
            <p className="text-sm text-slate-400">
              Even salted SHA-256 or bcrypt hashes get leaked in server breaches. With cloud GPU clusters, billions of
              passwords are cracked every week.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Credential Stuffing & Reuse</h3>
            <p className="text-sm text-slate-400">
              Users repeatedly reuse simple passwords across services. Compromise of one peripheral website endangers
              critical accounts across the internet.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Fragile Magic Links & SMS OTP</h3>
            <p className="text-sm text-slate-400">
              Current passwordless alternatives outsource trust to email or telecom providers, introducing SIM swap
              vulnerabilities and high provider costs.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture & Flow Diagram */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Architecture</h2>
            <p className="mt-2 text-3xl font-extrabold text-white">Interactive Cryptographic Protocol</p>
            <p className="text-slate-400 text-sm mt-2">
              Based on the Schnorr Sigma Protocol with Fiat-Shamir transformation over Curve25519 (Ed25519 group).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Phase 1: Registration */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Phase 1: Registration
                  </span>
                  <Laptop className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Client Vault & Commitment Creation</h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono font-bold">1.</span>
                    <span>Client samples private secret scalar <code className="text-blue-300 font-mono">x ∈ [1, L-1]</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono font-bold">2.</span>
                    <span>Client derives public point <code className="text-blue-300 font-mono">C = x · G</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono font-bold">3.</span>
                    <span>Client vaults <code className="text-emerald-400 font-mono">x</code> locally in device memory.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono font-bold">4.</span>
                    <span>Server receives ONLY <code className="text-purple-300 font-mono">(username, C)</code>.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Invariant: If server DB leaks, finding <code className="text-slate-200">x</code> requires solving Discrete Log on Curve25519 (2^128 security).</span>
              </div>
            </div>

            {/* Phase 2: Login */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Phase 2: Zero-Knowledge Proving
                  </span>
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fiat-Shamir Proof with Fresh Nonce</h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono font-bold">1.</span>
                    <span>Server issues fresh single-use nonce <code className="text-emerald-300 font-mono">N</code> (60s TTL).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono font-bold">2.</span>
                    <span>Client picks random ephemeral <code className="text-emerald-300 font-mono">r</code>, computes <code className="text-emerald-300 font-mono">R = r · G</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono font-bold">3.</span>
                    <span>Challenge computed: <code className="text-emerald-300 font-mono">c = H(R || C || N || user) mod L</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono font-bold">4.</span>
                    <span>Client sends proof response: <code className="text-emerald-300 font-mono">s = (r + c · x) mod L</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono font-bold">5.</span>
                    <span>Server checks: <code className="text-emerald-300 font-mono">s · G ≡ R + c · C</code> and consumes <code className="text-slate-200 font-mono">N</code>.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Replay Guard: Proof contains nonce <code className="text-slate-200">N</code> in hash. Old proofs fail instantly when re-sent.</span>
              </div>
            </div>
          </div>

          {/* Mathematical Proof of Correctness */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950/40 border border-blue-900/40">
            <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-2">
              Mathematical Completeness Proof
            </h4>
            <div className="font-mono text-sm sm:text-base text-slate-200 overflow-x-auto py-2">
              s · G = (r + c · x) · G = r · G + c · (x · G) = R + c · C ✓
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Since G generates a prime-order subgroup of order L, the equation holds perfectly if and only if the prover
              computed s using the exact secret x corresponding to C.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-400">Comparison</h2>
          <p className="mt-2 text-3xl font-extrabold text-white">Authentication Mechanisms Compared</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-4 px-4 font-semibold">Security Feature</th>
                <th className="py-4 px-4 font-semibold text-rose-400">Traditional Passwords</th>
                <th className="py-4 px-4 font-semibold text-amber-400">WebAuthn / Passkeys</th>
                <th className="py-4 px-4 font-semibold text-blue-400">ZKP Authentication (This Project)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-4 px-4 font-medium text-white">Server Secret Storage</td>
                <td className="py-4 px-4 text-rose-400">Hash (vulnerable to leak)</td>
                <td className="py-4 px-4 text-emerald-400">Public Key</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Public Commitment Point C</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Transmitted over Network</td>
                <td className="py-4 px-4 text-rose-400">Plaintext password</td>
                <td className="py-4 px-4 text-slate-300">Signed challenge</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Zero-Knowledge Proof (R, s)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Replay-Attack Protection</td>
                <td className="py-4 px-4 text-rose-400">No (re-send password)</td>
                <td className="py-4 px-4 text-emerald-400">Yes (nonce challenge)</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Yes (60s Atomic Single-Use Nonce)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Hardware / Browser Lock-in</td>
                <td className="py-4 px-4 text-slate-400">None</td>
                <td className="py-4 px-4 text-amber-400">Requires FIDO2 / TPM chip</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Universal (Pure JS/WASM on any browser)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">On-Chain Smart Contract Verifiable</td>
                <td className="py-4 px-4 text-rose-400">Impossible</td>
                <td className="py-4 px-4 text-amber-400">Expensive (secp256r1 precompile)</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Yes (BN254 pairing precompile 0x08)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Threat Model & Mitigations (PRD Section 12) */}
      <section id="threat-model" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Security Invariants</h2>
          <p className="mt-2 text-3xl font-extrabold text-white">Threat Model & Mitigations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Threat: Complete Server Database Breach</span>
            </div>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-200">Mitigation:</strong> Database contains only public commitments <code className="text-blue-300">C = x · G</code>.
              Recovering secret <code className="text-blue-300">x</code> requires solving the discrete logarithm on Curve25519, which is computationally intractable.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Threat: Network Interception & Proof Replay</span>
            </div>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-200">Mitigation:</strong> Every login binds a server-generated random nonce into the challenge hash <code className="text-blue-300">c</code>.
              The verifier atomically consumes the nonce; reusing it triggers an immediate rejection.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Threat: Forged or Tampered Proof Scalars</span>
            </div>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-200">Mitigation:</strong> The equation <code className="text-blue-300">s · G = R + c · C</code> holds with probability at most <code className="text-blue-300">2^-252</code> without knowledge of the private discrete logarithm.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Threat: Brute-Force & Denial-of-Service</span>
            </div>
            <p className="text-xs text-slate-400">
              <strong className="text-slate-200">Mitigation:</strong> Enforced in-memory and IP-based rate limiting per username and per network subnet, plus generic error messages to prevent user enumeration.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-blue-900/30 to-indigo-950/40 border border-blue-800/40 space-y-6">
          <h2 className="text-3xl font-extrabold text-white">Experience Zero-Knowledge in Action</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Test key generation, in-browser proving, live attack simulations, and microsecond benchmarks right now in your browser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all"
            >
              Start Registration
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all"
            >
              Test Prover & Attacks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
