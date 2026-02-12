import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin emails - only these users can create other users
const ADMIN_EMAILS = ['angelo@houseforsaleabq.com'];

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

    // Check if requesting user is an admin
    if (!ADMIN_EMAILS.includes(requestingUser.email || '')) {
      console.log(`Unauthorized access attempt by: ${requestingUser.email}`);
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, fullName, company, phone, tier, trialDays } = await req.json();

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

    // Create/update profile in public_agent_profile with full information
    if (newUser.user) {
      const { error: profileError } = await supabaseAdmin
        .from('public_agent_profile')
        .upsert({
          user_id: newUser.user.id,
          full_name: fullName || email.split('@')[0],
          email: email,
          company: company || null,
          phone: phone || null,
          // Set default values for other required fields
          avatar_url: null,
          slogan: null,
          bio: null,
          license_number: null,
          brokerage_name: null,
          brokerage_address: null,
          brokerage_phone: null,
          brokerage_email: null,
          brokerage_logo_url: null,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Error creating/updating profile:', profileError);
        // Don't fail the whole operation if profile update fails
      }
    }

    // Generate welcome token for onboarding link
    let welcomeToken = null;
    if (newUser.user) {
      // Generate a random token
      const token = crypto.randomUUID();

      // Token expires in 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('welcome_tokens')
        .insert({
          user_id: newUser.user.id,
          token: token,
          email: email,
          full_name: fullName || null,
          company: company || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (!tokenError && tokenData) {
        welcomeToken = tokenData.token;
      } else {
        console.error('Error creating welcome token:', tokenError);
      }
    }

    // Create trial access for the user if tier and trialDays are provided
    if (newUser.user && tier && trialDays) {
      const userTier = tier || 'pro';
      const days = trialDays || 30;

      // First, create or get an admin beta code for this trial
      const adminCodeName = `ADMIN_${userTier.toUpperCase()}_${days}D`;

      let betaCodeId = null;

      // Try to find existing admin code
      const { data: existingCode } = await supabaseAdmin
        .from('beta_codes')
        .select('id')
        .eq('code', adminCodeName)
        .single();

      if (existingCode) {
        betaCodeId = existingCode.id;
      } else {
        // Create a new admin code
        const { data: newCode, error: codeError } = await supabaseAdmin
          .from('beta_codes')
          .insert({
            code: adminCodeName,
            trial_days: days,
            max_uses: 999999, // Unlimited uses for admin code
            times_used: 0,
          })
          .select('id')
          .single();

        if (newCode) {
          betaCodeId = newCode.id;
        } else {
          console.error('Error creating beta code:', codeError);
        }
      }

      // Create the beta redemption for the user
      if (betaCodeId) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + days);

        const { error: redemptionError } = await supabaseAdmin
          .from('beta_redemptions')
          .insert({
            user_id: newUser.user.id,
            beta_code_id: betaCodeId,
            trial_ends_at: trialEndsAt.toISOString(),
            tier: userTier,
          });

        if (redemptionError) {
          console.error('Error creating beta redemption:', redemptionError);
        } else {
          console.log(`Trial access granted: ${userTier} tier for ${days} days`);
        }
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
        welcomeToken: welcomeToken, // Include the welcome token in response
        tier: tier || 'starter',
        trialDays: trialDays || 0,
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
