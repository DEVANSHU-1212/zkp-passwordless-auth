import Link from "next/link";
import { Shield, Lock, Terminal, Code2, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-slate-100">Zero-Knowledge Passwordless Auth</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              A zero-trust cryptographic authentication system based on the Schnorr Identification Protocol
              and Circom 2.1 Groth16 zk-SNARKs. No passwords, credentials, or hashes ever touch the server.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Owner: DEW</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Status: v1.0 Production-Ready</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Zero-Budget Architecture</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider text-xs">
              Cryptographic Modules
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/register" className="hover:text-blue-400 transition-colors">
                  Key Generation & Local Vault
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition-colors">
                  5-Step Prover & Attack Tester
                </Link>
              </li>
              <li>
                <Link href="/benchmark" className="hover:text-blue-400 transition-colors">
                  Micro-Latency Benchmarks
                </Link>
              </li>
              <li>
                <Link href="/audit" className="hover:text-blue-400 transition-colors">
                  Security Event Logs
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Audited Primitives */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider text-xs">
              Standards & Papers
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <span className="text-slate-300">RFC 8032</span> (Ed25519 & Curve25519)
              </li>
              <li>
                <span className="text-slate-300">Schnorr 1990</span> (Sigma Protocol)
              </li>
              <li>
                <span className="text-slate-300">Fiat-Shamir 1986</span> (NIZKP Transformation)
              </li>
              <li>
                <span className="text-slate-300">Groth16 2016</span> (Succinct Pairing SNARKs)
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 DEW. Built with audited cryptographic libraries and zero external dependencies.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Cryptographic Proofs Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
