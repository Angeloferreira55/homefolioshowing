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

    // Create admin client with service role key
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

    // Get requesting user's profile to check role and team
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, team_id')
      .eq('user_id', requestingUser.id)
      .single();

    if (profileError || !requesterProfile) {
      return new Response(JSON.stringify({ error: 'Could not verify user permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission (admin or team_leader)
    const isAdmin = requesterProfile.role === 'admin';
    const isTeamLeader = requesterProfile.role === 'team_leader';

    if (!isAdmin && !isTeamLeader) {
      return new Response(JSON.stringify({ error: 'You do not have permission to create users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For team leaders, check if they can add more members
    if (isTeamLeader && requesterProfile.team_id) {
      const { data: canAdd, error: limitError } = await supabaseAdmin
        .rpc('can_add_team_member', { p_team_id: requesterProfile.team_id });

      if (limitError || !canAdd) {
        return new Response(JSON.stringify({ error: 'Team member limit reached (maximum 10 members)' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { email, password, fullName, company, phone } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: fullName || email,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profile with additional info and team assignment
    if (newUser.user) {
      const profileUpdate: any = {
        company: company || null,
        phone: phone || null,
        role: 'member', // New users are always members
      };

      // Assign to team if team leader is creating the user
      if (isTeamLeader && requesterProfile.team_id) {
        profileUpdate.team_id = requesterProfile.team_id;
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', newUser.user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        // Don't fail the whole operation if profile update fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
          fullName: fullName || email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('admin-create-user error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
