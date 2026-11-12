import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/zkp/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get("zkp_auth_session")?.value;
  if (sessionToken) {
    await revokeSession(sessionToken);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("zkp_auth_session");
  return response;
}

