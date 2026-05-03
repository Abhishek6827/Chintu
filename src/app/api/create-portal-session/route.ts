import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
        apiVersion: "2024-06-20" as any,
    });

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", userId)
            .single();

        if (!profile?.stripe_customer_id) {
            return NextResponse.json({ error: "No active subscription found. Please subscribe first." }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://getchintu.com"}/setup`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("[/api/create-portal-session] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
