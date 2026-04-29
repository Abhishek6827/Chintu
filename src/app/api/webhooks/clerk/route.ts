import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type;
  const supabase = createAdminClient();

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address;

    // --- Generate Standard Display ID ---
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-'); // 29-04-2026
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    
    // Extract provider safely
    const provider = (evt.data as any).external_accounts?.[0]?.provider || 'email';
    const displayId = `CHINTU-${provider.toUpperCase()}-${dateStr}-${timeStr}`;

    console.log(`[/api/webhooks/clerk] Syncing user ${id} with Display ID ${displayId}`);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: id,
        email: email,
        display_id: displayId,
        credits: 10,
        plan: 'free',
        updated_at: now.toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing user to Supabase:', error);
    }

    // --- Send Telegram Notification ---
    try {
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChatId = process.env.TELEGRAM_CHAT_ID;
      
      if (tgToken && tgChatId) {
        console.log(`[/api/webhooks/clerk] Attempting to send Telegram notification to ${tgChatId}...`);
        
        // Use HTML instead of Markdown to avoid underscore (_) errors
        const message = `🎉 <b>New User Joined!</b>\n\n` +
                        `📧 <b>Email:</b> ${email}\n` +
                        `🆔 <b>ID:</b> <code>${id}</code>\n` +
                        `🏷️ <b>Display ID:</b> <code>${displayId}</code>\n` +
                        `✨ 10 Credits added to their profile.`;
        
        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: message,
            parse_mode: 'HTML'
          }),
        });
        console.log(`[/api/webhooks/clerk] Telegram response status: ${tgRes.status}`);
      } else {
        console.warn(`[/api/webhooks/clerk] Telegram variables missing: Token? ${!!tgToken}, ChatId? ${!!tgChatId}`);
      }
    } catch (tgErr) {
      console.error('Telegram notification failed:', tgErr);
    }

    return new Response('User synced successfully', { status: 200 });
  }

  return new Response('', { status: 200 })
}
