import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { getPaymentEmailHtml } from "@/utils/email-templates";

export const dynamic = 'force-dynamic';

const RAZORPAY_PLANS: Record<string, { plan: string; credits: number; price: string; days: number }> = {
  "pro_monthly": { plan: "pro", credits: 200, price: "₹799/mo", days: 30 },
  "pro_annual": { plan: "pro", credits: 2400, price: "₹7990/yr", days: 365 },
  "elite_monthly": { plan: "elite", credits: 1000, price: "₹2499/mo", days: 30 },
  "elite_annual": { plan: "elite", credits: 12000, price: "₹24990/yr", days: 365 },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId,
      quantity,
      billingCycle = "monthly"
    } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Fulfill Order
    const supabaseAdmin = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Determine plan details
    const planKey = `${planId}_${billingCycle}`; 
    const planInfo = RAZORPAY_PLANS[planKey] || RAZORPAY_PLANS["pro_monthly"];

    const purchasedCredits = planInfo.credits * quantity;
    const purchasedDays = planInfo.days * quantity;
    const existingCredits = profile?.credits || 0;
    const totalCredits = existingCredits + purchasedCredits;

    const now = new Date();
    let currentExpiry = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : now;
    if (currentExpiry < now) currentExpiry = now;
    const newExpiry = new Date(currentExpiry.getTime() + purchasedDays * 24 * 60 * 60 * 1000);

    // Fallback: Get Clerk data if profile is missing name/email
    let userEmail = profile?.email;
    let userName = profile?.full_name;
    
    if (!profile || !userEmail || !userName) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        if (!userEmail) {
          userEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress 
                   || clerkUser.emailAddresses[0]?.emailAddress;
        }
        if (!userName) {
          userName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        }
      } catch (err) {
        console.error("Failed to fetch data from Clerk:", err);
      }
    }

    // Check for email conflicts before upsert to avoid duplicate key errors
    if (userEmail) {
      const { data: conflict } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .neq("id", userId)
        .maybeSingle();
      
      if (conflict) {
        console.warn(`[/api/razorpay/verify] Email conflict for ${userEmail}. Fulfilling without updating email field.`);
        userEmail = null; // Don't try to update email if it belongs to someone else
      }
    }

    // Update Profile (Upsert)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        plan: planInfo.plan,
        credits: totalCredits,
        subscription_expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
        theme: "dark",
        full_name: userName || (profile ? profile.full_name : null),
        email: userEmail || (profile ? profile.email : null)
      });

    if (updateError) throw updateError;

    // Notifications
    const eventTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    const customerName = profile.full_name || userEmail || "User";

    // Send Email via Resend
    if (userEmail) {
      try {
        await resend.emails.send({
          from: 'Chintu Intelligence <welcome@getchintu.com>',
          to: userEmail,
          subject: 'CHINTU: PROTOCOL UPGRADE VERIFIED ⚡',
          html: getPaymentEmailHtml(
            customerName,
            planInfo.plan,
            profile.plan || "free",
            totalCredits,
            planInfo.price,
            eventTime,
            process.env.NEXT_PUBLIC_APP_URL || 'https://getchintu.com'
          ),
        });
        console.log(`[/api/razorpay/verify] Payment email sent to ${userEmail}`);
      } catch (emailErr) {
        console.error("Failed to send payment email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[/api/razorpay/verify] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
