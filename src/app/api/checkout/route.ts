import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
        apiVersion: "2024-06-20" as any,
    });

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { priceId, quantity = 1 } = await req.json();

        if (!priceId) {
            return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/room?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/pricing?payment=cancelled`,
            metadata: {
                userId,
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
