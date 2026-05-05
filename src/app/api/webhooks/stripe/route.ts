import { headers } from "next/headers";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { getPaymentEmailHtml } from "@/utils/email-templates";


// unitTotal = the displayed price on pricing page (base + 2% gateway fee already included)
// e.g. Pro Monthly: $9 base + 2% = $9.18
const PRICE_ID_MAP: Record<
  string,
  {
    plan: string;
    credits: number;
    price: string;
    days: number;
    frequency: string;
    unitTotal: number; // per-unit catalog price shown on pricing page (2% already included)
  }
> = {
  "price_1TTF8WLYcsTnVrvkaLcpMyel": {
    plan: "pro", credits: 200, price: "$9.18/mo", days: 30,
    frequency: "Monthly", unitTotal: 9.18,
  },
  "price_1TTFChLYcsTnVrvkUllytzc2": {
    plan: "pro", credits: 2400, price: "$89/yr", days: 365,
    frequency: "Annual", unitTotal: 89.00,
  },
  "price_1TTFBELYcsTnVrvkKpZSsGRN": {
    plan: "elite", credits: 1000, price: "$29.58/mo", days: 30,
    frequency: "Monthly", unitTotal: 29.58,
  },
  "price_1TTFDhLYcsTnVrvkGGjCkxv5": {
    plan: "elite", credits: 12000, price: "$279/yr", days: 365,
    frequency: "Annual", unitTotal: 279.00,
  },
};


// ─── Helpers ─────────────────────────────────────────────────────────────────


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
  const time = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit",
  }).replace(":", "");
  return `CHINTU-STRIPE-${date}-${time}`;
}


/**
 * Dynamic fee calculator.
 *
 * Our pricing page displays prices WITH 2% gateway fee already included:
 *   displayTotal = base × 1.02
 *
 * So to extract the gateway fee from the display total:
 *   gatewayFee = displayTotal × (0.02 / 1.02)   ← correct
 *
 * This works for any quantity automatically:
 *   1x Pro  → $9.18  × 0.02/1.02 = $0.18  ✓
 *   10x Pro → $91.80 × 0.02/1.02 = $1.80  ✓
 *   1x Elite → $29.58 × 0.02/1.02 = $0.58 ✓
 */
function calculateDisplayFees(displayTotal: number): {
  gatewayFee: string;
  planPrice: string;
  totalPaid: string;
} {
  const gatewayFee = displayTotal * (2 / 102);
  const planPrice = displayTotal - gatewayFee;
  return {
    gatewayFee: gatewayFee.toFixed(2),
    planPrice: planPrice.toFixed(2),
    totalPaid: displayTotal.toFixed(2),
  };
}


/**
 * Build a human-readable amount label for Telegram.
 * For qty > 1: "$91.80 (10x $9.18)" so it's always transparent.
 */
function buildAmountLabel(symbol: string, quantity: number, unitTotal: number, frequency?: string): {
  amountLabel: string;
  totalDisplay: string;
  gatewayFee: string;
  planPrice: string;
} {
  const total = unitTotal * quantity;
  const { gatewayFee, totalPaid, planPrice } = calculateDisplayFees(total);
  const suffix = frequency ? (frequency.toLowerCase() === "annual" ? "/yr" : "/mo") : "";

  const amountLabel = quantity > 1
    ? `${symbol}${totalPaid}${suffix} (${quantity}x ${symbol}${unitTotal.toFixed(2)}${suffix})`
    : `${symbol}${totalPaid}${suffix}`;

  return { amountLabel, totalDisplay: totalPaid, gatewayFee, planPrice: `${symbol}${planPrice}${suffix}` };
}


// ─── Telegram Message Builder (no net settlement — only credits + days) ───────
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
    `💰 <b>Amount Paid:</b> <b>${amount}</b> (Qty: ${quantity})\n` +
    `💳 <b>Payment Method:</b> ${paymentMethod}\n\n` +
    `💎 <b>Plan Price:</b> <b>${planPrice}</b>\n` +
    `💸 <b>Gateway Fees (2%):</b> <b>${gatewayFees}</b>\n\n` +
    `⚡ <b>Credits:</b> ${oldCredits} → <b>${newCredits}</b> <i>(+${addedCredits})</i>\n` +
    `📆 <b>+Days Added:</b> <b>${addedDays} days</b> | Expires: <b>${expiryDate}</b>\n` +
    `🆔 <b>Transaction ID:</b> <code>${transactionId}</code>\n` +
    `✅ <b>Status:</b> ${status}` +
    (extraNote ? `\n\n<i>${extraNote}</i>` : "")
  );
}


