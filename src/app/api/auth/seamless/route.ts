import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const token = await client.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 60, // Token valid for 60 seconds
    });

    return NextResponse.json({ token: token.token });
  } catch (err) {
    console.error("Seamless Auth Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
