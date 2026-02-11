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
    // Get the requesting user to verify they're authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client with service role key (bypasses RLS)
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

    // Fetch all users from profiles table using service role (bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(JSON.stringify({ error: profilesError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all welcome tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('welcome_tokens')
      .select('user_id, token, created_at')
      .order('created_at', { ascending: false });

    if (tokensError && !tokensError.message?.includes('does not exist')) {
      console.error('Error fetching welcome tokens:', tokensError);
    }

    // Create a map of user_id to latest token
    const tokenMap = new Map<string, string>();
    if (tokens && tokens.length > 0) {
      tokens.forEach(token => {
        const existing = tokenMap.get(token.user_id);
        if (!existing) {
          tokenMap.set(token.user_id, token.token);
        }
      });
    }

    // Combine profiles with tokens
    const allUsers = (profiles || []).map(profile => ({
      email: profile.email || '',
      fullName: profile.full_name || profile.email || '',
      timestamp: 'Account created',
      welcomeToken: tokenMap.get(profile.user_id) || undefined,
    }));

    console.log('Admin list users - Found:', allUsers.length);
    console.log('Emails:', allUsers.map(u => u.email).join(', '));

    return new Response(
      JSON.stringify({
        success: true,
        users: allUsers,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('admin-list-users error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