// ─── Main Handler ─────────────────────────────────────────────────────────────


export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-06-20" as any,
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

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


  // ── Profile Finders ─────────────────────────────────────────────────────────


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

    if (email) {
      const { data: profileByEmail } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("email", email)
        .maybeSingle();

      if (profileByEmail) {
        if (!profile || profile.id === profileByEmail.id) {
          return profileByEmail;
        }

        // MERGE LOGIC — legacy profile found for same email
        console.log(
          `[Stripe Webhook] Found legacy profile ${profileByEmail.id} for email ${email}. Merging into ${profile.id}.`
        );

        const mergedCredits = (profile.credits || 0) + (profileByEmail.credits || 0);
        const legacyExp = profileByEmail.subscription_expires_at
          ? new Date(profileByEmail.subscription_expires_at)
          : null;
        const currentExp = profile.subscription_expires_at
          ? new Date(profile.subscription_expires_at)
          : null;
        let finalExp = profile.subscription_expires_at;

        if (legacyExp && (!currentExp || legacyExp > currentExp)) {
          finalExp = legacyExp.toISOString();
        }

        await supabaseAdmin
          .from("profiles")
          .update({ email: `migrated_${Date.now()}_${email}`, credits: 0, plan: "free" })
          .eq("id", profileByEmail.id);

        profile.credits = mergedCredits;
        profile.subscription_expires_at = finalExp;
      }
    }
    return profile;
  }


  async function findProfileBySubscription(subscriptionId: string, email?: string | null) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (data) return data;

    console.warn(
      `[Webhook] Profile not found by stripe_subscription_id=${subscriptionId}. Checking Stripe metadata...`
    );

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      if (userId) {
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
      const { data: byEmail } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at, profile_data, display_id")
        .eq("email", email)
        .maybeSingle();
      return byEmail;
    }
    return null;
  }


  // ── Expiry Stacker ───────────────────────────────────────────────────────────
  // Always ADDITIVE — never prorate. Add days on top of current expiry.
  function stackExpiry(currentExpiry: string | null, addDays: number): Date {
    const now = new Date();
    const base = currentExpiry ? new Date(currentExpiry) : now;
    const from = base < now ? now : base; // if expired, start from today
    return new Date(from.getTime() + addDays * 24 * 60 * 60 * 1000);
  }


  // ── Transaction ID Fetcher (only used for charge ID) ─────────────────────────
  async function fetchTransactionId(
    paymentIntentId: string | null,
    invoiceId: string | null
  ): Promise<string> {
    let transactionId = paymentIntentId || invoiceId || "N/A";
    try {
      if (paymentIntentId) {
        const pi = (await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ["latest_charge"],
        })) as any;
        const chargeId =
          typeof pi.latest_charge === "string"
            ? pi.latest_charge
            : pi.latest_charge?.id;
        if (chargeId) transactionId = chargeId;
      } else if (invoiceId) {
        const inv = (await stripe.invoices.retrieve(invoiceId, {
          expand: ["charge"],
        })) as any;
        const chargeId =
          typeof inv.charge === "string" ? inv.charge : inv.charge?.id;
        if (chargeId) transactionId = chargeId;
      }
    } catch (err) {
      console.error("[Webhook] Transaction ID fetch failed:", err);
    }
    return transactionId;
  }


  // ════════════════════════════════════════════════════════════════════════════
  // EVENT: checkout.session.completed
  // ════════════════════════════════════════════════════════════════════════════
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const customerEmail = session.customer_details?.email;

    console.log(
      `[Webhook] checkout.session.completed | userId: ${userId} | email: ${customerEmail}`
    );

    const profile = await findProfile(userId, customerEmail);
    if (!profile) {
      console.error(
        `[Webhook] ❌ No profile found for userId=${userId} email=${customerEmail}`
      );
      return NextResponse.json({ received: true, error: "Profile not found" });
    }

    let priceId: string | undefined;
    let quantity = 1;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      // Find the first line item that exists in our PRICE_ID_MAP
      const planItem = lineItems.data.find(item => item.price?.id && PRICE_ID_MAP[item.price.id]);
      priceId = planItem?.price?.id || lineItems.data[0]?.price?.id;
      quantity = planItem?.quantity || lineItems.data[0]?.quantity || 1;
    } catch (err) {
      console.error("[Webhook] Failed to fetch line items:", err);
    }

    if (!priceId || !PRICE_ID_MAP[priceId]) {
      console.error(`[Webhook] ❌ Unknown Price ID: ${priceId}`);
      return NextResponse.json({ received: true, error: `Unknown priceId: ${priceId}` });
    }

    const { plan, credits, price, days, frequency, unitTotal } = PRICE_ID_MAP[priceId];

    // Dedup guard
    const dedupId = (session.payment_intent as string) || session.id;
    if (profile.profile_data?.last_payment_id === dedupId) {
      console.log(`[Webhook] ⏭️ Already processed payment ${dedupId} — skipping`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // Credits & Days — always ADDITIVE, scaled by quantity
    const oldPlan = profile.plan || "free";
    const oldCredits = profile.credits || 0;
    const addedCredits = credits * quantity;
    const addedDays = days * quantity;
    const newCredits = oldCredits + addedCredits;
    const newExpiry = stackExpiry(profile.subscription_expires_at, addedDays);

    // Payment method details
    let paymentMethodDisplay = "Card";
    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(
          session.payment_intent as string,
          { expand: ["payment_method"] }
        );
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

    // Use actual session.amount_total for checkout (not proration — this IS the real charge)
    // Then extract gateway fee dynamically: total × 0.02/1.02
    const symbol = session.currency?.toUpperCase() === "INR" ? "₹" : "$";
    const actualAmountPaid = (session.amount_total || 0) / 100;

    // Prefer catalog price × qty for display; fall back to actual Stripe amount
    // (they should match for fresh checkouts, but catalog is the ground truth)
    const displayTotal = unitTotal * quantity;
    const { amountLabel, gatewayFee: displayGatewayFee, planPrice } = buildAmountLabel(
      symbol,
      quantity,
      unitTotal,
      frequency
    );

    console.log(
      `[Webhook] Checkout | Stripe charged: ${symbol}${actualAmountPaid} | Display total: ${symbol}${displayTotal} | Gateway fee: ${symbol}${displayGatewayFee}`
    );

    const transactionId = await fetchTransactionId(
      session.payment_intent as string,
      session.invoice as string
    );

    const customerName =
      session.customer_details?.name || customerEmail || "Unknown";
    const eventTime = formatEventTime();

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
          last_frequency: frequency,
        },
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[Webhook] ❌ Supabase update failed:", updateError.message);
      return new NextResponse("DB update failed", { status: 500 });
    }

    const isDowngrade = oldPlan === "elite" && plan === "pro";
    const statusLabel = isDowngrade
      ? "DOWNGRADE 🔻 | STRIPE 💳"
      : "💰 Plan Purchased | STRIPE 💳";

    await sendTelegramAlert(
      buildTelegramMessage({
        header: statusLabel,
        name: customerName,
        email: customerEmail || "N/A",
        dateTime: eventTime,
        oldPlan: `${oldPlan}${profile.profile_data?.last_frequency
          ? ` (${profile.profile_data.last_frequency})`
          : ""
          }`,
        amount: amountLabel,
        newPlan: `${plan} (${frequency})`,
        planPrice: planPrice,
        quantity,
        paymentMethod: paymentMethodDisplay,
        gatewayFees: `${symbol}${displayGatewayFee}`,
        oldCredits,
        newCredits,
        addedCredits,
        addedDays,
        expiryDate: newExpiry.toLocaleDateString("en-IN"),
        transactionId,
      })
    );

    if (customerEmail) {
      try {
        await resend.emails.send({
          from: "Chintu Intelligence <welcome@getchintu.com>",
          to: customerEmail,
          subject: `CHINTU: ${isDowngrade ? "PLAN UPDATED" : "PROTOCOL UPGRADE VERIFIED"
            } ⚡`,
          html: getPaymentEmailHtml(
            customerName,
            plan,
            oldPlan,
            newCredits,
            price,
            eventTime,
            process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com",
            newExpiry.toLocaleDateString("en-IN")
          ),
        });
      } catch (emailErr) {
        console.error("[Webhook] Email failed:", emailErr);
      }
    }
  }


  // ════════════════════════════════════════════════════════════════════════════
  // EVENT: invoice.payment_succeeded (Renewals + mid-cycle upgrades)
  // ════════════════════════════════════════════════════════════════════════════
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;

    // Skip — initial subscription creation is handled by checkout.session.completed
    if (invoice.billing_reason === "subscription_create") {
      console.log(`[Webhook] ⏭️ Skipping invoice for initial subscription creation`);
      return NextResponse.json({ received: true });
    }

    const profile = await findProfileBySubscription(
      invoice.subscription,
      invoice.customer_email
    );
    if (!profile) {
      console.error(
        `[Webhook] ❌ Profile not found for subscription: ${invoice.subscription}`
      );
      return NextResponse.json({ received: true, error: "Profile not found" });
    }

    const dedupId = (invoice.payment_intent as string) || invoice.id;
    if (profile.profile_data?.last_payment_id === dedupId) {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const lineItem = invoice.lines?.data?.find((line: any) => line.price?.id && PRICE_ID_MAP[line.price.id]);
    const priceId = lineItem?.price?.id || invoice.lines?.data?.[0]?.price?.id;
    const planInfo = PRICE_ID_MAP[priceId || ""];
    if (!planInfo) {
      console.error(`[Webhook] ❌ Unknown priceId in invoice: ${priceId}`);
      return NextResponse.json({ received: true, error: `Unknown priceId: ${priceId}` });
    }

    const quantity = lineItem?.quantity || invoice.lines?.data?.[0]?.quantity || 1;

    // Credits & Days — always ADDITIVE. 
    // We give full plan credits+days regardless of what Stripe actually charged
    // (Stripe may charge a proration for mid-cycle changes — we don't care about that for entitlements)
    const addedCredits = planInfo.credits * quantity;
    const addedDays = planInfo.days * quantity;
    const oldCredits = profile.credits || 0;
    const newCredits = oldCredits + addedCredits;
    const newExpiry = stackExpiry(profile.subscription_expires_at, addedDays);

    // ⚠️ KEY FIX: Always use catalog price (unitTotal × qty) for display,
    // NOT invoice.amount_paid which is a Stripe proration (partial charge for mid-cycle changes).
    // This ensures Telegram shows "$9.18" not "$14.47".
    const symbol = invoice.currency?.toUpperCase() === "INR" ? "₹" : "$";
    const { amountLabel, gatewayFee: displayGatewayFee, planPrice } = buildAmountLabel(
      symbol,
      quantity,
      planInfo.unitTotal,
      planInfo.frequency
    );

    const transactionId = await fetchTransactionId(
      invoice.payment_intent as string,
      invoice.id as string
    );

    const customerName =
      invoice.customer_name || invoice.customer_email || profile.email || "Unknown";
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
          last_frequency: planInfo.frequency,
        },
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[Webhook] ❌ Renewal DB update failed:", updateError.message);
      return new NextResponse("DB update failed", { status: 500 });
    }

    const isRenewal = invoice.billing_reason === "subscription_cycle";
    const header = isRenewal
      ? "🔄 Subscription Renewed! | STRIPE 💳"
      : "⚡ Plan Updated (Invoice) | STRIPE 💳";

    await sendTelegramAlert(
      buildTelegramMessage({
        header,
        name: customerName,
        email: profile.email || "N/A",
        dateTime: eventTime,
        oldPlan: `${profile.plan || planInfo.plan} (${planInfo.frequency})`,
        newPlan: `${planInfo.plan} (${planInfo.frequency})`,
        amount: amountLabel,
        planPrice: planPrice,
        quantity,
        paymentMethod: "Card (Recurring)",
        gatewayFees: `${symbol}${displayGatewayFee}`,
        oldCredits,
        newCredits,
        addedCredits,
        addedDays,
        expiryDate: newExpiry.toLocaleDateString("en-IN"),
        transactionId,
      })
    );

    if (profile.email) {
      try {
        await resend.emails.send({
          from: "Chintu Intelligence <billing@getchintu.com>",
          replyTo: "contact@getchintu.com",
          to: profile.email,
          subject: "CHINTU: MISSION EXTENSION VERIFIED 🔄",
          html: getPaymentEmailHtml(
            customerName,
            planInfo.plan,
            profile.plan || "pro",
            newCredits,
            planInfo.price,
            eventTime,
            process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com",
            newExpiry.toLocaleDateString("en-IN")
          ),
        });
      } catch (emailErr) {
        console.error("[Webhook] Renewal email failed:", emailErr);
      }
    }
  }


  // ════════════════════════════════════════════════════════════════════════════
  // EVENT: customer.subscription.updated
  // (Plan-switch notification only — no payment, no credits change here)
  // ════════════════════════════════════════════════════════════════════════════
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const previousAttributes = event.data.previous_attributes as any;

    if (!previousAttributes || (!previousAttributes.items && !previousAttributes.status)) {
      return NextResponse.json({ received: true });
    }

    const isInitialActivation =
      previousAttributes?.status === "incomplete" && subscription.status === "active";
    if (isInitialActivation) return NextResponse.json({ received: true });
    if (subscription.status !== "active") return NextResponse.json({ received: true });

    const priceId = subscription.items.data[0]?.price?.id;
    const planInfo = PRICE_ID_MAP[priceId || ""];
    if (!planInfo) return NextResponse.json({ received: true });

    let customerEmail: string | null = null;
    try {
      const stripeCustomer = await stripe.customers.retrieve(
        subscription.customer as string
      );
      if (stripeCustomer && !stripeCustomer.deleted) {
        customerEmail = (stripeCustomer as Stripe.Customer).email;
      }
    } catch (err) {
      console.error("[Webhook] Customer fetch failed:", err);
    }

    const profile = await findProfileBySubscription(subscription.id, customerEmail);
    if (!profile) return NextResponse.json({ received: true, error: "Profile not found" });

    const oldPlan = profile.plan || "free";
    const isDowngrade = ["elite"].includes(oldPlan) && planInfo.plan === "pro";

    await supabaseAdmin
      .from("profiles")
      .update({ plan: planInfo.plan, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    const symbol = subscription.currency?.toUpperCase() === "inr" ? "₹" : "$";
    const { amountLabel, gatewayFee: displayGatewayFee, planPrice } = buildAmountLabel(
      symbol,
      1,
      planInfo.unitTotal,
      planInfo.frequency
    );

    await sendTelegramAlert(
      buildTelegramMessage({
        header: `${isDowngrade ? "DOWNGRADE 🔻" : "⚡ Upgrade!"} | STRIPE 💳`,
        name: profile.email || "Unknown",
        email: profile.email || "N/A",
        dateTime: formatEventTime(),
        oldPlan: `${oldPlan}${profile.profile_data?.last_frequency
          ? ` (${profile.profile_data.last_frequency})`
          : ""
          }`,
        newPlan: `${planInfo.plan} (${planInfo.frequency})`,
        amount: amountLabel,
        planPrice: planPrice,
        quantity: 1,
        paymentMethod: "—",
        gatewayFees: `${symbol}${displayGatewayFee}`,
        oldCredits: profile.credits || 0,
        newCredits: profile.credits || 0,
        addedCredits: 0,
        addedDays: 0,
        expiryDate: profile.subscription_expires_at
          ? new Date(profile.subscription_expires_at).toLocaleDateString("en-IN")
          : "—",
        transactionId: subscription.id,
        extraNote: "Credits & days will update on next invoice.payment_succeeded event.",
      })
    );
  }


  // ════════════════════════════════════════════════════════════════════════════
  // EVENT: customer.subscription.deleted
  // ════════════════════════════════════════════════════════════════════════════
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ received: true });

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

    let customerName = profile.email || "Unknown";
    try {
      const stripeCustomer = await stripe.customers.retrieve(
        subscription.customer as string
      );
      if (
        stripeCustomer &&
        !stripeCustomer.deleted &&
        (stripeCustomer as Stripe.Customer).name
      ) {
        customerName = (stripeCustomer as Stripe.Customer).name!;
      }
    } catch { }

    await sendTelegramAlert(
      buildTelegramMessage({
        header: "❌ Subscription Cancelled | STRIPE 💳",
        name: customerName,
        email: profile.email || "N/A",
        dateTime: formatEventTime(),
        oldPlan,
        newPlan: "FREE",
        amount: "$0.00",
        planPrice: "$0.00",
        quantity: 1,
        paymentMethod: "—",
        gatewayFees: "$0.00",
        oldCredits: 0,
        newCredits: 10,
        addedCredits: 0,
        addedDays: 0,
        expiryDate: "—",
        transactionId: subscription.id,
        extraNote: "Downgraded to FREE. Consider sending a re-engagement offer.",
      })
    );
  }


  // ════════════════════════════════════════════════════════════════════════════
  // EVENT: customer.deleted
  // ════════════════════════════════════════════════════════════════════════════
  if (event.type === "customer.deleted") {
    const customer = event.data.object as Stripe.Customer;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_customer_id", customer.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ received: true });

    const oldPlan = profile.plan || "unknown";
    const customerName =
      customer.name || customer.email || profile.email || "Unknown";

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

    await sendTelegramAlert(
      buildTelegramMessage({
        header: "🗑️ Customer Deleted | STRIPE 💳",
        name: customerName,
        email: profile.email || "N/A",
        dateTime: formatEventTime(),
        oldPlan,
        newPlan: "FREE",
        amount: "$0.00",
        planPrice: "$0.00",
        quantity: 1,
        paymentMethod: "—",
        gatewayFees: "$0.00",
        oldCredits: 0,
        newCredits: 10,
        addedCredits: 0,
        addedDays: 0,
        expiryDate: "—",
        transactionId: customer.id,
        extraNote: "Stripe records wiped, downgraded to FREE.",
      })
    );
  }


  return NextResponse.json({ received: true });
}