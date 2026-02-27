import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildSubscriberWelcomeHtml(firstName: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to HomeFolio</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;">Welcome to HomeFolio! Set up your portal and start creating beautiful property showings.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px;text-align:left;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:left;">
                    <a href="https://home-folio.net" style="text-decoration:none;">
                      <img src="https://home-folio.net/logo.png" alt="HomeFolio" width="96" height="96" style="display:inline-block;vertical-align:middle;border:0;border-radius:12px;margin-right:14px;" />
                      <span style="color:white;font-size:24px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">HomeFolio</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="color:#1e293b;margin:0 0 20px;font-size:24px;font-weight:600;">Dear ${firstName},</h1>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                Thank you and congratulations on choosing to use HomeFolio!
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                By joining HomeFolio, you're taking a meaningful step toward elevating the way your clients experience home tours and property showings. You're creating a smoother, more organized, and more modern experience that keeps everything in one simple, living link.
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                You're also helping reduce paper waste by moving away from printed documents and scattered files &#8212; a small change that makes a big impact for both your business and the environment.
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px;">
                HomeFolio was built to help real estate professionals stay organized, stand out, and deliver a higher level of service to their clients. We're excited to have you as part of the community.
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 28px;">
                If you ever have questions, feedback, or ideas, we'd love to hear from you. We're here to help you get the most out of HomeFolio.
              </p>
              <p style="color:#1e293b;font-size:16px;line-height:1.7;margin:0 0 4px;font-weight:600;">
                Welcome aboard,
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 0;">
                The HomeFolio Team
              </p>
            </td>
          </tr>
          <!-- Tagline Banner -->
          <tr>
            <td style="background:#f1f5f9;padding:28px 32px;text-align:center;">
              <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 12px;letter-spacing:0.5px;">
                YOUR SHOWINGS SIMPLIFIED &amp; ORGANIZED
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:4px 0;">
                    <a href="https://home-folio.net" style="color:#2563eb;text-decoration:none;font-size:14px;">www.home-folio.net</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <a href="mailto:contact@home-folio.net" style="color:#2563eb;text-decoration:none;font-size:14px;">contact@home-folio.net</a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;font-style:italic;margin:12px 0 0;">
                One Link. All the Docs. Zero Paper.
              </p>
            </td>
          </tr>
          <!-- Impress line -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:16px 32px;text-align:center;">
              <p style="color:white;font-size:15px;font-weight:600;margin:0;letter-spacing:0.3px;">
                Impress your clients with HomeFolio
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding:24px 32px;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">
                &copy; ${new Date().getFullYear()} HomeFolio &middot; <a href="https://home-folio.net" style="color:#2563eb;text-decoration:none;">home-folio.net</a>
              </p>
              <p style="color:#b0b8c4;font-size:11px;margin:0;">
                HomeFolio &middot; Albuquerque, NM &middot; <a href="https://home-folio.net/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSubscriberWelcomeText(firstName: string): string {
  return `Dear ${firstName},

Thank you and congratulations on choosing to use HomeFolio!

By joining HomeFolio, you're taking a meaningful step toward elevating the way your clients experience home tours and property showings. You're creating a smoother, more organized, and more modern experience that keeps everything in one simple, living link.

You're also helping reduce paper waste by moving away from printed documents and scattered files - a small change that makes a big impact for both your business and the environment.

HomeFolio was built to help real estate professionals stay organized, stand out, and deliver a higher level of service to their clients. We're excited to have you as part of the community.

If you ever have questions, feedback, or ideas, we'd love to hear from you. We're here to help you get the most out of HomeFolio.

Welcome aboard,
The HomeFolio Team

---
YOUR SHOWINGS SIMPLIFIED & ORGANIZED
www.home-folio.net
contact@home-folio.net
One Link. All the Docs. Zero Paper.

Impress your clients with HomeFolio`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const firstName = (fullName || '').split(' ')[0] || 'there';

    // Send admin notification email
    const adminPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HomeFolio <noreply@home-folio.net>',
        to: 'contact@home-folio.net',
        subject: `New HomeFolio Signup: ${fullName || email}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New User Signup</h2>
            <p><strong>Name:</strong> ${fullName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">This is an automated notification from HomeFolio.</p>
          </div>
        `,
      }),
    });

    // Send welcome email to the new subscriber
    const welcomePromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HomeFolio <contact@home-folio.net>',
        reply_to: 'contact@home-folio.net',
        to: email,
        subject: `Welcome to HomeFolio, ${firstName}!`,
        html: buildSubscriberWelcomeHtml(firstName),
        text: buildSubscriberWelcomeText(firstName),
        headers: {
          'X-Entity-Ref-ID': crypto.randomUUID(),
        },
      }),
    });

    // Send both emails in parallel
    const [adminResponse, welcomeResponse] = await Promise.all([adminPromise, welcomePromise]);

    if (!adminResponse.ok) {
      const errorData = await adminResponse.text();
      console.error('Admin notification error:', adminResponse.status, errorData);
    }

    if (!welcomeResponse.ok) {
      const errorData = await welcomeResponse.text();
      console.error('Welcome email error:', welcomeResponse.status, errorData);
    } else {
      console.log(`Welcome email sent to ${email}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-signup error:', error);
    // Don't fail signup flow if notification fails
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
