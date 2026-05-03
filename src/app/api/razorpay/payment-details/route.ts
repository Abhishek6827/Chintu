import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

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

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      amount: Number(payment.amount) / 100, // Convert paise to rupees
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
    });
  } catch (error: any) {
    console.error("Razorpay payment details fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
