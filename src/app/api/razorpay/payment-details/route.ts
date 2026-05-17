import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    // Try Razorpay first
    let razorpayData: { amount?: number; currency?: string; method?: string; status?: string; createdAt?: string | null } | null = null;
    try {
      const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
      });
      const payment = await razorpay.payments.fetch(paymentId);
      if (payment) {
        razorpayData = {
          amount: Number(payment.amount) / 100,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          createdAt: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : null,
        };
      }
    } catch (rzErr: any) {
      console.error("[payment-details] Razorpay fetch failed:", paymentId, rzErr?.message || rzErr);
      // Continue to fallback — don’t return error yet
    }

    // If Razorpay worked, return it immediately
    if (razorpayData) {
      return NextResponse.json(razorpayData);
    }

    // Fallback: read cached data from the user’s profile in Supabase
    const client = await clerkClient();
    const userObj = await client.users.getUser(userId);
    const email = userObj.emailAddresses[0]?.emailAddress;
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("profile_data")
      .eq("email", email)
      .maybeSingle();

    const cached = profile?.profile_data as any;
    if (cached?.payment_amount || cached?.payment_type) {
      return NextResponse.json({
        amount: typeof cached.payment_amount === "number" ? cached.payment_amount : Number(cached.payment_amount) || undefined,
        currency: "INR",
        method: cached.payment_type,
        status: "captured",
        createdAt: cached.last_payment_at || null,
        _source: "profile_cache",
      });
    }

    // Nothing found anywhere
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  } catch (error: any) {
    console.error("[payment-details] Unexpected error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
