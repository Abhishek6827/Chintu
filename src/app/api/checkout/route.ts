import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2024-06-20" as any,
    });

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { priceId, quantity = 1, email } = await req.json();

        if (!priceId) {
            return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
        }

        // 🔴 FIX 2: Reuse existing Stripe Customer
        const supabaseAdmin = createAdminClient();
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", userId)
            .maybeSingle();

        // Calculate amount including 2% fee
        const STRIPE_BASE_PRICES: Record<string, number> = {
            "price_1TTF8WLYcsTnVrvkaLcpMyel": 9.00,
            "price_1TTFChLYcsTnVrvkUllytzc2": 89.00,
            "price_1TTFBELYcsTnVrvkKpZSsGRN": 29.00,
            "price_1TTFDhLYcsTnVrvkGGjCkxv5": 279.00,
        };

        const basePrice = STRIPE_BASE_PRICES[priceId] || 0;
        const amountWithFee = Math.round(basePrice * 1.02 * 100); // in cents

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: email }),
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product: priceId.includes('pro') ? 'prod_RC1m0ZLYcsTnVrvk' : 'prod_RC1n0ZLYcsTnVrvk',
                    unit_amount: amountWithFee,
                    recurring: { interval: priceId.includes('monthly') ? 'month' : 'year' },
                },
                quantity: quantity
            }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/room?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/pricing?payment=cancelled`,
            metadata: { userId },
            subscription_data: { metadata: { userId } },
        });



        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("[/api/checkout] Error creating session:", error.message);
        if (error.code === 'resource_missing') {
            return NextResponse.json({ error: "Invalid Price ID. Please check your Stripe Dashboard." }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
