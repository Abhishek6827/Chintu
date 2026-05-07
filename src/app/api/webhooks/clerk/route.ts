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
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || "Unknown User";

    // Safety Check: If no email is found, it might be a partial signup or a failed attempt
    if (!email) {
      console.warn(`[/api/webhooks/clerk] User ${id} created without an email address. Skipping sync to prevent ghost entries.`);
      return new Response('No email found, skipping sync', { status: 200 });
    }

    const now = new Date();
    const istOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    const istString = now.toLocaleString('en-IN', istOptions);

    // Extract provider safely
    const externalAccounts = (evt.data as any).external_accounts || [];
    const provider = externalAccounts[0]?.provider || 'email';
    const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');
    const displayTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).replace(':', '');
    const displayId = `CHINTU-${provider.toUpperCase()}-${dateStr}-${displayTimeStr}`;

    console.log(`[/api/webhooks/clerk] Syncing user ${id} with Display ID ${displayId}`);

    // Check if user already exists to prevent duplicate notifications (for sequential retries)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      console.log(`[/api/webhooks/clerk] User ${id} already exists. Skipping duplicate notifications.`);
      return new Response('User already exists, notifications skipped', { status: 200 });
    }

    // Use UPSERT to handle cases where the user record was partially created by other routes
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: id,
        email: email,
        display_id: displayId,
        credits: 10,
        plan: 'free',
        updated_at: now.toISOString()
      }, {
        onConflict: 'email'
      });

    if (error) {
      // 23505 is PostgreSQL unique violation code
      if (error.code === '23505') {
        console.log(`[/api/webhooks/clerk] User ${id} concurrently inserted. Skipping duplicate notifications.`);
        return new Response('User concurrently inserted, notifications skipped', { status: 200 });
      }
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
          `👤 <b>Name:</b> <code>${fullName}</code>\n` +
          `📧 <b>Email:</b> <code>${email}</code>\n` +
          `🆔 <b>Clerk ID:</b> <code>${id}</code>\n` +
          `🏷️ <b>Internal ID:</b> <code>${displayId}</code>\n` +
          `🛡️ <b>Auth Provider:</b> <code>${provider.toUpperCase()}</code>\n` +
          `🕒 <b>Time (IST):</b> <code>${istString}</code>\n\n` +
          `💰 <b>Onboarding Reward:</b> <code>10 Credits Provisioned</code>\n\n` +
          `📈 <i>Chintu Ji Ecosystem Growth +1</i>`;

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
          from: 'Chintu Ji <welcome@getchintu.com>', // Dedicated welcome address
          replyTo: 'contact@getchintu.com',
          to: email,
          subject: 'Welcome to Chintu Ji Ecosystem 🚀',
          html: getWelcomeEmailHtml(displayId, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
          text: `Welcome to Chintu Ji!\n\nYour strategic interview assistant is now active. We've provisioned your account with 10 Tactical Credits to jumpstart your career growth with high-precision intelligence.\n\nInternal ID: ${displayId}\n\nNext Steps for Success:\n1. Feed the Engine: Complete your profile with your resume and JD to enable high-context response synthesis.\n2. Activate Stealth: Launch the protected overlay interface during your live sessions for real-time tactical guidance.\n\nLaunch Protected Overlay Interface: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/room\n\nQuestions or issues? Contact our strategy team at contact@getchintu.com\n\nYou are receiving this email because you recently created an account at Chintu Ji.\nChintu Ji, 123 Tech Avenue, Innovation District, CA 94105\n\n© 2026 Chintu Ji Ecosystem • All Rights Reserved`
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

  // ─── Handle User Deleted ───────────────────────────────
  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    if (!id) {
      console.warn('[/api/webhooks/clerk] user.deleted event with no ID. Skipping.');
      return new Response('No user ID', { status: 200 });
    }

    console.log(`[/api/webhooks/clerk] Deleting user ${id} from Supabase...`);

    // Fetch profile before deleting (to check if it exists and get info for alert)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_id, plan')
      .eq('id', id) // Clerk still provides id here, but we should also check email if possible. 
      .maybeSingle();

    if (!profile) {
      console.log(`[/api/webhooks/clerk] User ${id} not found in Supabase. Likely already deleted or never synced. skipping alert.`);
      return new Response('User not found, skipping', { status: 200 });
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[/api/webhooks/clerk] Error deleting user from Supabase:', error.message);
      return new Response('Error deleting user', { status: 500 });
    }

    // Send Telegram Alert (Only if profile existed)
    try {
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChatId = process.env.TELEGRAM_CHAT_ID;

      if (tgToken && tgChatId) {
        const now = new Date();
        const istOptions: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        };
        const istString = now.toLocaleString('en-IN', istOptions);

        const message =
          `🗑️ <b>USER DELETED</b>\n\n` +
          `👤 <b>Clerk ID:</b> <code>${id}</code>\n` +
          `📧 <b>Email:</b> <code>${profile.email}</code>\n` +
          `🏷️ <b>Display ID:</b> <code>${profile.display_id}</code>\n` +
          `💎 <b>Plan was:</b> <code>${profile.plan?.toUpperCase()}</code>\n` +
          `🕒 <b>Time (IST):</b> <code>${istString}</code>\n` +
          `\n⚠️ <i>Profile removed from Supabase</i>`;

        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: message,
            parse_mode: 'HTML'
          }),
        });
      }
    } catch (tgErr) {
      console.error('[/api/webhooks/clerk] Telegram notification failed:', tgErr);
    }

    return new Response('User deleted successfully', { status: 200 });
  }

  return new Response('', { status: 200 })
}
