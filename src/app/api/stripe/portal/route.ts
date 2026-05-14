import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 0 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-06-20" as any,
  });

  const client = await clerkClient();
  const userObj = await client.users.getUser(userId);
  const email = userObj.emailAddresses[0]?.emailAddress;

  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("email", email)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    // If no customer ID, redirect to pricing page or just back home
    return NextResponse.redirect(new URL("/pricing", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/room`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Error creating portal session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
