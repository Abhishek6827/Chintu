import { headers } from "next/headers";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { getPaymentEmailHtml } from "@/utils/email-templates";

const PRICE_ID_MAP: Record<string, { plan: string; credits: number; price: string; days: number }> = {
  // Pro Monthly
  "price_1TTF8WLYcsTnVrvkaLcpMyel": { plan: "pro", credits: 200, price: "$9/mo", days: 30 },
  // Pro Annual
  "price_1TTFChLYcsTnVrvkUllytzc2": { plan: "pro", credits: 2400, price: "$89/yr", days: 365 },
  // Elite Monthly
  "price_1TTFBELYcsTnVrvkKpZSsGRN": { plan: "elite", credits: 1000, price: "$29/mo", days: 30 },
  // Elite Annual
  "price_1TTFDhLYcsTnVrvkGGjCkxv5": { plan: "elite", credits: 12000, price: "$279/yr", days: 365 },
};

// ─── Helpers ────────────────────────────────────────────────

async function sendTelegramAlert(message: string) {
  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn("[Webhook] Telegram env vars missing — skipping alert");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Webhook] Telegram send failed:", err);
    }
  } catch (err) {
    console.error("[Webhook] Telegram alert exception:", err);
  }
}

function formatEventTime(): string {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
}

function generateDisplayId(): string {
  const date = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }).replace(/\//g, "-");
  const time = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).replace(":", "");
  return `CHINTU-STRIPE-${date}-${time}`;
}

