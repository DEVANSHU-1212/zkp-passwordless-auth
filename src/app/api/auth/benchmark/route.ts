import { NextResponse } from "next/server";
import { benchmarkZkp } from "@/lib/zkp/crypto";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const singleRun = benchmarkZkp();

    // Multi-iteration statistical benchmark
    const runs = 20;
    const proveLatencies: number[] = [];
    const verifyLatencies: number[] = [];

    for (let i = 0; i < runs; i++) {
      const b = benchmarkZkp();
      proveLatencies.push(b.proveMs);
      verifyLatencies.push(b.verifyMs);
    }

    const avgProve = Number((proveLatencies.reduce((a, b) => a + b, 0) / runs).toFixed(3));
    const avgVerify = Number((verifyLatencies.reduce((a, b) => a + b, 0) / runs).toFixed(3));
    const minVerify = Math.min(...verifyLatencies);
    const maxVerify = Math.max(...verifyLatencies);

    return NextResponse.json({
      success: true,
      singleRun,
      stats: {
        iterations: runs,
        avgProveMs: avgProve,
        avgVerifyMs: avgVerify,
        minVerifyMs: minVerify,
        maxVerifyMs: maxVerify,
        curve: "Curve25519 (Ed25519 subgroup)",
        securityBits: 128,
        proofSizeBytes: 64, // R (32 bytes) + s (32 bytes)
        targetMet: avgVerify < 200, // Non-functional requirement from PRD (< 200ms)
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Benchmark failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

