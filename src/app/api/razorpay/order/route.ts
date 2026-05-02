import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, currency = "INR", planId, quantity = 1, billingCycle = "monthly", email, fullName } = await req.json();

  // Prevent duplicate subscriptions across different accounts with the same email
  if (email) {
    const supabaseAdmin = createAdminClient();
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, plan, email")
      .eq("email", email)
      .neq("id", userId) // Check other accounts
      .in("plan", ["pro", "elite"])
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ 
        error: "Another account with this email already has an active subscription. Please login with that account." 
      }, { status: 400 });
    }
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });

    try {
    if (!amount) {
      return NextResponse.json({ error: "Missing amount" }, { status: 400 });
    }

    // Razorpay amount is in subunits (1 INR = 100 paise, 1 USD = 100 cents)
    const options = {
      amount: Math.round(amount), 
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        planId,
        quantity: quantity.toString(),
        billingCycle,
        email: email || "",
        fullName: fullName || "",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[/api/razorpay/order] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
