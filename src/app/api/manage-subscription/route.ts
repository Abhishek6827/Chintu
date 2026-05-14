import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const userObj = await client.users.getUser(userId);
  const email = userObj.emailAddresses[0]?.emailAddress;

  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("payment_provider, stripe_customer_id")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "No profile found" }, { status: 404 });
  }

  const provider = (profile.payment_provider || "").toLowerCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ─── Stripe Customer Portal ─────────────────────────────
  if (provider === "stripe" && profile.stripe_customer_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2024-06-20" as any,
      });

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${appUrl}/room`,
      });

      return NextResponse.json({ url: session.url, provider: "stripe" });
    } catch (error: any) {
      console.error("[manage-subscription] Stripe portal error:", error.message);
      return NextResponse.json({ error: "Failed to create Stripe portal session" }, { status: 500 });
    }
  }

  // ─── Razorpay ───────────────────────────────────────────
  if (provider === "razorpay") {
    return NextResponse.json({
      url: `${appUrl}/subscription`,
      provider: "razorpay"
    });
  }

  // ─── Fallback: Unknown Provider ─────────────────────────
  return NextResponse.json({
    error: "No payment provider found. Please contact support.",
    supportUrl: `${appUrl}/support`
  }, { status: 400 });
}
