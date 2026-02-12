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

    // Get all profiles in this team
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, email, company, phone, created_at')
      .eq('team_id', team.id)
      .neq('role', 'team_leader'); // Exclude the team leader themselves

    if (profilesError) {
      console.error('Error fetching team profiles:', profilesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch team members' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get welcome tokens for team members
    const { data: welcomeTokens } = await supabaseAdmin
      .from('welcome_tokens')
      .select('user_id, token')
      .in('user_id', profiles?.map(p => p.user_id) || []);

    // Map welcome tokens to user IDs
    const tokenMap = new Map(welcomeTokens?.map(t => [t.user_id, t.token]) || []);

    // Format the response
    const members = profiles?.map(profile => ({
      email: profile.email,
      fullName: profile.full_name,
      company: profile.company,
      phone: profile.phone,
      timestamp: new Date(profile.created_at).toLocaleString(),
      welcomeToken: tokenMap.get(profile.user_id),
    })) || [];

    // Get actual member count including the team leader
    const { count: memberCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id);

    return new Response(
      JSON.stringify({
        success: true,
        members,
        memberCount: memberCount || 0,
        maxMembers: team.max_members,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('team-list-users error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
