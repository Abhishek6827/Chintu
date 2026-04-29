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

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address;

    const supabase = createAdminClient();
    if (!supabase) {
      console.error('Supabase Admin client not initialized');
      return new Response('Internal Server Error', { status: 500 });
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: id,
        email: email,
        credits: 10,
        plan: 'free'
      });

    if (error) {
      console.error('Error inserting user into Supabase:', error);
      return new Response('Error syncing user', { status: 500 });
    }

    // --- Send Telegram Notification ---
    try {
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChatId = process.env.TELEGRAM_CHAT_ID;
      
      if (tgToken && tgChatId) {
        const message = `🎉 *New User Joined!*\n\n📧 Email: ${email}\n🆔 ID: ${id}\n✨ 10 Credits added to their profile.`;
        
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: message,
            parse_mode: 'Markdown'
          }),
        });
      }
    } catch (tgErr) {
      console.error('Telegram notification failed:', tgErr);
      // Don't fail the whole webhook if telegram fails
    }

    return new Response('User synced successfully', { status: 200 });
  }

  return new Response('', { status: 200 })
}
