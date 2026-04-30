import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const externalAccounts = (evt.data as any).external_accounts || [];
    const provider = externalAccounts[0]?.provider || 'email';
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
          from: 'Chintu Intelligence <onboarding@resend.dev>', // Replace with your domain once verified
          to: email,
          subject: 'Welcome to Chintu Intelligence Ecosystem 🚀',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0c; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #333;">
              <h1 style="font-size: 24px; font-weight: 900; color: #6366f1; margin-bottom: 24px;">MISSION BRIEFING: SUCCESS</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">Welcome to the ecosystem. Your account (ID: <strong>${displayId}</strong>) is now active and provisioned with <strong>10 Tactical Credits</strong>.</p>
              
              <div style="background: #1a1a1c; padding: 20px; border-radius: 16px; margin: 30px 0; border: 1px solid #333;">
                <h2 style="font-size: 14px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px;">Quick Start Guide:</h2>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #9ca3af;">
                  <li style="margin-bottom: 10px;">⚡ <strong>Step 1:</strong> Complete your Profile with your Resume.</li>
                  <li style="margin-bottom: 10px;">⚡ <strong>Step 2:</strong> Hold SPACE to capture live audio during interviews.</li>
                  <li style="margin-bottom: 10px;">⚡ <strong>Step 3:</strong> Use Screenshots for technical coding rounds.</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #9ca3af; margin-bottom: 30px;">Chintu lives discreetly on your screen, providing real-time strategic guidance without being detected.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 0.2em;">Launch Your First Mission</a>
              
              <hr style="border: 0; border-top: 1px solid #333; margin: 40px 0;">
              <p style="font-size: 10px; color: #4b5563; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 Chintu AI Ecosystem • Stealth Mode Active</p>
            </div>
          `
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
