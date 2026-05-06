
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

// ─── Shared buildTelegramMessage helper (copy from stripe webhook or move to utils) ───
function buildTelegramMessage({
  header,
  name,
  email,
  dateTime,
  oldPlan,
  newPlan,
  amount,
  planPrice,
  quantity = 1,
  paymentMethod,
  gatewayFees,
  oldCredits,
  newCredits,
  addedCredits,
  addedDays,
  expiryDate,
  transactionId,
  status = "SUCCESSFUL",
  extraNote,
}: {
  header: string;
  name: string;
  email: string;
  dateTime: string;
  oldPlan: string;
  newPlan: string;
  amount: string;
  planPrice: string;
  quantity?: number;
  paymentMethod: string;
  gatewayFees: string;
  oldCredits: number;
  newCredits: number;
  addedCredits: number;
  addedDays: number;
  expiryDate: string;
  transactionId: string;
  status?: string;
  extraNote?: string;
}): string {
  return (
    `<b>${header}</b>\n\n` +
    `👤 <b>Name:</b> ${name}\n` +
    `📧 <b>Email:</b> <code>${email}</code>\n` +
    `📅 <b>Date & Time:</b> <code>${dateTime}</code>\n` +
    `📊 <b>Plan:</b> <b>${oldPlan.toUpperCase()} → ${newPlan.toUpperCase()}</b>\n` +
    `💰 <b>Total Amount:</b> <b>${amount}</b> (Qty: ${quantity})\n` +
    `💳 <b>Payment Method:</b> ${paymentMethod}\n\n` +
    `💎 <b>Plan Price:</b> <b>${planPrice}</b>\n` +
    `💸 <b>Gateway Fees:</b> <b>${gatewayFees}</b>\n\n` +
    `⚡ <b>Credits:</b> ${oldCredits} → <b>${newCredits}</b> <i>(+${addedCredits})</i>\n` +
    `📆 <b>+Days Added:</b> <b>${addedDays} days</b> | Expires: <b>${expiryDate}</b>\n` +
    `🆔 <b>Transaction ID:</b> <code>${transactionId}</code>\n` +
    `✅ <b>Status:</b> ${status}` +
    (extraNote ? `\n\n<i>${extraNote}</i>` : "")
  );
}

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
  const signature = (await headers()).get("X-Razorpay-Signature") as string;
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

    console.log(`[Razorpay Webhook] Payment Captured: ${payment.id} for User: ${userId}`);

    const initialEmail = payment.email || notes.email || "N/A";
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, plan, credits, display_id, subscription_expires_at, profile_data")
      .eq("email", initialEmail)
      .maybeSingle();

    const email = initialEmail !== "N/A" ? initialEmail : profile?.email || "N/A";
    const fullName = notes.fullName || profile?.full_name || (email !== "N/A" ? email.split("@")[0] : "User");

    const RAZORPAY_PLANS: Record<string, { plan: string; credits: number; days: number; frequency: string; unitTotalINR: number; basePriceINR: number }> = {
      "pro_monthly": { plan: "pro", credits: 200, days: 30, frequency: "Monthly", unitTotalINR: 780.3, basePriceINR: 765 },
      "pro_annual": { plan: "pro", credits: 2400, days: 365, frequency: "Annual", unitTotalINR: 7716.3, basePriceINR: 7565 },
      "elite_monthly": { plan: "elite", credits: 1000, days: 30, frequency: "Monthly", unitTotalINR: 2514.3, basePriceINR: 2465 },
      "elite_annual": { plan: "elite", credits: 12000, days: 365, frequency: "Annual", unitTotalINR: 24189.3, basePriceINR: 23715 },
    };


    const planKey = `${notes.planId}_${notes.billingCycle || "monthly"}`;
    const planInfo = RAZORPAY_PLANS[planKey] || RAZORPAY_PLANS["pro_monthly"];
    const quantity = parseInt(notes.quantity || "1");

    const purchasedCredits = planInfo.credits * quantity;
    const purchasedDays = planInfo.days * quantity;

    const now = new Date();

    let targetProfile = profile;
    if (!targetProfile && email !== "N/A") {
      const { data: profileByEmail } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("email", email)
        .maybeSingle();
      targetProfile = profileByEmail;
    }
    let currentExpiry = targetProfile?.subscription_expires_at ? new Date(targetProfile.subscription_expires_at) : now;
    if (currentExpiry < now) currentExpiry = now;
    const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);
    const oldCredits = targetProfile?.credits || 0;
    const totalCredits = oldCredits + purchasedCredits;

    let finalEmail = email !== "N/A" ? email : profile?.email;
    if (finalEmail) {
      const { data: conflict } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", finalEmail)
        .neq("id", userId)
        .maybeSingle();
      if (conflict) finalEmail = profile?.email;
    }

    const { data: alreadyProcessed } = await supabaseAdmin
      .from("profiles")
      .select("razorpay_payment_id")
      .eq("razorpay_payment_id", payment.id)
      .maybeSingle();

    if (alreadyProcessed) {
      console.log(`[Razorpay Webhook] Payment ${payment.id} already processed. Skipping.`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const amountINR = Number(payment.amount) / 100;

    const calculateDisplayFees = (displayTotal: number, basePriceINR: number) => {
      const planPrice = basePriceINR * quantity;
      const actualGatewayFee = displayTotal - planPrice;
      return {
        gatewayFee: actualGatewayFee.toFixed(2),
        planPrice: planPrice.toFixed(2),
        totalPaid: displayTotal.toFixed(2),
      };
    };

    const buildAmountLabel = (quantity: number, actualAmountINR: number, basePriceINR: number) => {
      const { gatewayFee, totalPaid, planPrice } = calculateDisplayFees(actualAmountINR, basePriceINR);
      const amountLabel = quantity > 1
        ? `₹${totalPaid} (${quantity}x ₹${basePriceINR.toFixed(2)} + 2%)`
        : `₹${totalPaid}`;
      return { amountLabel, totalDisplay: totalPaid, gatewayFee, planPrice: `₹${planPrice}` };
    };


    const { amountLabel, gatewayFee: displayGatewayFee, planPrice } = buildAmountLabel(quantity, amountINR, planInfo.basePriceINR);



    // Razorpay payment method
    let paymentMethodDisplay = "UPI";
    if (payment.method === "card") {
      paymentMethodDisplay = `Card (${payment.card?.network?.toUpperCase() || "CARD"} ****${payment.card?.last4 || "XXXX"})`;
    } else if (payment.method === "netbanking") {
      paymentMethodDisplay = `Netbanking (${payment.bank || "Bank"})`;
    } else if (payment.method === "wallet") {
      paymentMethodDisplay = `Wallet (${payment.wallet || "Wallet"})`;
    } else if (payment.method === "upi") {
      paymentMethodDisplay = `UPI (${payment.vpa || "UPI"})`;
    } else if (payment.method) {
      paymentMethodDisplay = payment.method.toUpperCase();
    }

    const eventTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });

    await supabaseAdmin.from("profiles").update({
      display_id: targetProfile?.display_id || `CHINTU-RAZORPAY-${new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }).replace(/\//g, "-")}-${new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).replace(":", "")}`,
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
        gateway_fee: displayGatewayFee,
        last_frequency: planInfo.frequency,
      },
    }, { onConflict: 'email' });

    const newPlan = notes.planId || planInfo.plan;
    const oldPlan = targetProfile?.plan || "free";

    await sendTelegramAlert(
      buildTelegramMessage({
        header: "💰 New Subscription Captured! | RAZORPAY 💳",
        name: fullName,
        email,
        dateTime: eventTime,
        oldPlan: `${oldPlan}${targetProfile?.profile_data?.last_frequency ? ` (${targetProfile.profile_data.last_frequency})` : ""}`,
        newPlan: `${newPlan} (${planInfo.frequency})`,
        amount: amountLabel,
        planPrice: planPrice,
        quantity,
        paymentMethod: paymentMethodDisplay,
        gatewayFees: `₹${displayGatewayFee} (2%)`,
        oldCredits,
        newCredits: totalCredits,
        addedCredits: purchasedCredits,
        addedDays: purchasedDays,










        expiryDate: newExpiry.toLocaleDateString("en-IN"),
        transactionId: payment.id,
        extraNote: "Razorpay Secure fulfillment verified.",
      })
    );

    if (email !== "N/A") {
      try {
        const { Resend } = await import("resend");
        const { getPaymentEmailHtml } = await import("@/utils/email-templates");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "Chintu Intelligence <welcome@getchintu.com>",
          to: email,
          subject: "CHINTU: PROTOCOL UPGRADE VERIFIED ⚡",
          html: getPaymentEmailHtml(
            fullName,
            newPlan,
            oldPlan,
            totalCredits,
            `₹${amountINR}`,
            eventTime,
            process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com",
            newExpiry.toLocaleDateString("en-IN")
          ),
        });
      } catch (emailErr) {
        console.error("[Razorpay Webhook] Failed to send email:", emailErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
