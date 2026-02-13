import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Helper function to ensure team exists for team/team5 users
const ensureTeamExists = async (
  supabaseClient: any,
  userId: string,
  tier: string
) => {
  if (tier !== 'team' && tier !== 'team5') {
    return; // Only create teams for team/team5 tiers
  }

  try {
    // Check if user already has a team
    const { data: existingTeam } = await supabaseClient
      .from('teams')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existingTeam) {
      logStep('Team already exists', { teamId: existingTeam.id });
      return; // Team already exists
    }

    // Create team for this user
    const maxMembers = tier === 'team5' ? 5 : 10;
    logStep('Creating new team', { tier, maxMembers });

    const { data: newTeam, error: teamError } = await supabaseClient
      .from('teams')
      .insert({
        owner_id: userId,
        max_members: maxMembers,
      })
      .select('id')
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return;
    }

    logStep('Team created successfully', { teamId: newTeam.id });

    // Update user's profile to link to their team and set role
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        team_id: newTeam.id,
        role: 'team_leader'
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile with team:', profileError);
    } else {
      logStep('Profile updated with team', { teamId: newTeam.id, role: 'team_leader' });
    }
  } catch (error) {
    console.error('Error in ensureTeamExists:', error);
  }
};

// Price IDs mapped to tiers
const PRICE_TO_TIER: Record<string, string> = {
  "price_1SypiGGny8WPy9rqHPf37JT8": "pro",    // Pro Monthly
  "price_1SypiZGny8WPy9rqwlNEXlso": "pro",    // Pro Yearly
  "price_1SzntmGny8WPy9rqZ2isM8rG": "team5",  // Team5 Monthly
  "price_1SznrEGny8WPy9rqaQ69H1Ki": "team5",  // Team5 Yearly
  "price_1SypipGny8WPy9rqbWEZZuKU": "team",   // Team Monthly
  "price_1Sypj4Gny8WPy9rqW7raQeaH": "team",   // Team Yearly
  "price_ASSISTANT_MONTHLY": "assistant",       // Assistant Monthly (TODO: Replace with real Stripe price ID)
  "price_ASSISTANT_YEARLY": "assistant",        // Assistant Yearly (TODO: Replace with real Stripe price ID)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // 0. Test override: grant assistant tier to specific accounts for testing
    const TIER_OVERRIDES: Record<string, string> = {
      "contact@home-folio.net": "assistant",
    };
    if (TIER_OVERRIDES[user.email]) {
      const overrideTier = TIER_OVERRIDES[user.email];
      logStep("Tier override applied", { email: user.email, tier: overrideTier });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: overrideTier,
        subscription_end: null,
        is_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Check for active beta trial first
    const { data: trialData, error: trialError } = await supabaseClient
      .from("beta_redemptions")
      .select("tier, trial_ends_at")
      .eq("user_id", user.id)
      .gt("trial_ends_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (!trialError && trialData) {
      logStep("Active beta trial found", { tier: trialData.tier, trialEndsAt: trialData.trial_ends_at });

      // Ensure team exists for team/team5 trial users
      await ensureTeamExists(supabaseClient, user.id, trialData.tier);

      return new Response(JSON.stringify({
        subscribed: true,
        tier: trialData.tier,
        subscription_end: trialData.trial_ends_at,
        is_trial: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning starter tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: "starter",
        subscription_end: null,
        is_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = "starter";
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });

      const priceId = subscription.items.data[0].price.id;
      tier = PRICE_TO_TIER[priceId] || "pro";
      logStep("Determined subscription tier", { priceId, tier });

      // Ensure team exists for team/team5 Stripe subscribers
      await ensureTeamExists(supabaseClient, user.id, tier);
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
      is_trial: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
