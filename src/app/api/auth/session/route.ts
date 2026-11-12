import { NextRequest, NextResponse } from "next/server";
import { validateSession, getUserByEmail } from "@/lib/zkp/store";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionCookie = request.cookies.get("zkp_auth_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const token = sessionCookie || bearerToken;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ authenticated: false, error: "Session expired or invalid" }, { status: 401 });
    }

    const user = await getUserByEmail(session.email);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        email: session.email,
        commitment: user?.commitment || null,
        sessionExpiresAt: session.expires_at,
        lastLoginAt: user?.last_login_at || null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error validating session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
