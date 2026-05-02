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

  // Use admin client to fetch user profile for backend validation
  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  // Prevent downgrades (Elite -> Pro) at the API level
  if (profile?.plan === "elite" && planId === "pro") {
    return NextResponse.json({ 
      error: "You are already on the Elite plan. Downgrades are not allowed via this portal." 
    }, { status: 400 });
  }

  // Note: Strict email conflict check was removed to allow multi-account users to proceed.
  // Verification route handles profile updates gracefully.



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
