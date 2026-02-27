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
    const { phone, code, userId } = await req.json();

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Phone and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      console.error('Twilio Verify environment variables not configured');
      return new Response(JSON.stringify({ error: 'Verification service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check verification via Twilio Verify API
    const checkUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        Code: code.trim(),
      }).toString(),
    });

    const result = await twilioResponse.json();

    if (!twilioResponse.ok || result.status !== 'approved') {
      console.log(`Verification failed for ${phone}, status: ${result.status}`);

      if (result.status === 'pending') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid verification code. Please try again.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: result.message || 'Verification failed. Please request a new code.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verification approved — update profile and auto-confirm email
    if (userId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          phone: phone,
          phone_verified: true,
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating profile phone:', profileError);
      }

      // Auto-confirm the user's email since phone is verified
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('Error auto-confirming email:', confirmError);
      } else {
        console.log(`Email auto-confirmed for user ${userId}`);
      }
    }

    console.log(`Phone ${phone} verified successfully`);

    return new Response(JSON.stringify({ success: true, verified: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('verify-phone-otp error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
