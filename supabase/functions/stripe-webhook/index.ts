import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

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
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header found");

    const body = await req.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });

        // Get subscription details
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          const tier = PRICE_TO_TIER[priceId] || "starter";
          const userId = session.metadata?.userId;

          logStep("Processing new subscription", {
            subscriptionId: subscription.id,
            priceId,
            tier,
            userId
          });

          if (userId) {
            // Update user's subscription in profiles table
            const { error: updateError } = await supabaseClient
              .from("profiles")
              .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_tier: tier,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("user_id", userId);

            if (updateError) {
              logStep("Error updating profile", { error: updateError.message });
            } else {
              logStep("Profile updated successfully", { userId, tier });

              // Auto-create team if tier is team or team5
              if (tier === "team" || tier === "team5") {
                const { data: existingTeam } = await supabaseClient
                  .from("teams")
                  .select("id")
                  .eq("owner_id", userId)
                  .single();

                if (!existingTeam) {
                  const maxMembers = tier === "team5" ? 5 : 10;
                  const { data: newTeam, error: teamError } = await supabaseClient
                    .from("teams")
                    .insert({
                      owner_id: userId,
                      max_members: maxMembers,
                    })
                    .select()
                    .single();

                  if (teamError) {
                    logStep("Error creating team", { error: teamError.message });
                  } else {
                    logStep("Team created", { teamId: newTeam.id, maxMembers });

                    // Update user's profile with team_id and role
                    await supabaseClient
                      .from("profiles")
                      .update({
                        team_id: newTeam.id,
                        role: "team_leader",
                      })
                      .eq("user_id", userId);
                  }
                }
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || "starter";

        logStep("Subscription updated", {
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          tier
        });

        // Find user by subscription ID
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (profile) {
          const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_tier: tier,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("user_id", profile.user_id);

          if (updateError) {
            logStep("Error updating subscription status", { error: updateError.message });
          } else {
            logStep("Subscription status updated", { userId: profile.user_id, status: subscription.status });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Find user by subscription ID
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (profile) {
          const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              subscription_status: "canceled",
              subscription_tier: "starter",
              current_period_end: null,
            })
            .eq("user_id", profile.user_id);

          if (updateError) {
            logStep("Error updating canceled subscription", { error: updateError.message });
          } else {
            logStep("Subscription canceled", { userId: profile.user_id });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription
        });

        // Find user by subscription ID
        if (invoice.subscription) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("user_id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .single();

          if (profile) {
            const { error: updateError } = await supabaseClient
              .from("profiles")
              .update({
                subscription_status: "past_due",
              })
              .eq("user_id", profile.user_id);

            if (updateError) {
              logStep("Error updating payment failure status", { error: updateError.message });
            } else {
              logStep("Marked subscription as past_due", { userId: profile.user_id });
            }
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
