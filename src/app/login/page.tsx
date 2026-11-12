"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  loadSecret,
  hasSecret,
  listStoredIdentities,
  generateEphemeralCommitment,
  generateProof,
  PublicIdentityInfo,
} from "@/lib/zkp/client-crypto";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Cpu,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Bug,
  RefreshCw,
} from "lucide-react";

interface StepProgress {
  step: number;
  label: string;
  detail: string;
}

const STEPS: StepProgress[] = [
  { step: 1, label: "Vault Check", detail: "Retrieving private witness scalar x from device vault" },
  { step: 2, label: "Server Challenge", detail: "Requesting fresh single-use time-limited nonce N from server" },
  { step: 3, label: "Ephemeral Point", detail: "Sampling ephemeral scalar r and computing curve point R = r · G" },
  { step: 4, label: "Proof Scalar", detail: "Evaluating Fiat-Shamir challenge c and proof response s = (r + c · x) mod L" },
  { step: 5, label: "Verification", detail: "Server verifies s · G ≡ R + c · C and atomically consumes nonce" },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [identities, setIdentities] = useState<PublicIdentityInfo[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [simulateReplay, setSimulateReplay] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [lastConsumedNonce, setLastConsumedNonce] = useState<string | null>(null);

  const [proofData, setProofData] = useState<{
    nonce?: string;
    rHex?: string;
    RHex?: string;
    cHex?: string;
    sHex?: string;
    latencyMs?: number;
    verified?: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const list = listStoredIdentities();
    setIdentities(list);
    const paramEmail = searchParams.get("email");
    if (paramEmail) {
      setEmail(paramEmail);
    } else if (list.length > 0 && !email) {
      setEmail(list[0].email);
    }
  }, [searchParams]);

  async function handleLogin() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Please enter your email or identity.");
      return;
    }

    setIsLoading(true);
    setProofData(null);

    try {
      // Step 1: Vault Check
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 120));
      const secretHex = loadSecret(trimmed);

      if (!secretHex) {
        throw new Error(
          "No cryptographic key found for this email on this device. Please register first or import an identity backup."
        );
      }

      // Step 2: Request Nonce from Server
      setCurrentStep(2);
      let nonce: string;
      let serverCommitment: string;

      if (simulateReplay && lastConsumedNonce) {
        // Replay attack simulation: use the already consumed nonce!
        nonce = lastConsumedNonce;
        toast.info("Replay Test: Reusing already consumed nonce!");
      } else {
        const nonceRes = await fetch("/api/auth/nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });

        const nonceData = await nonceRes.json();
        if (!nonceRes.ok || !nonceData.nonce) {
          throw new Error(nonceData.error || "Failed to acquire challenge nonce from server.");
        }
        nonce = nonceData.nonce;
        serverCommitment = nonceData.commitment;
        setLastConsumedNonce(nonce);
      }

      await new Promise((r) => setTimeout(r, 100));

      // Step 3: Ephemeral Commitment Point
      setCurrentStep(3);
      const ephemeral = generateEphemeralCommitment();
      await new Promise((r) => setTimeout(r, 100));

      // Step 4: Compute Fiat-Shamir Proof
      setCurrentStep(4);
      const proof = generateProof(
        secretHex,
        ephemeral.rHex,
        ephemeral.RHex,
        serverCommitment! || "00".repeat(32),
        nonce,
        trimmed
      );

      // If user toggled tamper simulation, tamper the scalar
      const finalSHex = simulateTamper
        ? "bad" + proof.sHex.slice(3)
        : proof.sHex;

      await new Promise((r) => setTimeout(r, 120));

      // Step 5: Server Verification
      setCurrentStep(5);
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          RHex: proof.RHex,
          sHex: finalSHex,
          nonce,
        }),
      });

      const verifyData = await verifyRes.json();

      setProofData({
        nonce,
        rHex: ephemeral.rHex,
        RHex: proof.RHex,
        cHex: proof.challengeHex,
        sHex: finalSHex,
        latencyMs: verifyData.latencyMs,
        verified: verifyData.verified === true,
        error: verifyData.error,
      });

      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Zero-Knowledge proof verification failed.");
      }

      toast.success(`Identity Verified in ${verifyData.latencyMs}ms! Session issued.`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      toast.error(msg);
      setProofData((prev) => (prev ? { ...prev, verified: false, error: msg } : { verified: false, error: msg }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Zero-Knowledge Identity Prover</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Prove knowledge of your discrete-log secret to the server without transmitting it over the wire.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        {/* Email or Identity Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200">Registered Email / Identity</label>
            {identities.length > 0 && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {identities.length} local key{identities.length > 1 ? "s" : ""} found
              </span>
            )}
          </div>

          <input
            type="email"
            value={email}
            disabled={isLoading}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@domain.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
          />

          {/* Quick-fill pills from local vault */}
          {identities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {identities.map((id) => (
                <button
                  key={id.email}
                  type="button"
                  onClick={() => setEmail(id.email)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-colors ${
                    email === id.email
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {id.email}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attack Simulator Controls (For Recruiters / Interviewers) */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Bug className="w-4 h-4 text-amber-400" />
              Recruiter & Security Attack Simulator
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/80">
              <input
                type="checkbox"
                checked={simulateTamper}
                onChange={(e) => setSimulateTamper(e.target.checked)}
                className="rounded border-slate-700 text-blue-600"
              />
              <span className="text-slate-300">
                Simulate Tampered Scalar <code className="text-amber-400">s' ≠ s</code>
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/80">
              <input
                type="checkbox"
                checked={simulateReplay}
                disabled={!lastConsumedNonce}
                onChange={(e) => setSimulateReplay(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 disabled:opacity-50"
              />
              <span className={lastConsumedNonce ? "text-slate-300" : "text-slate-500"}>
                Simulate Replay Attack {lastConsumedNonce ? "(Ready)" : "(Need 1 login first)"}
              </span>
            </label>
          </div>
        </div>

        {/* 5-Step Animated Visualizer */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cryptographic Proving Pipeline
          </div>
          <div className="space-y-2">
            {STEPS.map((s) => {
              const isPast = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div
                  key={s.step}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? "bg-blue-950/30 border-blue-500 text-white shadow-md shadow-blue-500/10"
                      : isPast
                      ? "bg-emerald-950/20 border-emerald-800/60 text-slate-300"
                      : "bg-slate-950 border-slate-800/60 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        isCurrent
                          ? "bg-blue-600 text-white animate-pulse"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isPast ? "✓" : s.step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="text-xs opacity-75">{s.detail}</div>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="text-xs font-mono text-blue-400 animate-pulse">Running...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleLogin}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Proving Knowledge of Secret...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate ZK Proof & Authenticate</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Cryptographic Inspector (Raw Variables) */}
        {proofData && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowInspector(!showInspector)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Raw Cryptographic Proof Inspector ({proofData.verified ? "VERIFIED" : "REJECTED"})
              </span>
              {showInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showInspector && (
              <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-800 text-slate-400">
                {proofData.nonce && (
                  <div>
                    <span className="text-blue-400">Nonce N: </span>
                    <span className="break-all text-slate-300">{proofData.nonce}</span>
                  </div>
                )}
                {proofData.RHex && (
                  <div>
                    <span className="text-purple-400">Ephemeral Point R (r·G): </span>
                    <span className="break-all text-slate-300">{proofData.RHex}</span>
                  </div>
                )}
                {proofData.cHex && (
                  <div>
                    <span className="text-amber-400">Challenge c (Fiat-Shamir): </span>
                    <span className="break-all text-slate-300">{proofData.cHex}</span>
                  </div>
                )}
                {proofData.sHex && (
                  <div>
                    <span className="text-emerald-400">Proof Scalar s (r + c·x): </span>
                    <span className="break-all text-slate-300">{proofData.sHex}</span>
                  </div>
                )}
                {proofData.latencyMs !== undefined && (
                  <div>
                    <span className="text-slate-400">Verification Latency: </span>
                    <span className="text-emerald-400 font-bold">{proofData.latencyMs} ms</span>
                  </div>
                )}
                {proofData.error && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                    Rejection Reason: {proofData.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-400 pt-2">
          Don't have a registered identity yet?{" "}
          <Link href="/register" className="text-blue-400 hover:underline font-medium">
            Register your public commitment here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading Zero-Knowledge Prover...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
