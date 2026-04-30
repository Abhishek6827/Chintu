import { Webhook } from 'svix'
export const dynamic = "force-dynamic";
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { getWelcomeEmailHtml } from '@/utils/email-templates'


export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
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
  const body = await req.text();

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

    // Safety Check: If no email is found, it might be a partial signup or a failed attempt
    if (!email) {
      console.warn(`[/api/webhooks/clerk] User ${id} created without an email address. Skipping sync to prevent ghost entries.`);
      return new Response('No email found, skipping sync', { status: 200 });
    }

    // --- Generate Standard Display ID ---
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-'); // 29-04-2026
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    
    // Extract provider safely
    const externalAccounts = (evt.data as any).external_accounts || [];
    const provider = externalAccounts[0]?.provider || 'email';
    const displayId = `CHINTU-${provider.toUpperCase()}-${dateStr}-${timeStr}`;

    console.log(`[/api/webhooks/clerk] Syncing user ${id} with Display ID ${displayId}`);

    // Check if user already exists to prevent duplicate notifications
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

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

    // If user already existed, skip notifications
    if (existingProfile) {
      console.log(`[/api/webhooks/clerk] User ${id} already exists. Skipping duplicate notifications.`);
      return new Response('User already exists, notifications skipped', { status: 200 });
    }

    // --- Send Telegram Notification ---
    try {
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChatId = process.env.TELEGRAM_CHAT_ID;
      
      if (tgToken && tgChatId) {
        console.log(`[/api/webhooks/clerk] Attempting to send Telegram notification to ${tgChatId}...`);
        
        // --- PREMIUM TELEGRAM ALERT ---
        const message = 
          `🚀 <b>STRATEGIC ALERT: NEW USER ACQUISITION</b>\n\n` +
          `✨ <b>Status:</b> <code>Success / Verified</code>\n` +
          `👤 <b>User:</b> <code>${email}</code>\n` +
          `🆔 <b>Clerk ID:</b> <code>${id}</code>\n` +
          `🏷️ <b>Internal ID:</b> <code>${displayId}</code>\n` +
          `🛡️ <b>Auth Provider:</b> <code>${provider.toUpperCase()}</code>\n\n` +
          `💰 <b>Onboarding Reward:</b> <code>10 Credits Provisioned</code>\n\n` +
          `📈 <i>Chintu AI Ecosystem Growth +1</i>`;
        
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

    // --- Send Welcome Email via Resend ---
    try {
      if (process.env.RESEND_API_KEY && email) {
        console.log(`[/api/webhooks/clerk] Attempting to send welcome email to ${email}...`);
        
        await resend.emails.send({
          from: 'Chintu Intelligence <welcome@getchintu.com>', // Dedicated welcome address
          to: email,
          subject: 'Welcome to Chintu Intelligence Ecosystem 🚀',
          html: getWelcomeEmailHtml(displayId, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
        });
        console.log(`[/api/webhooks/clerk] Welcome email sent successfully to ${email}`);
      } else {
        console.warn(`[/api/webhooks/clerk] Resend API Key or User Email missing. Key? ${!!process.env.RESEND_API_KEY}`);
      }
    } catch (emailErr) {
      console.error('Welcome email delivery failed:', emailErr);
    }

    return new Response('User synced successfully', { status: 200 });
  }

  return new Response('', { status: 200 })
}
