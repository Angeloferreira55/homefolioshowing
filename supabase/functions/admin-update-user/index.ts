import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin emails - only these users can update other users
const ADMIN_EMAILS = ['angelo@houseforsaleabq.com', 'contact@home-folio.net'];

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
      console.log(`Unauthorized update attempt by: ${requestingUser.email}`);
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, fullName, company, phone, tier, trialDays } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the user by email
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      console.error('Error searching for user:', searchError);
      return new Response(JSON.stringify({ error: 'Failed to find user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUser = existingUsers.users.find(u => u.email === email);

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user metadata if fullName provided
    if (fullName) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        {
          user_metadata: {
            full_name: fullName,
          },
        }
      );

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }
    }

    // Update profile in public_agent_profile
    const profileUpdate: Record<string, any> = {};
    if (fullName !== undefined) profileUpdate.full_name = fullName;
    if (company !== undefined) profileUpdate.company = company;
    if (phone !== undefined) profileUpdate.phone = phone;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('public_agent_profile')
        .update(profileUpdate)
        .eq('user_id', targetUser.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update trial access if tier or trialDays provided
    if (tier !== undefined || trialDays !== undefined) {
      // First, check if user has an existing trial
      const { data: existingTrial } = await supabaseAdmin
        .from('beta_redemptions')
        .select('*')
        .eq('user_id', targetUser.id)
        .single();

      if (existingTrial && (tier !== undefined || trialDays !== undefined)) {
        // Update existing trial
        const updateData: Record<string, any> = {};

        if (tier !== undefined) {
          updateData.tier = tier;
        }

        if (trialDays !== undefined) {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
          updateData.trial_ends_at = trialEndsAt.toISOString();
        }

        if (Object.keys(updateData).length > 0) {
          const { error: redemptionError } = await supabaseAdmin
            .from('beta_redemptions')
            .update(updateData)
            .eq('user_id', targetUser.id);

          if (redemptionError) {
            console.error('Error updating trial:', redemptionError);
          } else {
            console.log(`Trial updated for ${email}`);
          }
        }
      } else if (tier !== undefined && trialDays !== undefined) {
        // Create new trial if it doesn't exist
        const userTier = tier || 'pro';
        const days = trialDays || 30;

        // Get or create admin beta code
        const adminCodeName = `ADMIN_${userTier.toUpperCase()}_${days}D`;
        let betaCodeId = null;

        const { data: existingCode } = await supabaseAdmin
          .from('beta_codes')
          .select('id')
          .eq('code', adminCodeName)
          .single();

        if (existingCode) {
          betaCodeId = existingCode.id;
        } else {
          const { data: newCode } = await supabaseAdmin
            .from('beta_codes')
            .insert({
              code: adminCodeName,
              trial_days: days,
              max_uses: 999999,
              times_used: 0,
            })
            .select('id')
            .single();

          if (newCode) {
            betaCodeId = newCode.id;
          }
        }

        if (betaCodeId) {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + days);

          const { error: redemptionError } = await supabaseAdmin
            .from('beta_redemptions')
            .insert({
              user_id: targetUser.id,
              beta_code_id: betaCodeId,
              trial_ends_at: trialEndsAt.toISOString(),
              tier: userTier,
            });

          if (redemptionError) {
            console.error('Error creating trial:', redemptionError);
          } else {
            console.log(`Trial created for ${email}: ${userTier} tier for ${days} days`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          email: email,
          fullName: fullName,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('admin-update-user error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
