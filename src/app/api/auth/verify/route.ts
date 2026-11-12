import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  validateAndConsumeNonce,
  createSession,
  logAuthAttempt,
  checkRateLimit,
} from "@/lib/zkp/store";
import { verifyProof } from "@/lib/zkp/crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();

  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`verify:${ip}`, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many authentication attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();
    const { RHex, sHex, nonce } = body;

    if (!email || !RHex || !sHex || !nonce) {
      return NextResponse.json(
        { error: "Missing required proof parameters: email, RHex, sHex, nonce." },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      const latencyMs = Number((performance.now() - startTime).toFixed(2));
      await logAuthAttempt(email, false, latencyMs, undefined, "User identity not found");
      return NextResponse.json({ error: "Invalid authentication credentials." }, { status: 401 });
    }

    // Step 1: Validate & atomically consume single-use nonce (Anti-Replay Defense)
    const nonceCheck = await validateAndConsumeNonce(nonce, user.id);
    if (!nonceCheck.valid) {
      const latencyMs = Number((performance.now() - startTime).toFixed(2));
      await logAuthAttempt(email, false, latencyMs, user.id, nonceCheck.reason);
      return NextResponse.json(
        { error: nonceCheck.reason || "Invalid or already-consumed nonce." },
        { status: 401 }
      );
    }

    // Step 2: Cryptographic Proof Verification: s · G ≡ R + c · C
    const verification = verifyProof(user.commitment, RHex, sHex, nonce, email);
    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    if (!verification.valid) {
      await logAuthAttempt(email, false, latencyMs, user.id, verification.reason);
      return NextResponse.json(
        {
          error: verification.reason || "Zero-Knowledge proof verification failed.",
          verified: false,
        },
        { status: 401 }
      );
    }

    // Step 3: Success! Issue authenticated session
    const session = await createSession(user.id, user.email);
    await logAuthAttempt(email, true, latencyMs, user.id, "Authenticated successfully via ZKP");

    const response = NextResponse.json({
      success: true,
      verified: true,
      latencyMs,
      session: {
        token: session.token,
        email: session.email,
        expiresAt: session.expires_at,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "zkp_auth_session",
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: unknown) {
    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    const message = err instanceof Error ? err.message : "Verification error";
    return NextResponse.json({ error: message, latencyMs }, { status: 500 });
  }
}

