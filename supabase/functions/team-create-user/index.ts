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
                      <img src="https://home-folio.net/logo.png" alt="HomeFolio" width="48" height="48" style="display:inline-block;vertical-align:middle;border:0;border-radius:8px;margin-right:12px;" />
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
    const { email, password, fullName, company, phone } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'Email, password, and full name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the team owned by this user
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, max_members')
      .eq('owner_id', requestingUser.id)
      .single();

    if (teamError || !team) {
      return new Response(JSON.stringify({ error: 'No team found. You must have an active Team subscription.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check team capacity directly
    const { count: memberCount, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id);

    if (countError) {
      console.error('Error checking team capacity:', countError);
      return new Response(JSON.stringify({ error: 'Failed to check team capacity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((memberCount || 0) >= team.max_members) {
      return new Response(JSON.stringify({ error: `Team is at capacity (${team.max_members} members max)` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get team leader's profile for name
    const { data: leaderProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', requestingUser.id)
      .single();

    const teamLeaderName = leaderProfile?.full_name || 'Your team leader';

    // Get team leader's subscription tier
    const { data: leaderRedemption } = await supabaseAdmin
      .from('beta_redemptions')
      .select('tier, trial_ends_at, beta_code_id')
      .eq('user_id', requestingUser.id)
      .single();

    const tier = leaderRedemption?.tier || 'pro';
    const trialEndsAt = leaderRedemption?.trial_ends_at;

    // Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: `Failed to create user: ${createError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User created: ${email} (${newUser.user.id})`);

    // Update the profile with team information
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        company: company || null,
        phone: phone || null,
        team_id: team.id,
        role: 'member',
      })
      .eq('user_id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Create beta redemption for team member (inherit from leader)
    if (leaderRedemption && trialEndsAt) {
      const { error: redemptionError } = await supabaseAdmin
        .from('beta_redemptions')
        .insert({
          user_id: newUser.user.id,
          beta_code_id: leaderRedemption.beta_code_id || null,
          trial_ends_at: trialEndsAt,
          tier: tier,
        });

      if (redemptionError) {
        console.error('Error creating beta redemption for team member:', redemptionError);
      }
    }

    // Generate welcome token
    const welcomeToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    const { error: tokenError } = await supabaseAdmin
      .from('welcome_tokens')
      .insert({
        user_id: newUser.user.id,
        token: welcomeToken,
        email: email,
        full_name: fullName,
        company: company || null,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creating welcome token:', tokenError);
    }

    // Send welcome email via Resend
    let emailSent = false;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY && !tokenError) {
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
            to: email,
            subject: `Welcome to HomeFolio, ${fullName}!`,
            html: buildWelcomeEmailHtml(fullName, welcomeToken, teamLeaderName),
            text: buildWelcomeEmailText(fullName, welcomeToken, teamLeaderName),
            headers: {
              'X-Entity-Ref-ID': crypto.randomUUID(),
            },
          }),
        });

        if (resendResponse.ok) {
          emailSent = true;
          console.log(`Welcome email sent to ${email}`);
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
        user: {
          email: email,
          fullName: fullName,
        },
        welcomeToken: tokenError ? undefined : welcomeToken,
        emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('team-create-user error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
