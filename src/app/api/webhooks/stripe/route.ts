import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

// Map Price IDs to Plan and Credits
// IMPORTANT: Update these with your real Stripe Price IDs
const PRICE_ID_MAP: Record<string, { plan: string; credits: number }> = {
  // Pro Monthly
  "price_1TRu3pLYcsTnVrvkVfZIjTLC": { plan: "pro", credits: 200 },
  // Pro Annual
  "price_1TRu4ILYcsTnVrvkcfBbwSBr": { plan: "pro", credits: 2400 }, // 200 * 12
  // Elite Monthly
  "price_1TRu4jLYcsTnVrvkJ7gkHA91": { plan: "elite", credits: 1000 },
  // Elite Annual
  "price_1TRu5ALYcsTnVrvk3dMorbBe": { plan: "elite", credits: 12000 }, // 1000 * 12
};

export async function POST(req: Request) {
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
      const { plan, credits } = PRICE_ID_MAP[priceId];

      console.log(`[Stripe Webhook] Updating user ${userId} to plan ${plan} with ${credits} credits`);

      // Update Supabase Profile
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: plan,
          credits: credits,
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
      await sendTelegramAlert(
        `💰 <b>New Subscription!</b>\n\n` +
        `👤 User: <code>${userId}</code>\n` +
        `💎 Plan: <b>${plan.toUpperCase()}</b>\n` +
        `⚡ Credits added: <b>${credits}</b>\n` +
        `💳 Session: <code>${session.id.slice(-10)}</code>`
      );
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
        .select("id, plan")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (profile && !findError) {
        // Reset credits based on plan
        const priceId = invoice.lines?.data?.[0]?.price?.id;
        const planInfo = PRICE_ID_MAP[priceId || ""];
        
        if (planInfo) {
          const monthlyCredits = planInfo.plan === "pro" ? 200 : 1000;
          await supabaseAdmin
            .from("profiles")
            .update({ credits: monthlyCredits, updated_at: new Date().toISOString() })
            .eq("id", profile.id);

          // ─── Send Telegram Alert ─────────────────────────────
          await sendTelegramAlert(
            `🔄 <b>Subscription Renewed</b>\n\n` +
            `👤 User: <code>${profile.id}</code>\n` +
            `💎 Plan: <b>${planInfo.plan.toUpperCase()}</b>\n` +
            `⚡ Credits reset: <b>${monthlyCredits}</b>`
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
