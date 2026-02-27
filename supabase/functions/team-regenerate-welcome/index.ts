import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildWelcomeEmailHtml(fullName: string, welcomeToken: string, teamLeaderName: string): string {
  const welcomeUrl = `https://home-folio.net/welcome/${welcomeToken}`;
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
  <div style="display:none;max-height:0;overflow:hidden;">${teamLeaderName} has invited you to join their team on HomeFolio. Set up your account now.</div>
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
              <h1 style="color:#1e293b;margin:0 0 16px;font-size:24px;font-weight:600;">Welcome, ${fullName}!</h1>
              <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                <strong>${teamLeaderName}</strong> has invited you to join their team on HomeFolio &#8212; the platform that helps real estate professionals create beautiful digital property portfolios and manage showings.
              </p>
              <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 32px;">
                Get started by setting up your password and completing your profile. It only takes a minute.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${welcomeUrl}" style="display:inline-block;background:#2563eb;color:white;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;letter-spacing:0.3px;mso-padding-alt:0;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
              <!-- What you can do -->
              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;">
                <p style="color:#1e293b;font-weight:600;margin:0 0 12px;font-size:15px;">With HomeFolio you can:</p>
                <ul style="color:#475569;font-size:14px;line-height:2;margin:0;padding-left:20px;">
                  <li>Create stunning digital property portfolios</li>
                  <li>Organize and share showing sessions with clients</li>
                  <li>Optimize your showing routes</li>
                  <li>Collect client feedback and ratings</li>
                </ul>
              </div>
              <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
                This link expires in 7 days. If you need a new one, ask your team leader to resend it.
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

function buildWelcomeEmailText(fullName: string, welcomeToken: string, teamLeaderName: string): string {
  const welcomeUrl = `https://home-folio.net/welcome/${welcomeToken}`;
  return `Welcome to HomeFolio, ${fullName}!

${teamLeaderName} has invited you to join their team on HomeFolio - the platform that helps real estate professionals create beautiful digital property portfolios and manage showings.

Get started by setting up your password and completing your profile:
${welcomeUrl}

With HomeFolio you can:
- Create stunning digital property portfolios
- Organize and share showing sessions with clients
- Optimize your showing routes
- Collect client feedback and ratings

This link expires in 7 days. If you need a new one, ask your team leader to resend it.

---
HomeFolio | home-folio.net
Albuquerque, NM`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { memberEmail } = await req.json();

    if (!memberEmail) {
      return new Response(JSON.stringify({ error: 'Member email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify requesting user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify requesting user owns a team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('owner_id', requestingUser.id)
      .single();

    if (teamError || !team) {
      return new Response(JSON.stringify({ error: 'No team found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the member by email and verify they belong to this team
    const { data: memberProfile, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, email')
      .eq('email', memberEmail)
      .eq('team_id', team.id)
      .single();

    if (memberError || !memberProfile) {
      return new Response(JSON.stringify({ error: 'Team member not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get leader's name
    const { data: leaderProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', requestingUser.id)
      .single();

    const teamLeaderName = leaderProfile?.full_name || 'Your team leader';

    // Delete any existing welcome tokens for this user
    await supabaseAdmin
      .from('welcome_tokens')
      .delete()
      .eq('user_id', memberProfile.user_id);

    // Create new welcome token
    const welcomeToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: tokenError } = await supabaseAdmin
      .from('welcome_tokens')
      .insert({
        user_id: memberProfile.user_id,
        token: welcomeToken,
        email: memberEmail,
        full_name: memberProfile.full_name,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creating welcome token:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to create welcome token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send welcome email via Resend
    let emailSent = false;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'HomeFolio <contact@home-folio.net>',
            reply_to: 'contact@home-folio.net',
            to: memberEmail,
            subject: `Welcome to HomeFolio, ${memberProfile.full_name || 'there'}!`,
            html: buildWelcomeEmailHtml(
              memberProfile.full_name || 'there',
              welcomeToken,
              teamLeaderName
            ),
            text: buildWelcomeEmailText(
              memberProfile.full_name || 'there',
              welcomeToken,
              teamLeaderName
            ),
            headers: {
              'X-Entity-Ref-ID': crypto.randomUUID(),
            },
          }),
        });

        if (resendResponse.ok) {
          emailSent = true;
          console.log(`Welcome email resent to ${memberEmail}`);
        } else {
          const errorData = await resendResponse.text();
          console.error('Resend API error:', resendResponse.status, errorData);
        }
      } catch (emailErr) {
        console.error('Error sending welcome email:', emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        welcomeToken,
        emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('team-regenerate-welcome error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
