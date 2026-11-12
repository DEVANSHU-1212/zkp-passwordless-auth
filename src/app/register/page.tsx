"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  generateKeyPair,
  deriveSecretFromPassphrase,
  storeSecret,
  exportIdentityBackup,
} from "@/lib/zkp/client-crypto";
import {
  Sparkles,
  KeyRound,
  ShieldCheck,
  Lock,
  ArrowRight,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  Terminal,
  AlertCircle,
} from "lucide-react";

type Stage = "idle" | "generating" | "keysReady" | "submitting" | "registered";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [secretHex, setSecretHex] = useState("");
  const [commitmentHex, setCommitmentHex] = useState("");
  const [copiedCommitment, setCopiedCommitment] = useState(false);

  async function handleGenerateKeys() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address first.");
      return;
    }

    setStage("generating");
    try {
      // Artificial micro-pause for smooth tactile feedback
      await new Promise((r) => setTimeout(r, 150));

      const keypair = usePassphrase && passphrase.trim()
        ? deriveSecretFromPassphrase(passphrase.trim())
        : generateKeyPair();

      setSecretHex(keypair.secretHex);
      setCommitmentHex(keypair.commitmentHex);
      storeSecret(trimmed, keypair.secretHex, keypair.commitmentHex);

      setStage("keysReady");
      toast.success("Cryptographic keypair derived and vaulted in local browser storage!");
    } catch (err) {
      console.error(err);
      toast.error("Key generation failed. Please try again.");
      setStage("idle");
    }
  }

  async function handleRegisterServer() {
    const trimmed = email.trim().toLowerCase();
    if (!commitmentHex) {
      toast.error("Please generate your keys first.");
      return;
    }

    setStage("submitting");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          commitment: commitmentHex,
          // Invariant: NEVER send secretHex!
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setStage("registered");
      toast.success("Registration Complete! Server received ONLY your public commitment.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register";
      toast.error(msg);
      setStage("keysReady");
    }
  }

  function downloadBackup() {
    const backup = exportIdentityBackup(email.trim());
    if (!backup) {
      toast.error("No vault entry found to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zkp-identity-${email.trim().replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Identity backup downloaded! Keep this file offline.");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCommitment(true);
    setTimeout(() => setCopiedCommitment(false), 2000);
    toast.success("Copied to clipboard!");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Create Zero-Knowledge Identity</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Derive a private discrete-log scalar and register its public commitment. Your private key never touches the network.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        {/* Step 1: Email Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">User Identity (Email)</label>
          <input
            type="email"
            value={email}
            disabled={stage === "registered" || stage === "submitting"}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@domain.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
          />
        </div>

        {/* Secret Derivation Mode Toggle */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Derivation Method</span>
            <button
              type="button"
              onClick={() => setUsePassphrase(!usePassphrase)}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              {usePassphrase ? "Switch to Random High-Entropy Scalar" : "Derive from Human Passphrase"}
            </button>
          </div>

          {usePassphrase ? (
            <div className="space-y-1.5 pt-1">
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter secret passphrase or seed words"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Deterministic: SHA-256 seed maps into Curve25519 scalar field [1, L-1].
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Generates a cryptographically strong 256-bit random scalar using <code className="text-slate-300">crypto.getRandomValues()</code>.
            </p>
          )}
        </div>

        {/* Key Generation Trigger */}
        {stage === "idle" && (
          <button
            type="button"
            onClick={handleGenerateKeys}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate In-Browser Cryptographic Keys</span>
          </button>
        )}

        {/* Display Generated Keys */}
        {secretHex && commitmentHex && (
          <div className="space-y-4 pt-2">
            {/* Private Secret (Device Only) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Private Secret (x) — Stored In Local Vault Only
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? "Hide" : "Reveal"}</span>
                </button>
              </div>

              <div className="font-mono text-xs text-slate-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {showSecret ? secretHex : "•".repeat(64)}
              </div>
              <p className="text-[11px] text-slate-500">
                This scalar never leaves this browser. In the event of a server breach, an attacker learns zero bits of this.
              </p>
            </div>

            {/* Public Commitment */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Public Commitment Point (C = x · G)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(commitmentHex)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {copiedCommitment ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCommitment ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="font-mono text-xs text-blue-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {commitmentHex}
              </div>
              <p className="text-[11px] text-slate-500">
                This is the only value sent to the server. Due to the Discrete Log Problem, C cannot be reversed to x.
              </p>
            </div>

            {/* Action Bar */}
            {stage !== "registered" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadBackup}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON</span>
                </button>

                <button
                  type="button"
                  disabled={stage === "submitting"}
                  onClick={handleRegisterServer}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/25"
                >
                  {stage === "submitting" ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Commit to Server</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Registered Confirmation Banner */}
            {stage === "registered" && (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Identity Successfully Registered!</h4>
                    <p className="text-xs text-slate-300">
                      Server registered your public commitment. You can now prove your identity passwordlessly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={downloadBackup}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup</span>
                  </button>
                  <Link
                    href={`/login?email=${encodeURIComponent(email)}`}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 text-center"
                  >
                    <span>Proceed to Login Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
