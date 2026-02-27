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
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:40px 32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">HomeFolio</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Digital Property Portfolios for Real Estate</p>
      </div>
      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="color:#1e293b;margin:0 0 16px;font-size:24px;font-weight:600;">Welcome, ${fullName}!</h2>
        <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
          <strong>${teamLeaderName}</strong> has invited you to join their team on HomeFolio — the platform that helps real estate professionals create beautiful digital property portfolios and manage showings.
        </p>
        <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 32px;">
          Get started by setting up your password and completing your profile. It only takes a minute.
        </p>
        <!-- CTA Button -->
        <div style="text-align:center;margin:0 0 32px;">
          <a href="${welcomeUrl}" style="display:inline-block;background:#2563eb;color:white;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;letter-spacing:0.3px;">
            Get Started
          </a>
        </div>
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
      </div>
      <!-- Footer -->
      <div style="border-top:1px solid #e2e8f0;padding:24px 32px;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          &copy; ${new Date().getFullYear()} HomeFolio &middot; <a href="https://home-folio.net" style="color:#2563eb;text-decoration:none;">home-folio.net</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
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
            to: memberEmail,
            subject: `Welcome to HomeFolio, ${memberProfile.full_name || 'there'}!`,
            html: buildWelcomeEmailHtml(
              memberProfile.full_name || 'there',
              welcomeToken,
              teamLeaderName
            ),
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
