import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/server";
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
    const userId = notes.userId;
    
    // Log for records
    console.log(`[Razorpay Webhook] Payment Captured: ${payment.id} for User: ${userId}`);
    
    // Fetch user details for a better alert
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, plan, credits")
      .eq("id", userId)
      .maybeSingle();

    let email = profile?.email;
    if (!email) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress 
             || clerkUser.emailAddresses[0]?.emailAddress;
      } catch (err) {
        console.error("[Razorpay Webhook] Clerk email fetch failed:", err);
      }
    }

    const customerName = profile?.full_name || email || "Unknown User";
    const displayEmail = email || "N/A";
    const eventTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    const amountINR = payment.amount / 100;
    const newPlan = notes.planId || "Unknown";
    const quantity = notes.quantity || "1";

    // Notify Telegram
    await sendTelegramAlert(
      `💰 <b>New Subscription Captured! (Razorpay Webhook)</b>\n\n` +
      `👤 Name: <b>${customerName}</b>\n` +
      `📧 Email: <code>${displayEmail}</code>\n` +
      `📅 Date: <code>${eventTime}</code>\n` +
      `💎 Plan: <b>${profile?.plan?.toUpperCase() || "FREE"} → ${newPlan.toUpperCase()}</b>\n` +
      `💲 Price: <b>₹${amountINR.toLocaleString()}</b> (Qty: ${quantity})\n` +
      `⚡ Current Credits: <b>${profile?.credits || 0}</b>\n` +
      `💳 ID: <code>${payment.id}</code>\n\n` +
      `⚠️ <i>Async webhook verification complete.</i>`
    );
  }

  return NextResponse.json({ received: true });
}
