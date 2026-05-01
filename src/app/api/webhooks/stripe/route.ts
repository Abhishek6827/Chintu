import { headers } from "next/headers";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { getPaymentEmailHtml } from "@/utils/email-templates";

const PRICE_ID_MAP: Record<string, { plan: string; credits: number; price: string; days: number }> = {
  // Pro Monthly
  "price_1TRu3pLYcsTnVrvkVfZIjTLC": { plan: "pro", credits: 200, price: "$9/mo", days: 30 },
  // Pro Annual
  "price_1TRu4ILYcsTnVrvkcfBbwSBr": { plan: "pro", credits: 2400, price: "$89/yr", days: 365 },
  // Elite Monthly
  "price_1TRu4jLYcsTnVrvkJ7gkHA91": { plan: "elite", credits: 1000, price: "$29/mo", days: 30 },
  // Elite Annual
  "price_1TRu5ALYcsTnVrvk3dMorbBe": { plan: "elite", credits: 12000, price: "$279/yr", days: 365 },
};

async function sendTelegramAlert(message: string) {
  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("[Stripe Webhook] Telegram alert failed:", err);
  }
}

function formatEventTime(): string {
  const now = new Date();
  return now.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
  });
}

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-06-20" as any,
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error verifying signature: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // ─── Handle Checkout Session Completed ──────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error("[Stripe Webhook] No userId in session metadata");
      return new NextResponse("No userId in metadata", { status: 400 });
    }

    // Retrieve line items to get the Price ID
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;

    if (!priceId || !PRICE_ID_MAP[priceId]) {
      console.error(`[Stripe Webhook] Unknown or missing Price ID: ${priceId}`);
      // Fallback or handle error
    } else {
      const { plan, credits, price, days } = PRICE_ID_MAP[priceId];
      const quantity = lineItems.data[0]?.quantity || 1;
      const purchasedCredits = credits * quantity;
      const purchasedDays = days * quantity;

      // Fetch user's current status for stacking
      const { data: currentProfile } = await supabaseAdmin
        .from("profiles")
        .select("plan, email, credits, subscription_expires_at")
        .eq("id", userId)
        .maybeSingle();

      const oldPlan = currentProfile?.plan || "free";
      const existingCredits = currentProfile?.credits || 0;
      
      // 1. Stack Credits
      const totalCredits = existingCredits + purchasedCredits;

      // 2. Pro-rata Date Extension
      const now = new Date();
      let currentExpiry = currentProfile?.subscription_expires_at 
        ? new Date(currentProfile.subscription_expires_at) 
        : now;
      
      // If current expiry is in the past, start from now
      if (currentExpiry < now) currentExpiry = now;
      const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

      console.log(`[Stripe Webhook] Stacking for user ${userId}: Credits ${existingCredits} + ${purchasedCredits} = ${totalCredits}`);
      console.log(`[Stripe Webhook] Extending expiry for user ${userId}: to ${newExpiry.toISOString()}`);

      // Get customer name from Stripe
      const customerName = session.customer_details?.name || session.customer_details?.email || "Unknown";

      // Update Supabase Profile
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: plan,
          credits: totalCredits,
          subscription_expires_at: newExpiry.toISOString(),
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("[Stripe Webhook] Error updating profile:", error.message);
        return new NextResponse("Error updating profile", { status: 500 });
      }

      // ─── Send Telegram Alert ─────────────────────────────
      const eventTime = formatEventTime();
      await sendTelegramAlert(
        `💰 <b>New Subscription!</b>\n\n` +
        `👤 Name: <b>${customerName}</b>\n` +
        `📧 Email: <code>${session.customer_details?.email || currentProfile?.email || "N/A"}</code>\n` +
        `📅 Date: <code>${eventTime}</code>\n` +
        `💎 Plan: <b>${oldPlan.toUpperCase()}</b> → <b>${plan.toUpperCase()}</b>\n` +
        `💲 Price: <b>${price}</b> × ${quantity}\n` +
        `⚡ Credits: <b>${totalCredits}</b>\n` +
        `⏳ Expires: <code>${newExpiry.toLocaleDateString()}</code>\n` +
        `💳 Session: <code>${session.id.slice(-10)}</code>`
      );

      // ─── Send Premium Email ─────────────────────────────
      const userEmail = session.customer_details?.email;
      if (userEmail) {
        await resend.emails.send({
          from: 'Chintu Intelligence <welcome@getchintu.com>',
          replyTo: 'contact@getchintu.com',
          to: userEmail,
          subject: 'Access Granted: Your Chintu Upgrade is Active ⚡',
          html: getPaymentEmailHtml(plan, totalCredits, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
          text: `Your upgrade to the ${plan.toUpperCase()} tier is verified. Advanced strategic engines and high-priority features are now fully operational.\n\nTactical Credit Allocation: ${totalCredits} Credits Provisioned\n\nQuestions? Contact our support team at contact@getchintu.com\n\nYou are receiving this receipt because of a recent transaction on your Chintu Intelligence account.\nChintu Intelligence, 123 Tech Avenue, Innovation District, CA 94105\n\n© 2026 Chintu Intelligence Ecosystem • Professional Tier Verified`
        });
      }
    }
  }

  // ─── Handle Invoice Payment Succeeded (Renewals) ────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
      // Find user by subscription ID
      const { data: profile, error: findError } = await supabaseAdmin
        .from("profiles")
        .select("id, plan, email, credits, subscription_expires_at")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (profile && !findError) {
        // Stack credits and extend days based on plan
        const priceId = invoice.lines?.data?.[0]?.price?.id;
        const planInfo = PRICE_ID_MAP[priceId || ""];
        
        if (planInfo) {
          const quantity = invoice.lines?.data?.[0]?.quantity || 1;
          const purchasedCredits = planInfo.credits * quantity;
          const purchasedDays = planInfo.days * quantity;

          const existingCredits = profile.credits || 0;
          const totalCredits = existingCredits + purchasedCredits;

          const now = new Date();
          let currentExpiry = profile.subscription_expires_at 
            ? new Date(profile.subscription_expires_at) 
            : now;
          
          if (currentExpiry < now) currentExpiry = now;
          const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

          await supabaseAdmin
            .from("profiles")
            .update({ 
              credits: totalCredits, 
              subscription_expires_at: newExpiry.toISOString(),
              updated_at: new Date().toISOString() 
            })
            .eq("id", profile.id);

          // Get customer name from invoice
          const invoiceCustomerName = invoice.customer_name || invoice.customer_email || profile.email || "Unknown";
          const eventTime = formatEventTime();

          // ─── Send Telegram Alert ─────────────────────────────
          // Telegram Alert
          await sendTelegramAlert(
            `🔄 <b>Subscription Renewed</b>\n\n` +
            `👤 Name: <b>${invoiceCustomerName}</b>\n` +
            `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
            `📅 Date: <code>${eventTime}</code>\n` +
            `💎 Plan: <b>${planInfo.plan.toUpperCase()}</b>\n` +
            `💲 Price: <b>${planInfo.price}</b> × ${quantity}\n` +
            `⚡ Credits (Stacked): <b>${totalCredits}</b>\n` +
            `⏳ New Expiry: <code>${newExpiry.toLocaleDateString()}</code>`
          );

          // Email
          if (profile.email) {
            await resend.emails.send({
              from: 'Chintu Intelligence <billing@getchintu.com>',
              replyTo: 'contact@getchintu.com',
              to: profile.email,
              subject: 'Mission Extended: Your Credits have been Stacked 🔄',
              html: getPaymentEmailHtml(planInfo.plan, totalCredits, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
              text: `Your subscription to the ${planInfo.plan.toUpperCase()} tier has been successfully renewed.\n\nTactical Credit Allocation: ${totalCredits} Credits Provisioned (Stacked)\n\nQuestions? Contact our support team at contact@getchintu.com\n\nYou are receiving this receipt because of a recent transaction on your Chintu Intelligence account.\nChintu Intelligence, 123 Tech Avenue, Innovation District, CA 94105\n\n© 2026 Chintu Intelligence Ecosystem • Professional Tier Verified`
            });
          }
        }
      }
    }
  }

  // ─── Handle Subscription Updated (Plan/Quantity Change) ───
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const previousAttributes = event.data.previous_attributes as any;
    
    // Only process if items (plan/quantity) changed, or status changed
    if (previousAttributes && (previousAttributes.items || previousAttributes.status)) {
      const priceId = subscription.items.data[0]?.price.id;
      const quantity = subscription.items.data[0]?.quantity || 1;
      
      const planInfo = PRICE_ID_MAP[priceId || ""];
      if (planInfo && subscription.status === "active") {
        // Find user by subscription ID
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, plan, email, credits, subscription_expires_at")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (profile) {
          const oldPlan = profile.plan || "free";
          const purchasedCredits = planInfo.credits * quantity;
          const purchasedDays = planInfo.days * quantity;

          const existingCredits = profile.credits || 0;
          const totalCredits = existingCredits + purchasedCredits;

          const now = new Date();
          let currentExpiry = profile.subscription_expires_at 
            ? new Date(profile.subscription_expires_at) 
            : now;
          
          if (currentExpiry < now) currentExpiry = now;
          const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

          console.log(`[Stripe Webhook] Subscription Updated for user ${profile.id}: ${oldPlan} → ${planInfo.plan}, Qty ${quantity}`);
          
          // Update Supabase
          await supabaseAdmin
            .from("profiles")
            .update({ 
              plan: planInfo.plan,
              credits: totalCredits, 
              subscription_expires_at: newExpiry.toISOString(),
              updated_at: new Date().toISOString() 
            })
            .eq("id", profile.id);

          // Get customer name from Stripe
          let customerName = profile.email || "Unknown";
          try {
            const stripeCustomer = await stripe.customers.retrieve(subscription.customer as string);
            if (stripeCustomer && !stripeCustomer.deleted && (stripeCustomer as Stripe.Customer).name) {
              customerName = (stripeCustomer as Stripe.Customer).name!;
            }
          } catch {} 

          const eventTime = formatEventTime();

          // Telegram Alert
          await sendTelegramAlert(
            `📈 <b>Plan Changed</b>\n\n` +
            `👤 Name: <b>${customerName}</b>\n` +
            `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
            `📅 Date: <code>${eventTime}</code>\n` +
            `💎 Old Plan: <b>${oldPlan.toUpperCase()}</b>\n` +
            `💎 New Plan: <b>${planInfo.plan.toUpperCase()}</b>\n` +
            `💲 Price: <b>${planInfo.price}</b> × ${quantity}\n` +
            `⚡ Total Credits (Stacked): <b>${totalCredits}</b>\n` +
            `⏳ New Expiry: <code>${newExpiry.toLocaleDateString()}</code>`
          );
          
          // Send Email
          if (profile.email) {
            await resend.emails.send({
              from: 'Chintu Intelligence <billing@getchintu.com>',
              replyTo: 'contact@getchintu.com',
              to: profile.email,
              subject: 'Subscription Successfully Updated 📈',
              html: getPaymentEmailHtml(planInfo.plan, totalCredits, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
              text: `Your subscription to the ${planInfo.plan.toUpperCase()} tier has been successfully updated.\n\nTactical Credit Allocation: ${totalCredits} Credits Provisioned\n\nQuestions? Contact our support team at contact@getchintu.com\n\nYou are receiving this receipt because of a recent transaction on your Chintu Intelligence account.\nChintu Intelligence, 123 Tech Avenue, Innovation District, CA 94105\n\n© 2026 Chintu Intelligence Ecosystem • Professional Tier Verified`
            });
          }
        }
      }
    }
  }

  // ─── Handle Subscription Cancelled / Deleted ───
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();

    if (profile) {
      const oldPlan = profile.plan || "unknown";
      console.log(`[Stripe Webhook] Subscription Cancelled for user ${profile.id}`);
      
      await supabaseAdmin
        .from("profiles")
        .update({ 
          plan: "free",
          credits: 10, 
          stripe_subscription_id: null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", profile.id);

      // Get customer name from Stripe
      let customerName = profile.email || "Unknown";
      try {
        const stripeCustomer = await stripe.customers.retrieve(subscription.customer as string);
        if (stripeCustomer && !stripeCustomer.deleted && (stripeCustomer as Stripe.Customer).name) {
          customerName = (stripeCustomer as Stripe.Customer).name!;
        }
      } catch {}

      const eventTime = formatEventTime();

      await sendTelegramAlert(
        `❌ <b>Subscription Cancelled</b>\n\n` +
        `👤 Name: <b>${customerName}</b>\n` +
        `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
        `📅 Date: <code>${eventTime}</code>\n` +
        `💎 Old Plan: <b>${oldPlan.toUpperCase()}</b> → <b>FREE</b>\n` +
        `💰 Credits reset to: <b>10</b>\n\n` +
        `⚠️ <i>User downgraded to Free plan. Consider sending a re-engagement offer.</i>`
      );
    }
  }

  // ─── Handle Customer Deleted ───
  if (event.type === "customer.deleted") {
    const customer = event.data.object as Stripe.Customer;
    
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan")
      .eq("stripe_customer_id", customer.id)
      .maybeSingle();

    if (profile) {
      const oldPlan = profile.plan || "unknown";
      const customerName = customer.name || customer.email || profile.email || "Unknown";
      console.log(`[Stripe Webhook] Customer Deleted for user ${profile.id}`);
      
      await supabaseAdmin
        .from("profiles")
        .update({ 
          plan: "free",
          credits: 10, 
          stripe_customer_id: null,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", profile.id);

      const eventTime = formatEventTime();

      await sendTelegramAlert(
        `🗑️ <b>Customer Deleted</b>\n\n` +
        `👤 Name: <b>${customerName}</b>\n` +
        `📧 Email: <code>${profile.email || "N/A"}</code>\n` +
        `📅 Date: <code>${eventTime}</code>\n` +
        `💎 Plan was: <b>${oldPlan.toUpperCase()}</b> → <b>FREE</b>\n` +
        `⚠️ Stripe records wiped and downgraded to FREE.`
      );
    }
  }

  return NextResponse.json({ received: true });
}
