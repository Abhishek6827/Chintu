import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2024-06-20" as any,
    });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
        return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["line_items", "subscription", "payment_intent"],
        });

        const email = session.customer_details?.email;
        const supabase = createAdminClient();
        
        let profile = null;
        if (email) {
            const { data } = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
            profile = data;
        }

        const totalAmount = (session.amount_total || 0) / 100;
        const currency = (session.currency || "usd").toUpperCase();
        
        // Calculate 2% logic (Total = PlanPrice * 1.02)
        const planPrice = totalAmount / 1.02;
        const gatewayFees = totalAmount - planPrice;

        const details = {
            transactionId: session.id,
            totalAmount: totalAmount.toFixed(2),
            currency,
            plan: session.line_items?.data[0]?.description || "Strategic Plan",
            quantity: session.line_items?.data[0]?.quantity || 1,
            planPrice: planPrice.toFixed(2),
            gatewayFees: gatewayFees.toFixed(2),
            newCredits: profile?.credits || 0,
            expiryDate: profile?.subscription_expires_at 
                ? new Date(profile.subscription_expires_at).toLocaleDateString("en-IN")
                : "N/A",
            status: "SUCCESSFUL",
        };

        return NextResponse.json(details);
    } catch (error: any) {
        console.error("[/api/checkout/session] Error retrieving session:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
