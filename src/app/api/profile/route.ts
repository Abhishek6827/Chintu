import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();

    // Fetch existing profile to check plan and current data
    const supabaseAdmin = createAdminClient();
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const plan = (existing?.plan || "free").toLowerCase();

    // Plan Gating: If free, block updates to profile_data, raw_profile and current_jd if they already exist
    if (plan === "free") {
      if ((body.profile_data || body.raw_profile) && (existing?.profile_data || existing?.raw_profile)) {
        return new NextResponse("Starter plan is limited to 1 profile. Upgrade to Pro for unlimited updates.", { status: 403 });
      }
      if ("current_jd" in body && existing?.current_jd) {
        return new NextResponse("Starter plan is limited to 1 job description. Upgrade to Pro for unlimited JDs.", { status: 403 });
      }
    }

    // Body may contain { profile_data, raw_profile, theme, history, current_jd }
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, ...body, updated_at: new Date().toISOString() });

    if (error) {
      console.error("Supabase Profile Upsert Error:", error);
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

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) return new NextResponse(error.message, { status: 500 });
    
    return NextResponse.json({ profile: data });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
