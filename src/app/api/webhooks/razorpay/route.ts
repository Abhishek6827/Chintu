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

    // Razorpay payment entity has the email used during checkout
    const email = payment.email || notes.email || profile?.email || "N/A";
    const fullName = notes.fullName || profile?.full_name || email.split('@')[0] || "User";
    
    // Update profile in DB
    const RAZORPAY_PLANS: Record<string, { plan: string; credits: number; days: number }> = {
      "pro_monthly": { plan: "pro", credits: 200, days: 30 },
      "pro_annual": { plan: "pro", credits: 2400, days: 365 },
      "elite_monthly": { plan: "elite", credits: 1000, days: 30 },
      "elite_annual": { plan: "elite", credits: 12000, days: 365 },
    };

    const planKey = `${notes.planId}_${notes.billingCycle || "monthly"}`;
    const planInfo = RAZORPAY_PLANS[planKey] || RAZORPAY_PLANS["pro_monthly"];
    const quantity = parseInt(notes.quantity || "1");

    const purchasedCredits = planInfo.credits * quantity;
    const purchasedDays = planInfo.days * quantity;
    
    const now = new Date();
    let currentExpiry = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : now;
    if (currentExpiry < now) currentExpiry = now;
    const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalCredits = (profile?.credits || 0) + purchasedCredits;

    // Check for email conflicts before upsert
    let finalEmail = (email && email !== "N/A") ? email : profile?.email;
    if (finalEmail) {
      const { data: conflict } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", finalEmail)
        .neq("id", userId)
        .maybeSingle();
      
      if (conflict) {
        console.warn(`[Razorpay Webhook] Email conflict for ${finalEmail}. Fulfilling without updating email field.`);
        finalEmail = profile?.email; // Revert to existing email if it exists
      }
    }

    // PERFORM FULFILLMENT (Upsert)
    // DEDUPLICATION CHECK: Check if this payment was already processed (e.g. by verify route)
    const { data: alreadyProcessed } = await supabaseAdmin
      .from("profiles")
      .select("razorpay_payment_id")
      .eq("razorpay_payment_id", payment.id)
      .maybeSingle();

    if (alreadyProcessed) {
      console.log(`[Razorpay Webhook] Payment ${payment.id} already processed. Skipping duplicate fulfillment.`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: finalEmail,
      full_name: fullName || profile?.full_name,
      plan: planInfo.plan,
      credits: totalCredits,
      subscription_expires_at: newExpiry.toISOString(),
      payment_provider: "razorpay",
      razorpay_payment_id: payment.id,
      updated_at: new Date().toISOString(),
      theme: "dark"
    });

    const eventTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    }).replace(/,/g, '');

    const amountINR = Number(payment.amount) / 100;
    const newPlan = notes.planId || "Unknown";
    
    // Gateway Fees calculation (Razorpay subunits)
    const gatewayFee = (Number(payment.fee) || 0) / 100;
    const gatewayTax = (Number(payment.tax) || 0) / 100;
    const totalFees = gatewayFee + gatewayTax;
    const netAmount = amountINR - totalFees;

    // Notify Telegram
    await sendTelegramAlert(
      `💰 <b>New Subscription Captured! (Razorpay)</b>\n\n` +
      `👤 Name: <b>${fullName}</b>\n` +
      `📧 Email: <code>${email}</code>\n` +
      `📅 Date: <code>${eventTime}</code>\n` +
      `💎 Plan: <b>${profile?.plan?.toUpperCase() || "FREE"} → ${newPlan.toUpperCase()}</b>\n` +
      `💰 Amount: <b>₹${amountINR.toLocaleString()}</b> (Qty: ${quantity})\n` +
      `💸 Gateway Fees: <b>₹${totalFees.toFixed(2)}</b> (Incl. Tax)\n` +
      `🏦 Net Settlement: <b>₹${netAmount.toFixed(2)}</b>\n` +
      `⚡ Total Credits: <b>${totalCredits}</b>\n` +
      `🆔 ID: <code>${payment.id}</code>\n\n` +
      `✅ <i>Razorpay Secure fulfillment verified.</i>`
    );

    // Send Confirmation Email via Resend
    if (email !== "N/A") {
      try {
        const { Resend } = await import("resend");
        const { getPaymentEmailHtml } = await import("@/utils/email-templates");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'Chintu Intelligence <welcome@getchintu.com>',
          to: email,
          subject: 'CHINTU: PROTOCOL UPGRADE VERIFIED ⚡',
          html: getPaymentEmailHtml(
            fullName,
            newPlan,
            profile?.plan || "free",
            totalCredits,
            `₹${amountINR}`,
            eventTime,
            process.env.NEXT_PUBLIC_APP_URL || 'https://getchintu.com'
          ),
        });
        console.log(`[Razorpay Webhook] Confirmation email sent to ${email}`);
      } catch (emailErr) {
        console.error("[Razorpay Webhook] Failed to send email:", emailErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
