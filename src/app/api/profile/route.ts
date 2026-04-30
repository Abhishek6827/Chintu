import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createAdminClient } from "@/utils/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const supabaseAdmin = createAdminClient();

    // Body may contain { profile_data, raw_profile, theme, history }
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
    const { userId } = auth();
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
