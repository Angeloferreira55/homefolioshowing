# Stripe Integration Setup Guide

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Supabase project with Edge Functions enabled
3. Access to Supabase Dashboard

## Step 1: Get Your Stripe API Keys

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
3. Save this key - you'll need it in Step 3

## Step 2: Deploy the Webhook Function

First, deploy the `stripe-webhook` Edge Function to Supabase:

```bash
export SUPABASE_ACCESS_TOKEN='your-supabase-token'
npx supabase functions deploy stripe-webhook
```

After deployment, note the function URL. It will look like:
```
https://[your-project-id].supabase.co/functions/v1/stripe-webhook
```

## Step 3: Configure Webhook in Stripe

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL: `https://[your-project-id].supabase.co/functions/v1/stripe-webhook`
4. Click **"Select events"** and choose these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. On the webhook details page, click **"Reveal signing secret"**
7. Copy the signing secret (starts with `whsec_`)

## Step 4: Add Secrets to Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add these secrets:

```
STRIPE_SECRET_KEY=sk_test_xxxxx (or sk_live_xxxxx for production)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Step 5: Redeploy Functions

After adding the secrets, redeploy your Stripe-related functions:

```bash
npx supabase functions deploy create-checkout
npx supabase functions deploy customer-portal
npx supabase functions deploy check-subscription
npx supabase functions deploy stripe-webhook
```

## Step 6: Test the Integration

### Test Checkout Flow

1. Go to your pricing page
2. Click on a subscription plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete the checkout
5. Verify in Supabase that your `profiles` table updated with:
   - `stripe_customer_id`
   - `stripe_subscription_id`
   - `subscription_status`: `active`
   - `subscription_tier`: `pro`, `team`, or `team5`

### Test Webhook Events

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Send test events: `checkout.session.completed`, `customer.subscription.updated`
5. Check the logs in Supabase Edge Functions to verify webhook processing

### Test Customer Portal

1. After creating a subscription, go to your dashboard
2. Click "Manage Subscription" or billing settings
3. Verify the Stripe customer portal opens
4. Test canceling/updating subscription
5. Verify webhook updates the database

## Subscription Tiers & Pricing

Current price IDs configured in `check-subscription` and `stripe-webhook`:

| Plan | Period | Price ID | Tier Code |
|------|--------|----------|-----------|
| Pro | Monthly | `price_1SypiGGny8WPy9rqHPf37JT8` | `pro` |
| Pro | Yearly | `price_1SypiZGny8WPy9rqwlNEXlso` | `pro` |
| Team5 | Monthly | `price_1SzntmGny8WPy9rqZ2isM8rG` | `team5` |
| Team5 | Yearly | `price_1SznrEGny8WPy9rqaQ69H1Ki` | `team5` |
| Team | Monthly | `price_1SypipGny8WPy9rqbWEZZuKU` | `team` |
| Team | Yearly | `price_1Sypj4Gny8WPy9rqW7raQeaH` | `team` |

**Important**: If you create new products/prices in Stripe, update the `PRICE_TO_TIER` mapping in:
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

## Team Auto-Creation

When a user subscribes to a `team` or `team5` plan, the webhook automatically:
1. Creates a new team in the `teams` table
2. Sets `max_members` to 5 (for team5) or 50 (for team)
3. Updates the user's profile with `team_id` and `role: 'team_leader'`

## Troubleshooting

### Webhook not receiving events

1. Check that STRIPE_WEBHOOK_SECRET is set in Supabase
2. Verify webhook URL is correct in Stripe dashboard
3. Check Edge Function logs in Supabase for errors
4. Ensure all required events are selected in Stripe webhook configuration

### Subscription not updating in database

1. Check Edge Function logs for errors
2. Verify `profiles` table has all required columns:
   - `stripe_customer_id`
   - `stripe_subscription_id`
   - `subscription_status`
   - `subscription_tier`
   - `current_period_end`
   - `trial_end`
3. Check that price IDs match between Stripe and your code

### Customer portal not working

1. Verify customer has a Stripe customer ID
2. Check that customer has an active subscription
3. Verify STRIPE_SECRET_KEY is set correctly

## Going Live

When ready for production:

1. Switch Stripe to live mode
2. Create new products/prices in live mode
3. Update PRICE_TO_TIER mapping with live price IDs
4. Replace `sk_test_` key with `sk_live_` key in Supabase secrets
5. Create new webhook endpoint using live mode URL
6. Update STRIPE_WEBHOOK_SECRET with live webhook secret
7. Test thoroughly with real (small amount) transactions

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For Supabase Edge Functions:
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
