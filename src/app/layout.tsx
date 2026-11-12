import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Passwordless Authentication via Zero-Knowledge Proofs",
  description:
    "Zero-Knowledge passwordless authentication system using Schnorr Sigma Protocol on Curve25519 and Circom 2.1 Groth16 zk-SNARKs. Login without ever sending or storing a password.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
