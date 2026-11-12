"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  CheckCircle2,
  Clock,
  Activity,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { deleteSecret, loadSecret } from "@/lib/zkp/client-crypto";

interface UserProfile {
  id: string;
  email: string;
  commitment: string | null;
  sessionExpiresAt: number;
  lastLoginAt: string | null;
}

interface AuditLog {
  id: string;
  timestamp: string;
  success: boolean;
  reason?: string;
  latency_ms: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [hasLocalSecret, setHasLocalSecret] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (!data.authenticated || !data.user) {
          router.push("/login");
          return;
        }

        setUser(data.user);
        setHasLocalSecret(loadSecret(data.user.email) !== null);

        // Fetch recent audit events
        const auditRes = await fetch("/api/auth/audit");
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setLogs(auditData.recentLogs || []);
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  function copyCommitment() {
    if (!user?.commitment) return;
    navigator.clipboard.writeText(user.commitment);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success("Public commitment copied to clipboard!");
  }

  function handleRevokeLocal() {
    if (!user) return;
    if (confirm("Are you sure you want to purge your local vault key? You will need an offline backup to log in again.")) {
      deleteSecret(user.email);
      setHasLocalSecret(false);
      toast.success("Local vault key purged from browser storage.");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Verifying Zero-Knowledge Session Token...</p>
      </div>
    );
  }

  if (!user) return null;

  const sessionRemainingMinutes = Math.max(
    0,
    Math.round((user.sessionExpiresAt - Date.now()) / (60 * 1000))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Authenticated via Zero-Knowledge Proof
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Protected User Dashboard</h1>
          <p className="text-sm text-slate-400 font-mono mt-0.5">{user.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Commitment Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Registered Public Commitment Point (C)
            </span>
            <button
              onClick={copyCommitment}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 break-all">
            {user.commitment || "No public commitment recorded"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <span className="text-slate-400">User UUID:</span>
              <div className="font-mono text-slate-300 text-[11px] truncate">{user.id}</div>
            </div>
            <div>
              <span className="text-slate-400">Session Valid For:</span>
              <div className="font-mono text-emerald-400 font-semibold">{sessionRemainingMinutes} minutes</div>
            </div>
          </div>
        </div>

        {/* Vault Status Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Browser Vault Status
            </span>
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${hasLocalSecret ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                <span>
                  Private Key (x): <strong>{hasLocalSecret ? "Stored locally" : "Not found in this browser"}</strong>
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Your private key scalar is confined inside this browser's local memory and is never shared across devices.
              </p>
            </div>
          </div>

          {hasLocalSecret && (
            <button
              onClick={handleRevokeLocal}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-900/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Local Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Security Properties Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Active Zero-Knowledge Guarantees
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <strong className="text-white block mb-1">Discrete-Log Invariant:</strong>
            Server database contains 0 bits of your secret key x.
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <strong className="text-white block mb-1">Anti-Replay Proof:</strong>
            Your login proof was bound to a single-use 60s server nonce.
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <strong className="text-white block mb-1">EVM Compatible:</strong>
            Verification can also execute on Sepolia testnet precompiles.
          </div>
        </div>
      </div>

      {/* Recent Security Logs */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            Recent Authentication Activity & Latencies
          </span>
          <Link href="/audit" className="text-xs text-blue-400 hover:underline">
            View Full Audit Table →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Verification Latency</th>
                <th className="py-2.5 px-3">Event Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.slice(0, 5).map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        l.success
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {l.success ? "VERIFIED" : "REJECTED"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">{l.latency_ms} ms</td>
                  <td className="py-2.5 px-3 text-slate-400">{l.reason || "ZKP Verification"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No authentication events logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
