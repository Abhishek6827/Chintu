import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
export const dynamic = "force-dynamic";

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

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const notes = payment.notes;
    
    // Log for records
    console.log(`[Razorpay Webhook] Payment Captured: ${payment.id} for User: ${notes.userId}`);
    
    // Notify Telegram (Optional logging)
    await sendTelegramAlert(`💳 <b>RAZORPAY EVENT: Captured</b>\nID: <code>${payment.id}</code>\nUser: ${notes.userId}`);
  }

  return NextResponse.json({ received: true });
}
