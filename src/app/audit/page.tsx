"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Hash,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id?: string;
  email: string;
  success: boolean;
  reason?: string;
  latency_ms: number;
  timestamp: string;
}

interface Metrics {
  totalUsers: number;
  totalNoncesIssued: number;
  activeSessions: number;
  totalAuthAttempts: number;
  successfulAuths: number;
  failedAuths: number;
}

export default function AuditPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAuditData() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/audit");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setLogs(data.recentLogs || []);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Security Monitoring & Anti-Replay Ledger
          </div>
          <h1 className="text-3xl font-extrabold text-white">Cryptographic Audit & Telemetry</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time event log tracking proof verifications, replay attack blocks, and nonce lifecycle.
          </p>
        </div>

        <button
          onClick={loadAuditData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Events</span>
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Registered Identities</span>
            <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>{metrics.totalUsers}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Active Nonce Challenges</span>
            <div className="text-2xl font-bold font-mono text-purple-400 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              <span>{metrics.totalNoncesIssued}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Successful Authentications</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{metrics.successfulAuths}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Rejected / Blocked Attacks</span>
            <div className="text-2xl font-bold font-mono text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{metrics.failedAuths}</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Live Authentication Event Stream
          </span>
          <span className="text-xs text-slate-500 font-mono">Showing latest {logs.length} attempts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Identity (User)</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Event Detail / Rejection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">{l.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        l.success
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {l.success ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SUCCESS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>BLOCKED</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">{l.latency_ms} ms</td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {l.reason || "Cryptographic Proof Verified"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No authentication events recorded yet. Run a login or attack simulation to see live records!
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
