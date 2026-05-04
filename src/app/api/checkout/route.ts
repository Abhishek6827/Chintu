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

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            // If customer exists, reuse it; otherwise use customer_email
            ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: email }),
            line_items: [{ price: priceId, quantity }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/room?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/pricing?payment=cancelled`,
            metadata: {
                userId,
            },
            // 🔴 FIX 1: Attach metadata to subscription so it's available in all invoice events
            subscription_data: {
                metadata: {
                    userId,
                },
            },
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
