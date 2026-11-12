import { NextResponse } from "next/server";
import { getAuthLogs, getStoreMetrics } from "@/lib/zkp/store";

export async function GET(): Promise<NextResponse> {
  try {
    const logs = await getAuthLogs();
    const metrics = await getStoreMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      recentLogs: logs.slice(0, 50),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
