import { NextRequest, NextResponse } from "next/server";
import { registerUser, getUserByEmail, checkRateLimit } from "@/lib/zkp/store";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`register:${ip}`, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();
    const commitment = body.commitment?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!commitment || commitment.length < 32) {
      return NextResponse.json(
        { error: "Invalid public commitment. Must be a valid curve point in hex format." },
        { status: 400 }
      );
    }

    // Never accept private keys on the server!
    if (body.secret || body.secretHex || body.privateKey || body.password) {
      return NextResponse.json(
        { error: "Security violation: Server never accepts private keys or secrets!" },
        { status: 400 }
      );
    }

    const user = await registerUser(email, commitment);

    return NextResponse.json({
      success: true,
      message: "Public commitment successfully registered. No secret was stored.",
      user: {
        id: user.id,
        email: user.email,
        commitment: user.commitment,
        createdAt: user.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
