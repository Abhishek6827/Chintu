import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  try {
    const { subject, message, userEmail, fullName, userName, userId: providedUserId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!userEmail?.trim() && !userId) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Send to Telegram
    const tgToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (!tgToken || !tgChatId) {
      console.error("[/api/support] Missing Telegram env vars");
      return NextResponse.json({ error: "Support channel not configured" }, { status: 500 });
    }

    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const tgMessage =
      `📩 <b>NEW SUPPORT INQUIRY</b>\n\n` +
      `👤 <b>Name:</b> <code>${fullName || userName || "Anonymous"}</code>\n` +
      `📧 <b>Email:</b> <code>${userEmail}</code>\n` +
      `🆔 <b>ID:</b> <code>${userId || providedUserId || "GUEST_SESSION"}</code>\n` +
      `📌 <b>Subject:</b> ${subject || "General Inquiry"}\n` +
      `🕐 <b>Time:</b> ${now}\n\n` +
      `💬 <b>Message:</b>\n<blockquote>${message.trim()}</blockquote>`;

    await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: tgChatId,
        text: tgMessage,
        parse_mode: "HTML",
      }),
    });

    console.log(`[/api/support] Support message sent from ${userEmail}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/support] Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
