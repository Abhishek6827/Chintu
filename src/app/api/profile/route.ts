import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { createAdminClient } from "@/utils/supabase/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();

    const client = await clerkClient();
    const userObj = await client.users.getUser(userId);
    const email = userObj.emailAddresses[0]?.emailAddress;

    // Fetch existing profile to check plan and current data
    const supabaseAdmin = createAdminClient();
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    const plan = (existing?.plan || "free").toLowerCase();

    // Plan Gating: If free, block updates to profile_data, raw_profile and current_jd if they already exist
    if (plan === "free") {
      if ((body.profile_data || body.raw_profile) && (existing?.profile_data || existing?.raw_profile)) {
        return new NextResponse("Starter plan is limited to 1 profile. Upgrade to Pro for unlimited updates.", { status: 403 });
      }
      if ("current_jd" in body && (existing?.current_jd || existing?.profile_data?.saved_jd)) {
        return new NextResponse("Starter plan is limited to 1 job description. Upgrade to Pro for unlimited JDs.", { status: 403 });
      }
      if (body.history) {
        return new NextResponse("History saving is a premium feature. Upgrade to Pro/Elite.", { status: 403 });
      }
    }

    const { current_jd, ...rest } = body;

    // List of columns that DEFINITELY exist in the profiles table
    const allowedColumns = ["id", "full_name", "username", "display_id", "profile_data", "raw_profile", "theme", "plan", "credits", "history", "updated_at", "payment_provider", "razorpay_payment_id"];

    const updateData: any = { id: userId, email, updated_at: new Date().toISOString() };

    // Map rest of body to allowed columns
    Object.keys(rest).forEach(key => {
      if (allowedColumns.includes(key)) {
        updateData[key] = rest[key];
      }
    });

    // Deep-merge incoming profile_data with existing so clients can't accidentally
    // wipe nested fields like payment_amount, payment_type, credit_history, etc.
    if (updateData.profile_data && existing?.profile_data) {
      updateData.profile_data = {
        ...existing.profile_data,
        ...updateData.profile_data
      };
    }

    if (current_jd !== undefined) {
      updateData.profile_data = {
        ...(updateData.profile_data || existing?.profile_data || {}),
        saved_jd: current_jd
      };
    }

    // Use UPSERT with merge-like behavior by including existing data
    const finalData = {
      ...(existing || {}),
      ...updateData
    };

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(finalData, { onConflict: 'email' });

    if (error) {
      console.error("Supabase Profile Save Error:", error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const client = await clerkClient();
    const userObj = await client.users.getUser(userId);
    const email = userObj.emailAddresses[0]?.emailAddress;
    const fullName = [userObj.firstName, userObj.lastName].filter(Boolean).join(" ") || "Unknown User";

    const supabaseAdmin = createAdminClient();

    // Attempt to fetch profile
    const { data: initialData, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    let data = initialData;

    // AUTO-SYNC: If profile doesn't exist in Supabase but user is logged in via Clerk
    if (!data && !fetchError) {
      console.log(`[Auto-Sync] Creating missing profile for ${email}`);
      const now = new Date();
      const provider = userObj.externalAccounts[0]?.provider || 'email';
      const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');
      const displayTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).replace(':', '');
      const displayId = `CHINTU-${provider.toUpperCase()}-${dateStr}-${displayTimeStr}`;
      const nextRefill = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: newData, error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          username: userObj.username || null,
          display_id: displayId,
          credits: 10,
          plan: 'free',
          updated_at: now.toISOString(),
          profile_data: {
            free_credits_refill_at: nextRefill
          }
        }, { onConflict: 'email' })
        .select()
        .single();

      if (upsertError) {
        console.error("[Auto-Sync] Failed:", upsertError.message);
      } else {
        data = newData;
      }
    }

    if (data) {
      data.current_jd = data.current_jd || data.profile_data?.saved_jd || "";

      // Monthly free credits refill for free users
      const userPlan = (data.plan || "free").toLowerCase();
      if (userPlan === "free") {
        const now = new Date();
        const refillAt = data.profile_data?.free_credits_refill_at;
        if (!refillAt || new Date(refillAt) <= now) {
          const nextRefill = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: updatedProfile, error: refillError } = await supabaseAdmin
            .from("profiles")
            .update({
              credits: 10,
              updated_at: now.toISOString(),
              profile_data: {
                ...(data.profile_data || {}),
                free_credits_refill_at: nextRefill
              }
            })
            .eq("email", email)
            .select()
            .single();

          if (!refillError && updatedProfile) {
            data = updatedProfile;
            data.current_jd = data.current_jd || data.profile_data?.saved_jd || "";
          } else if (refillError) {
            console.error("[Free Refill] Failed:", refillError.message);
          }
        }
      }

      // Re-sync Razorpay payment details if cached data is missing
      const pd = data.profile_data as any;
      if (data.razorpay_payment_id && (!pd?.payment_amount || !pd?.payment_type)) {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "",
          });
          const payment = await razorpay.payments.fetch(data.razorpay_payment_id);
          if (payment) {
            const amountINR = Number(payment.amount) / 100;
            let method = payment.method || "razorpay";
            if (payment.method === "upi" && payment.vpa) {
              method = "UPI";
            } else if (payment.method === "card" && payment.card) {
              method = `${payment.card.network || ""} ${payment.card.type || ""}`.trim().toUpperCase() || "CARD";
            } else if (payment.method) {
              method = payment.method.toUpperCase();
            }
            const updatedProfileData = {
              ...(pd || {}),
              payment_amount: amountINR,
              payment_type: method,
              last_payment_at: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : new Date().toISOString(),
            };
            const { data: updatedProfile, error: syncError } = await supabaseAdmin
              .from("profiles")
              .update({
                profile_data: updatedProfileData,
                updated_at: new Date().toISOString(),
              })
              .eq("email", email)
              .select()
              .single();
            if (!syncError && updatedProfile) {
              data = updatedProfile;
              data.current_jd = data.current_jd || data.profile_data?.saved_jd || "";
              console.log("[Profile] Re-synced Razorpay payment data:", data.razorpay_payment_id);
            } else if (syncError) {
              console.error("[Profile] Payment re-sync failed:", syncError.message);
            }
          }
        } catch (rzErr: any) {
          console.error("[Profile] Razorpay re-sync error:", rzErr?.message || rzErr);
        }
      }
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Profile API GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
