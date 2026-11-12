import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createNonce, checkRateLimit } from "@/lib/zkp/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`nonce:${ip}`, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded for challenge requests. Please wait." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Artificial delay to prevent timing attacks / user enumeration
      await new Promise((resolve) => setTimeout(resolve, 80));
      return NextResponse.json(
        { error: "No registered ZKP identity found for this email. Please register first." },
        { status: 404 }
      );
    }

    // Generate single-use nonce with 60-second TTL
    const nonce = await createNonce(user.id, 60);

    return NextResponse.json({
      success: true,
      nonce,
      commitment: user.commitment, // Return registered commitment for client-side key verification
      expiresInSeconds: 60,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error issuing cryptographic nonce";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

