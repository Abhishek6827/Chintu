import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { getPaymentEmailHtml } from "@/utils/email-templates";
import Razorpay from "razorpay";

const sendTelegramAlert = async (message: string) => {
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
    console.error("Telegram alert failed:", err);
  }
};

export const dynamic = 'force-dynamic';

const RAZORPAY_PLANS: Record<string, { plan: string; credits: number; price: string; days: number; frequency: string, basePriceINR: number }> = {
  "pro_monthly": { plan: "pro", credits: 200, price: "₹765/mo", days: 30, frequency: "Monthly", basePriceINR: 765 },
  "pro_annual": { plan: "pro", credits: 2400, price: "₹7565/yr", days: 365, frequency: "Annual", basePriceINR: 7565 },
  "elite_monthly": { plan: "elite", credits: 1000, price: "₹2465/mo", days: 30, frequency: "Monthly", basePriceINR: 2465 },
  "elite_annual": { plan: "elite", credits: 12000, price: "₹23715/yr", days: 365, frequency: "Annual", basePriceINR: 23715 },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId,
      quantity,
      billingCycle = "monthly"
    } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Fetch Payment Details from Razorpay for extra metadata
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
    const payment = await rzp.payments.fetch(razorpay_payment_id);
    const method = payment.method; // card, upi, netbanking
    const cardDetails = payment.card ? `${payment.card.network} ${payment.card.type} (****${payment.card.last4})` : "";
    const paymentTypeDisplay = method === 'card' ? `Card (${cardDetails})` : method.toUpperCase();

    // Fulfill Order
    const supabaseAdmin = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Initial Profile Fetch
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // 2. Resolve Contact Info (Clerk Fallback)
    let userEmail = profile?.email;
    let userName = profile?.full_name;
    
    if (!profile || !userEmail || !userName) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        userEmail = userEmail || clerkUser.emailAddresses[0]?.emailAddress;
        userName = userName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      } catch (err) {
        console.error("Clerk fetch failed:", err);
      }
    }

    // 3. Resolve Profile & Handle Merging (Legacy Account Migration)
    let baseCredits = profile?.credits || 0;
    let baseExpiryStr = profile?.subscription_expires_at;

    if (userEmail) {
      const { data: legacyProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, credits, subscription_expires_at, plan, profile_data")
        .eq("email", userEmail)
        .neq("id", userId) // Look for OTHER accounts with same email
        .maybeSingle();

      if (legacyProfile) {
        console.log(`[/api/razorpay/verify] Found legacy profile ${legacyProfile.id} for email ${userEmail}. Merging into ${userId}.`);
        
        // Merge Credits
        baseCredits += (legacyProfile.credits || 0);
        
        // Merge Expiry (take latest)
        const legacyExp = legacyProfile.subscription_expires_at ? new Date(legacyProfile.subscription_expires_at) : null;
        const currentExp = baseExpiryStr ? new Date(baseExpiryStr) : null;
        if (legacyExp && (!currentExp || legacyExp > currentExp)) {
          baseExpiryStr = legacyExp.toISOString();
        }

        // Deactivate legacy profile to prevent future email conflicts
        await supabaseAdmin
          .from("profiles")
          .update({ 
            email: `migrated_${Date.now()}_${userEmail}`,
            credits: 0,
            plan: "free"
          })
          .eq("id", legacyProfile.id);
      }
    }

    const targetProfile = profile; // The one we are actually updating
    const targetUserId = userId; 

    // 4. Calculate Credits & Expiry
    const planKey = `${planId}_${billingCycle}`; 
    const planInfo = RAZORPAY_PLANS[planKey] || RAZORPAY_PLANS["pro_monthly"];

    const purchasedCredits = planInfo.credits * quantity;
    const purchasedDays = planInfo.days * quantity;

    const now = new Date();
    let currentExpiry = baseExpiryStr ? new Date(baseExpiryStr) : now;
    if (currentExpiry < now) currentExpiry = now;
    
    const isDowngrade = (profile?.plan === 'elite' || baseCredits > 1000) && planInfo.plan === 'pro';
    const existingCredits = baseCredits;
    const totalCredits = existingCredits + purchasedCredits;
    const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    // Email conflicts already handled by legacy migration above

    // DEDUPLICATION CHECK: Check if this payment was already processed (e.g. by webhook)
    const { data: alreadyProcessed } = await supabaseAdmin
      .from("profiles")
      .select("razorpay_payment_id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (alreadyProcessed) {
      console.log(`[/api/razorpay/verify] Payment ${razorpay_payment_id} already processed. Skipping duplicate fulfillment.`);
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    // Gateway Fees calculation (Razorpay subunits)
    const gatewayFee = (Number(payment.fee) || 0) / 100;
    const gatewayTax = (Number(payment.tax) || 0) / 100;
    const totalFees = gatewayFee + gatewayTax;
    // Update Profile (from upsert to update for safety)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_id: targetProfile?.display_id || `CHINTU-RAZORPAY-${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-')}-${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).replace(':', '')}`,
        plan: planInfo.plan,
        credits: totalCredits,
        subscription_expires_at: newExpiry.toISOString(),
        payment_provider: "razorpay",
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
        full_name: userName || (targetProfile ? targetProfile.full_name : null),
        email: userEmail || (targetProfile ? targetProfile.email : null),
        profile_data: {
          ...(targetProfile?.profile_data || {}),
          payment_amount: `${planInfo.price}`,
          payment_type: paymentTypeDisplay,
          last_payment_id: razorpay_payment_id,
          last_gateway: "razorpay",
          last_payment_at: new Date().toISOString(),
          gateway_fee: totalFees,
          last_frequency: planInfo.frequency,
        }
      })
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    const eventTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    }).replace(/,/g, '');

    const customerName = profile?.full_name || userName || userEmail || "User";

    // Send Telegram Alert
    const statusLabel = isDowngrade ? "DOWNGRADE 🔻" : "💰 Plan Purchased";
    const displayTotal = Number(payment.amount) / 100;
    const displayPlanPrice = planInfo.basePriceINR * quantity;
    const displayFee = displayTotal - displayPlanPrice;

    const telegramMsg = `
<b>${statusLabel} | RAZORPAY</b>

👤 <b>Name:</b> ${customerName}
📧 <b>Email:</b> <code>${userEmail || 'N/A'}</code>
📅 <b>Date:</b> <code>${eventTime}</code>
💰 <b>Total Amount:</b> <b>₹${displayTotal.toLocaleString()}</b> (Qty: ${quantity}${quantity > 1 ? ` - ${quantity}x ₹${planInfo.basePriceINR.toFixed(2)} + 2%` : ''})
💳 <b>Method:</b> ${paymentTypeDisplay}

💎 <b>Plan Price:</b> <b>₹${displayPlanPrice.toFixed(2)}</b>
💸 <b>Gateway Fees:</b> <b>₹${displayFee.toFixed(2)} (2%)</b>

--------------------------
💎 <b>Old Plan:</b> ${profile?.plan?.toUpperCase() || "FREE"}${profile?.profile_data?.last_frequency ? ` (${profile.profile_data.last_frequency})` : ""}
💎 <b>New Plan:</b> ${planInfo.plan.toUpperCase()} (${planInfo.frequency})
⚡ <b>Old Credits:</b> ${existingCredits}
⚡ <b>New Credits:</b> ${totalCredits}
📅 <b>Expiry:</b> <code>${newExpiry.toLocaleDateString('en-IN')}</code>
--------------------------
✅ <b>Status:</b> SUCCESSFUL
🆔 <b>Payment ID:</b> <code>${razorpay_payment_id}</code>
`;
    await sendTelegramAlert(telegramMsg);

    // Send Email via Resend
    if (userEmail) {
      try {
        await resend.emails.send({
          from: 'Chintu Intelligence <welcome@getchintu.com>',
          to: userEmail,
          subject: `CHINTU: ${statusLabel} VERIFIED ⚡`,
          html: getPaymentEmailHtml(
            customerName,
            planInfo.plan,
            profile?.plan || "free",
            totalCredits,
            `₹${(Number(payment.amount) / 100).toLocaleString()}`,
            eventTime,
            process.env.NEXT_PUBLIC_APP_URL || 'https://getchintu.com',
            newExpiry.toLocaleDateString('en-IN')
          ),
        });
        console.log(`[/api/razorpay/verify] Payment email sent to ${userEmail}`);
      } catch (emailErr) {
        console.error("Failed to send payment email:", emailErr);
      }
    }

    return NextResponse.json({ 
      success: true,
      receipt: {
        transactionId: razorpay_payment_id,
        totalAmount: displayTotal.toFixed(2),
        currency: "INR",
        plan: `${planInfo.plan.toUpperCase()} (${planInfo.frequency})`,
        quantity,
        planPrice: displayPlanPrice.toFixed(2),
        gatewayFees: displayFee.toFixed(2),
        newCredits: totalCredits,
        expiryDate: newExpiry.toLocaleDateString('en-IN'),
        status: "SUCCESSFUL"
      }
    });
  } catch (error: any) {
    console.error("[/api/razorpay/verify] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