// ─── Main Handler ────────────────────────────────────────────

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-06-20" as any,
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  // 🔴 FIX 1: headers() is async in Next.js 15 — must be awaited
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");

  if (!signature) {
    console.error("[Webhook] Missing Stripe-Signature header");
    return new NextResponse("Missing Stripe-Signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`[Webhook] ✅ Event received: ${event.type} | ID: ${event.id}`);

  const supabaseAdmin = createAdminClient();

  // ─── Helper: Find profile by userId with email fallback ───
  async function findProfile(userId?: string | null, email?: string | null) {
    let profile = null;

    if (userId) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("id", userId)
        .maybeSingle();
      profile = data;
    }

    if (!profile && email) {
      console.warn(`[Webhook] Profile not found by userId. Trying email: ${email}`);
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("email", email)
        .maybeSingle();
      profile = data;
    }

    return profile;
  }

  // ─── Helper: Find profile by subscription ID with email fallback ───
  async function findProfileBySubscription(subscriptionId: string, email?: string | null) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (data) return data;

    // 🔴 BUG 1 FIX: If not found in DB, check Stripe Subscription metadata
    console.warn(`[Webhook] Profile not found by stripe_subscription_id=${subscriptionId}. Checking Stripe metadata...`);
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      if (userId) {
        console.log(`[Webhook] Found userId=${userId} in subscription metadata. Fetching profile...`);
        const { data: byUserId } = await supabaseAdmin
          .from("profiles")
          .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
          .eq("id", userId)
          .maybeSingle();
        if (byUserId) return byUserId;
      }
    } catch (err) {
      console.error("[Webhook] Stripe subscription retrieve failed:", err);
    }

    if (email) {
      console.warn(`[Webhook] Still not found. Trying email: ${email}`);
      const { data: byEmail } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("email", email)
        .maybeSingle();
      return byEmail;
    }

    return null;
  }

  // ─── Helper: Calculate stacked expiry ───
  function stackExpiry(currentExpiry: string | null, addDays: number): Date {
    const now = new Date();
    const base = currentExpiry ? new Date(currentExpiry) : now;
    const from = base < now ? now : base;
    return new Date(from.getTime() + addDays * 24 * 60 * 60 * 1000);
  }

  // ─── Helper: Fetch gateway fees ───
  async function fetchFees(paymentIntentId: string | null, currency: string) {
    const symbol = currency?.toUpperCase() === "INR" ? "₹" : "$";
    let gatewayFee = 0;
    let netAmount = 0;
    try {
      if (paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ["latest_charge.balance_transaction"],
        });
        const charge = (pi.latest_charge as any);
        if (charge?.balance_transaction) {
          gatewayFee = (charge.balance_transaction.fee || 0) / 100;
          netAmount = (charge.balance_transaction.net || 0) / 100;
        }
      }
    } catch (err) {
      console.error("[Webhook] Fee fetch failed:", err);
    }
    return { gatewayFee, netAmount, symbol };
  }

  // ════════════════════════════════════════════════════════════
  // EVENT: checkout.session.completed
  // Triggered on: new subscription purchase
  // ════════════════════════════════════════════════════════════
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const customerEmail = session.customer_details?.email;

    console.log(`[Webhook] checkout.session.completed | userId: ${userId} | email: ${customerEmail}`);

    const profile = await findProfile(userId, customerEmail);

    if (!profile) {
      console.error(`[Webhook] ❌ No profile found for userId=${userId} email=${customerEmail}`);
      // Return 200 so Stripe doesn't retry indefinitely — log and investigate manually
      return NextResponse.json({ received: true, error: "Profile not found" });
    }

    // Get line items and price
    let priceId: string | undefined;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      priceId = lineItems.data[0]?.price?.id;
      console.log(`[Webhook] Price ID from line items: ${priceId}`);
    } catch (err) {
      console.error("[Webhook] Failed to fetch line items:", err);
    }

    if (!priceId || !PRICE_ID_MAP[priceId]) {
      console.error(`[Webhook] ❌ Unknown Price ID: ${priceId}`);
      return NextResponse.json({ received: true, error: `Unknown priceId: ${priceId}` });
    }

    const { plan, credits, price, days } = PRICE_ID_MAP[priceId];

    // 🔴 FIX 2: Dedup check — use payment_intent first, fallback to session.id
    const dedupId = (session.payment_intent as string) || session.id;
    if (profile.profile_data?.last_payment_id === dedupId) {
      console.log(`[Webhook] ⏭️ Already processed payment ${dedupId} — skipping`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const oldPlan = profile.plan || "free";
    const newCredits = (profile.credits || 0) + credits;
    const newExpiry = stackExpiry(profile.subscription_expires_at, days);

    // Fetch payment method details
    let paymentMethodDisplay = "Card";
    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
          expand: ["payment_method"],
        });
        const pm = pi.payment_method as Stripe.PaymentMethod;
        if (pm?.type === "card") {
          paymentMethodDisplay = `Card (${pm.card?.brand?.toUpperCase()} ${pm.card?.funding?.toUpperCase()} ****${pm.card?.last4})`;
        } else if (pm?.type === "link") {
          paymentMethodDisplay = "Link (Stripe)";
        } else if (pm?.type) {
          paymentMethodDisplay = pm.type.toUpperCase();
        }
      }
    } catch (err) {
      console.error("[Webhook] Payment method fetch failed:", err);
    }

    const { gatewayFee, netAmount, symbol } = await fetchFees(
      session.payment_intent as string,
      session.currency || "usd"
    );

    const customerName = session.customer_details?.name || customerEmail || "Unknown";

    // ✅ Update Supabase
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_id: profile.display_id || generateDisplayId(),
        plan,
        credits: newCredits,
        subscription_expires_at: newExpiry.toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        payment_provider: "stripe",
        full_name: customerName,
        updated_at: new Date().toISOString(),
        profile_data: {
          ...(profile.profile_data || {}),
          payment_amount: price,
          payment_type: paymentMethodDisplay,
          last_payment_id: dedupId,
          last_gateway: "stripe",
          last_payment_at: new Date().toISOString(),
        },
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[Webhook] ❌ Supabase update failed:", updateError.message);
      return new NextResponse("DB update failed", { status: 500 });
    }

    console.log(`[Webhook] ✅ Profile updated: ${profile.id} | ${oldPlan} → ${plan} | credits: ${newCredits}`);

    // Alerts (non-blocking — don't let these fail the response)
    const isDowngrade = oldPlan === "elite" && plan === "pro";
    const statusLabel = isDowngrade ? "DOWNGRADE 🔻" : oldPlan === "free" ? "NEW UPGRADE ⚡" : "UPGRADE ⚡";
    const eventTime = formatEventTime();

    await sendTelegramAlert(
      `<b>${statusLabel} | STRIPE</b> 💳\n` +
      `👤 <b>Customer:</b> ${customerName}\n` +
      `📧 <b>Email:</b> <code>${customerEmail || "N/A"}</code>\n` +
      `🆔 <b>Session ID:</b> <code>${session.id}</code>\n` +
      `🛠️ <b>Method:</b> ${paymentMethodDisplay}\n` +
      `💰 <b>Amount:</b> ${price}\n` +
      `💸 <b>Gateway Fees:</b> ${symbol}${gatewayFee.toFixed(2)}\n` +
      `🏦 <b>Net Settlement:</b> ${symbol}${netAmount.toFixed(2)}\n` +
      `--------------------------\n` +
      `📊 <b>Old Plan:</b> ${oldPlan.toUpperCase()}\n` +
      `🚀 <b>New Plan:</b> ${plan.toUpperCase()}\n` +
      `📈 <b>Credits:</b> ${profile.credits || 0} → ${newCredits}\n` +
      `📅 <b>Expiry:</b> <code>${newExpiry.toLocaleDateString("en-IN")}</code>\n` +
      `--------------------------\n` +
      `✅ <b>Status:</b> SUCCESSFUL`
    );

    if (customerEmail) {
      try {
        await resend.emails.send({
          from: "Chintu Intelligence <welcome@getchintu.com>",
          to: customerEmail,
          subject: `CHINTU: ${statusLabel} VERIFIED ⚡`,
          html: getPaymentEmailHtml(
            customerName, plan, oldPlan, newCredits, price, eventTime,
            process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com",
            newExpiry.toLocaleDateString("en-IN")
          ),
        });
        console.log(`[Webhook] ✅ Email sent to ${customerEmail}`);
      } catch (emailErr) {
        console.error("[Webhook] Email failed:", emailErr);
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // EVENT: invoice.payment_succeeded
  // Triggered on: subscription renewals only (creation is skipped)
  // ════════════════════════════════════════════════════════════
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;

    // ✅ Skip initial creation — handled by checkout.session.completed
    if (invoice.billing_reason === "subscription_create") {
      console.log(`[Webhook] ⏭️ Skipping invoice for initial subscription creation (handled by checkout)`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Webhook] invoice.payment_succeeded | reason: ${invoice.billing_reason} | sub: ${invoice.subscription}`);

    const profile = await findProfileBySubscription(invoice.subscription, invoice.customer_email);

    if (!profile) {
      console.error(`[Webhook] ❌ Profile not found for subscription: ${invoice.subscription}`);
      return NextResponse.json({ received: true, error: "Profile not found" });
    }

    const dedupId = (invoice.payment_intent as string) || invoice.id;
    if (profile.profile_data?.last_payment_id === dedupId) {
      console.log(`[Webhook] ⏭️ Already processed invoice ${dedupId} — skipping`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const priceId = invoice.lines?.data?.[0]?.price?.id;
    const planInfo = PRICE_ID_MAP[priceId || ""];

    if (!planInfo) {
      console.error(`[Webhook] ❌ Unknown priceId in invoice: ${priceId}`);
      return NextResponse.json({ received: true, error: `Unknown priceId: ${priceId}` });
    }

    const quantity = invoice.lines?.data?.[0]?.quantity || 1;
    const addCredits = planInfo.credits * quantity;
    const addDays = planInfo.days * quantity;

    const newCredits = (profile.credits || 0) + addCredits;
    const newExpiry = stackExpiry(profile.subscription_expires_at, addDays);

    // Fetch fees
    let gatewayFee = 0;
    let netAmount = (invoice.amount_paid || 0) / 100;
    const symbol = invoice.currency?.toUpperCase() === "INR" ? "₹" : "$";
    try {
      if (invoice.charge) {
        const charge = await stripe.charges.retrieve(invoice.charge as string, {
          expand: ["balance_transaction"],
        });
        if (charge.balance_transaction && typeof charge.balance_transaction === "object") {
          const bt = charge.balance_transaction as any;
          gatewayFee = (bt.fee || 0) / 100;
          netAmount = (bt.net || 0) / 100;
        }
      }
    } catch (err) {
      console.error("[Webhook] Renewal fee fetch failed:", err);
    }

    const customerName = invoice.customer_name || invoice.customer_email || profile.email || "Unknown";
    const eventTime = formatEventTime();

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        display_id: profile.display_id || generateDisplayId(),
        plan: planInfo.plan,
        credits: newCredits,
        subscription_expires_at: newExpiry.toISOString(),
        full_name: customerName,
        updated_at: new Date().toISOString(),
        profile_data: {
          ...(profile.profile_data || {}),
          payment_amount: planInfo.price,
          payment_type: "recurring",
          last_payment_id: dedupId,
          last_gateway: "stripe",
          last_payment_at: new Date().toISOString(),
        },
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[Webhook] ❌ Renewal DB update failed:", updateError.message);
      return new NextResponse("DB update failed", { status: 500 });
    }

    console.log(`[Webhook] ✅ Renewal processed: ${profile.id} | credits: ${newCredits} | expiry: ${newExpiry.toLocaleDateString("en-IN")}`);

    await sendTelegramAlert(
      `🔄 <b>Subscription Renewed! (Stripe)</b>\n\n` +
      `👤 Name: <b>${customerName}</b>\n` +
      `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
      `📅 Date: <code>${eventTime}</code>\n` +
      `💎 Plan: <b>${planInfo.plan.toUpperCase()}</b>\n` +
      `💰 Amount: <b>${symbol}${(invoice.amount_paid / 100).toFixed(2)}</b> (Qty: ${quantity})\n` +
      `💸 Gateway Fees: <b>${symbol}${gatewayFee.toFixed(2)}</b>\n` +
      `🏦 Net Settlement: <b>${symbol}${netAmount.toFixed(2)}</b>\n` +
      `⚡ Total Credits: <b>${newCredits}</b>\n` +
      `⏳ Expiry: <b>${newExpiry.toLocaleDateString("en-IN")}</b>`
    );

    if (profile.email) {
      try {
        await resend.emails.send({
          from: "Chintu Intelligence <billing@getchintu.com>",
          replyTo: "contact@getchintu.com",
          to: profile.email,
          subject: "CHINTU: MISSION EXTENSION VERIFIED 🔄",
          html: getPaymentEmailHtml(
            customerName, planInfo.plan, profile.plan || "pro", newCredits,
            planInfo.price, eventTime,
            process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com",
            newExpiry.toLocaleDateString("en-IN")
          ),
        });
      } catch (emailErr) {
        console.error("[Webhook] Renewal email failed:", emailErr);
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // EVENT: customer.subscription.updated
  // Triggered on: plan upgrade/downgrade, quantity change, status change
  // 🔴 FIX 3: Do NOT stack credits here — only update plan metadata
  // Credits are handled by invoice.payment_succeeded
  // ════════════════════════════════════════════════════════════
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const previousAttributes = event.data.previous_attributes as any;

    console.log(`[Webhook] customer.subscription.updated | sub: ${subscription.id} | prevAttrs: ${JSON.stringify(Object.keys(previousAttributes || {}))}`);

    // Only act on plan/item changes or status activations
    if (!previousAttributes || (!previousAttributes.items && !previousAttributes.status)) {
      console.log(`[Webhook] ⏭️ No relevant changes in subscription update — skipping`);
      return NextResponse.json({ received: true });
    }

    // Skip incomplete → active transition (handled by checkout.session.completed)
    const isInitialActivation =
      previousAttributes?.status === "incomplete" && subscription.status === "active";

    if (isInitialActivation) {
      console.log(`[Webhook] ⏭️ Subscription activated from incomplete — skipping (checkout handles this)`);
      return NextResponse.json({ received: true });
    }

    if (subscription.status !== "active") {
      console.log(`[Webhook] ⏭️ Subscription not active (status: ${subscription.status}) — skipping`);
      return NextResponse.json({ received: true });
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const planInfo = PRICE_ID_MAP[priceId || ""];

    if (!planInfo) {
      console.error(`[Webhook] ❌ Unknown priceId in subscription update: ${priceId}`);
      return NextResponse.json({ received: true });
    }

    // Find profile
    let customerEmail: string | null = null;
    try {
      const stripeCustomer = await stripe.customers.retrieve(subscription.customer as string);
      if (stripeCustomer && !stripeCustomer.deleted) {
        customerEmail = (stripeCustomer as Stripe.Customer).email;
      }
    } catch (err) {
      console.error("[Webhook] Customer fetch failed:", err);
    }

    const profile = await findProfileBySubscription(subscription.id, customerEmail);

    if (!profile) {
      console.error(`[Webhook] ❌ Profile not found for subscription: ${subscription.id}`);
      return NextResponse.json({ received: true, error: "Profile not found" });
    }

    const oldPlan = profile.plan || "free";

    // 🔴 FIX 3: ONLY update plan — do NOT touch credits or expiry here
    // Credits will be handled by invoice.payment_succeeded when payment actually occurs
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: planInfo.plan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[Webhook] ❌ Subscription update DB failed:", updateError.message);
    } else {
      console.log(`[Webhook] ✅ Plan updated: ${profile.id} | ${oldPlan} → ${planInfo.plan}`);
    }

    const eventTime = formatEventTime();
    const isDowngrade = ["elite"].includes(oldPlan) && planInfo.plan === "pro";

    await sendTelegramAlert(
      `📈 <b>Plan ${isDowngrade ? "Downgraded" : "Upgraded"}! (Stripe)</b>\n\n` +
      `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
      `📅 Date: <code>${eventTime}</code>\n` +
      `💎 Evolution: <b>${oldPlan.toUpperCase()}</b> → <b>${planInfo.plan.toUpperCase()}</b>\n` +
      `ℹ️ Credits unchanged here — will update on invoice payment`
    );
  }

  // ════════════════════════════════════════════════════════════
  // EVENT: customer.subscription.deleted
  // Triggered on: cancellation
  // ════════════════════════════════════════════════════════════
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    console.log(`[Webhook] customer.subscription.deleted | sub: ${subscription.id}`);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    if (!profile) {
      console.error(`[Webhook] Profile not found for cancelled sub: ${subscription.id}`);
      return NextResponse.json({ received: true });
    }

    const oldPlan = profile.plan || "unknown";

    await supabaseAdmin
      .from("profiles")
      .update({
        plan: "free",
        credits: 10,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    console.log(`[Webhook] ✅ Subscription cancelled: ${profile.id} | ${oldPlan} → free`);

    let customerName = profile.email || "Unknown";
    try {
      const stripeCustomer = await stripe.customers.retrieve(subscription.customer as string);
      if (stripeCustomer && !stripeCustomer.deleted && (stripeCustomer as Stripe.Customer).name) {
        customerName = (stripeCustomer as Stripe.Customer).name!;
      }
    } catch { }

    await sendTelegramAlert(
      `❌ <b>Subscription Cancelled</b>\n\n` +
      `👤 Name: <b>${customerName}</b>\n` +
      `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
      `📅 Date: <code>${formatEventTime()}</code>\n` +
      `💎 Old Plan: <b>${oldPlan.toUpperCase()}</b> → <b>FREE</b>\n` +
      `💰 Credits reset to: <b>10</b>\n\n` +
      `⚠️ <i>Consider sending a re-engagement offer.</i>`
    );
  }

  // ════════════════════════════════════════════════════════════
  // EVENT: customer.deleted
  // ════════════════════════════════════════════════════════════
  if (event.type === "customer.deleted") {
    const customer = event.data.object as Stripe.Customer;

    console.log(`[Webhook] customer.deleted | customerId: ${customer.id}`);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_customer_id", customer.id)
      .maybeSingle();

    if (!profile) {
      console.error(`[Webhook] Profile not found for deleted customer: ${customer.id}`);
      return NextResponse.json({ received: true });
    }

    const oldPlan = profile.plan || "unknown";
    const customerName = customer.name || customer.email || profile.email || "Unknown";

    await supabaseAdmin
      .from("profiles")
      .update({
        plan: "free",
        credits: 10,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    console.log(`[Webhook] ✅ Customer deleted: ${profile.id}`);

    await sendTelegramAlert(
      `🗑️ <b>Customer Deleted</b>\n\n` +
      `👤 Name: <b>${customerName}</b>\n` +
      `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
      `📅 Date: <code>${formatEventTime()}</code>\n` +
      `💎 Plan was: <b>${oldPlan.toUpperCase()}</b> → <b>FREE</b>\n` +
      `⚠️ Stripe records wiped, downgraded to FREE.`
    );
  }

  return NextResponse.json({ received: true });
}