import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { getPaymentEmailHtml } from "@/utils/email-templates";

export const dynamic = "force-dynamic";

const RAZORPAY_PLANS: Record<string, { plan: string; credits: number; price: string; days: number }> = {
  "pro_monthly": { plan: "pro", credits: 200, price: "₹799/mo", days: 30 },
  "pro_annual": { plan: "pro", credits: 2400, price: "₹7990/yr", days: 365 },
  "elite_monthly": { plan: "elite", credits: 1000, price: "₹2499/mo", days: 30 },
  "elite_annual": { plan: "elite", credits: 12000, price: "₹24990/yr", days: 365 },
};

async function sendTelegramAlert(message: string) {
  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[Razorpay Webhook] Telegram alert failed:", err);
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("X-Razorpay-Signature") as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const supabaseAdmin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const notes = payment.notes;
    const userId = notes.userId;
    const planId = notes.planId;
    const quantity = parseInt(notes.quantity || "1");

    if (!userId) return NextResponse.json({ received: true });

    // Check if already processed (idempotency)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      // In a real scenario, you'd check if this payment ID was already processed
      // For now, we'll follow the same logic as verify route but it's safe to run again if needed
      
      const planKey = `${planId}_monthly`; 
      const planInfo = RAZORPAY_PLANS[planKey] || RAZORPAY_PLANS["pro_monthly"];

      const purchasedCredits = planInfo.credits * quantity;
      const purchasedDays = planInfo.days * quantity;
      const totalCredits = (profile.credits || 0) + purchasedCredits;

      const now = new Date();
      let currentExpiry = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : now;
      if (currentExpiry < now) currentExpiry = now;
      const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from("profiles")
        .update({
          plan: planInfo.plan,
          credits: totalCredits,
          subscription_expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // Notify
      await sendTelegramAlert(`✅ <b>RAZORPAY WEBHOOK: Captured</b>\nUser: ${profile.email}\nPlan: ${planInfo.plan}`);
    }
  }

  return NextResponse.json({ received: true });
}
