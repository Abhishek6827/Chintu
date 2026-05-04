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
      .select("full_name, email, plan, credits, display_id")
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
    
    // RESOLVE TARGET USER: Fallback to email if userId lookup fails
    let targetProfile = profile;
    if (!targetProfile && email && email !== "N/A") {
      console.warn(`[Razorpay Webhook] Profile not found for ID ${userId}. Falling back to email ${email}`);
      const { data: profileByEmail } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("email", email)
        .maybeSingle();
      targetProfile = profileByEmail;
    }

    const targetUserId = targetProfile?.id || userId;
    let currentExpiry = targetProfile?.subscription_expires_at ? new Date(targetProfile.subscription_expires_at) : now;
    if (currentExpiry < now) currentExpiry = now;
    const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const totalCredits = (targetProfile?.credits || 0) + purchasedCredits;

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

    const amountINR = Number(payment.amount) / 100;
    const gatewayFee = (Number(payment.fee) || 0) / 100;
    const gatewayTax = (Number(payment.tax) || 0) / 100;
    const totalFees = gatewayFee + gatewayTax;
    const netAmount = amountINR - totalFees;

    await supabaseAdmin.from("profiles").update({
      display_id: targetProfile?.display_id || `CHINTU-RAZORPAY-${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-')}-${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).replace(':', '')}`,
      email: finalEmail,
      full_name: fullName || targetProfile?.full_name,
      plan: planInfo.plan,
      credits: totalCredits,
      subscription_expires_at: newExpiry.toISOString(),
      payment_provider: "razorpay",
      razorpay_payment_id: payment.id,
      updated_at: new Date().toISOString(),
      profile_data: {
        ...(targetProfile?.profile_data || {}),
        payment_amount: amountINR,
        payment_type: "razorpay",
        last_payment_id: payment.id,
        last_gateway: "razorpay",
        last_payment_at: new Date().toISOString(),
        gateway_fee: totalFees
      }
    }).eq("id", targetUserId);

    const eventTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    }).replace(/,/g, '');

    const newPlan = notes.planId || "Unknown";

    // Notify Telegram
    await sendTelegramAlert(
      `💰 <b>New Subscription Captured! (Razorpay)</b> 💳\n\n` +
      `👤 <b>Name:</b> ${fullName}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `📅 <b>Date:</b> <code>${eventTime}</code>\n` +
      `💎 <b>Plan:</b> <b>${profile?.plan?.toUpperCase() || "FREE"} → ${newPlan.toUpperCase()}</b>\n` +
      `📅 <b>Expiry Date:</b> <b>${newExpiry.toLocaleDateString('en-IN')}</b>\n` +
      `💰 <b>Amount:</b> <b>₹${amountINR.toLocaleString()}</b> (Qty: ${quantity})\n` +
      `💸 <b>Gateway Fees:</b> <b>₹${totalFees.toFixed(2)}</b> (Incl. Tax)\n` +
      `🏦 <b>Net Settlement:</b> <b>₹${netAmount.toFixed(2)}</b>\n` +
      `⚡ <b>Total Credits:</b> <b>${totalCredits}</b>\n` +
      `🆔 <b>ID:</b> <code>${payment.id}</code>\n\n` +
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
            process.env.NEXT_PUBLIC_APP_URL || 'https://getchintu.com',
            newExpiry.toLocaleDateString('en-IN')
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
