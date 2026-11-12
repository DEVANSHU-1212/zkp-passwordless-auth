"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Cpu, Activity, KeyRound, Sparkles, Terminal } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Overview", href: "/" },
    { label: "Benchmark", href: "/benchmark", icon: Cpu },
    { label: "Security Audit", href: "/audit", icon: Activity },
    { label: "Dashboard", href: "/dashboard", icon: KeyRound },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-lg tracking-tight">ZKP Auth</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                ZK-SNARK / Schnorr
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Zero-Knowledge Passwordless Auth</p>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-blue-400 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 opacity-70" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-3.5 py-1.5 text-sm font-medium text-slate-200 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Prove Identity
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Register</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

