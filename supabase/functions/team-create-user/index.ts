import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check team capacity using the helper function
    const { data: canAdd, error: capacityError } = await supabaseAdmin
      .rpc('can_add_team_member', { team_id: team.id });

    if (capacityError) {
      console.error('Error checking team capacity:', capacityError);
      return new Response(JSON.stringify({ error: 'Failed to check team capacity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!canAdd) {
      return new Response(JSON.stringify({ error: `Team is at capacity (${team.max_members} members max)` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get team leader's subscription tier
    const { data: leaderRedemption } = await supabaseAdmin
      .from('beta_redemptions')
      .select('tier, trial_ends_at')
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
        role: 'team_member',
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

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          email: email,
          fullName: fullName,
        },
        welcomeToken: tokenError ? undefined : welcomeToken,
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
