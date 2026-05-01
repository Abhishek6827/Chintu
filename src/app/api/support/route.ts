import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, message, userEmail, userId: userClerkId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
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
      `📩 <b>SUPPORT REQUEST</b>\n\n` +
      `👤 <b>From:</b> <code>${userEmail}</code>\n` +
      `🆔 <b>User ID:</b> <code>${userClerkId}</code>\n` +
      `📌 <b>Subject:</b> ${subject || "General"}\n` +
      `🕐 <b>Time:</b> ${now}\n\n` +
      `💬 <b>Message:</b>\n<i>${message.trim()}</i>`;

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
