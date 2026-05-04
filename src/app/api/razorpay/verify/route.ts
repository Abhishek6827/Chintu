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

const RAZORPAY_PLANS: Record<string, { plan: string; credits: number; price: string; days: number }> = {
  "pro_monthly": { plan: "pro", credits: 200, price: "₹799/mo", days: 30 },
  "pro_annual": { plan: "pro", credits: 2400, price: "₹7990/yr", days: 365 },
  "elite_monthly": { plan: "elite", credits: 1000, price: "₹2499/mo", days: 30 },
  "elite_annual": { plan: "elite", credits: 12000, price: "₹24990/yr", days: 365 },
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

    // 3. Resolve Target Profile (Email Fallback for ID mismatches)
    let targetProfile = profile;
    if (!targetProfile && userEmail) {
      const { data: profileByEmail } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", userEmail)
        .maybeSingle();
      targetProfile = profileByEmail;
    }
    const targetUserId = targetProfile?.id || userId;

    // 4. Calculate Credits & Expiry
    const planKey = `${planId}_${billingCycle}`; 
    const planInfo = RAZORPAY_PLANS[planKey] || RAZORPAY_PLANS["pro_monthly"];

    const purchasedCredits = planInfo.credits * quantity;
    const purchasedDays = planInfo.days * quantity;

    const now = new Date();
    let currentExpiry = targetProfile?.subscription_expires_at ? new Date(targetProfile.subscription_expires_at) : now;
    if (currentExpiry < now) currentExpiry = now;
    
    // Pro-rata logic for Downgrades (Elite -> Pro)
    let bonusCredits = 0;
    const isDowngrade = targetProfile?.plan === 'elite' && planInfo.plan === 'pro';
    if (isDowngrade && currentExpiry > now) {
      const remainingDays = Math.ceil((currentExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      bonusCredits = Math.round((800 / 30) * remainingDays);
    }

    const existingCredits = (targetProfile?.credits || 0);
    const totalCredits = existingCredits + purchasedCredits + bonusCredits;
    const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    // Check for email conflicts before upsert to avoid duplicate key errors
    if (userEmail) {
      const { data: conflict } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .neq("id", userId)
        .maybeSingle();
      
      if (conflict) {
        console.warn(`[/api/razorpay/verify] Email conflict for ${userEmail}. Fulfilling without updating email field.`);
        userEmail = null; // Don't try to update email if it belongs to someone else
      }
    }

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
    const netAmount = (Number(payment.amount) / 100) - totalFees;

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
          gateway_fee: totalFees
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
    const statusLabel = isDowngrade ? "DOWNGRADE 🔻" : (profile?.plan === 'free' ? "NEW SUBSCRIPTION 💰" : "UPGRADE ⚡");
    const telegramMsg = `
<b>${statusLabel} | RAZORPAY</b>

👤 <b>Name:</b> ${customerName}
📧 <b>Email:</b> <code>${userEmail || 'N/A'}</code>
📅 <b>Date:</b> <code>${eventTime}</code>
💳 <b>Method:</b> ${paymentTypeDisplay}
💰 <b>Amount:</b> ₹${(Number(payment.amount) / 100).toLocaleString()}
💸 <b>Gateway Fees:</b> ₹${totalFees.toFixed(2)} (Incl. Tax)
🏦 <b>Net Settlement:</b> ₹${netAmount.toFixed(2)}

--------------------------
💎 <b>Old Plan:</b> ${profile?.plan?.toUpperCase() || "FREE"}
💎 <b>New Plan:</b> ${planInfo.plan.toUpperCase()}
⚡ <b>Old Credits:</b> ${existingCredits}
⚡ <b>New Credits:</b> ${totalCredits} ${bonusCredits > 0 ? `(+${bonusCredits} Pro-rata)` : ""}
📅 <b>Expiry:</b> ${newExpiry.toLocaleDateString('en-IN')}
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[/api/razorpay/verify] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
