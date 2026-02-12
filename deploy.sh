#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 1. Add all changes
echo "📝 Adding all changes to git..."
git add .

# 2. Commit changes
echo "💾 Creating commit..."
git commit -m "Complete Stripe integration with webhook handler

- Add Stripe webhook handler for subscription lifecycle events
- Handle checkout completion, subscription updates, and cancellations
- Auto-create teams for team/team5 tier subscribers
- Update subscription status in real-time via webhooks
- Sync payment failures and renewals to database

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 3. Push to GitHub (triggers Lovable auto-deploy)
echo "🌐 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Frontend deployed! (via Lovable auto-deploy)"
echo ""
echo "📋 Next: Deploy Edge Functions to Supabase"
echo ""
echo "Run these commands to deploy Edge Functions:"
echo "  export SUPABASE_ACCESS_TOKEN='your-token-here'"
echo ""
echo "Core functions:"
echo "  npx supabase functions deploy parse-mls-file"
echo "  npx supabase functions deploy optimize-route"
echo "  npx supabase functions deploy geocode-address"
echo "  npx supabase functions deploy generate-property-pdf"
echo "  npx supabase functions deploy generate-session-pdf"
echo "  npx supabase functions deploy ai-assistant"
echo "  npx supabase functions deploy elevenlabs-tts"
echo ""
echo "Stripe functions:"
echo "  npx supabase functions deploy create-checkout"
echo "  npx supabase functions deploy customer-portal"
echo "  npx supabase functions deploy check-subscription"
echo "  npx supabase functions deploy stripe-webhook"
echo ""
echo "Get your access token at: https://supabase.com/dashboard/account/tokens"
echo ""
echo "⚠️  IMPORTANT: Set these Stripe secrets in Supabase Dashboard:"
echo "  - STRIPE_SECRET_KEY (from Stripe Dashboard)"
echo "  - STRIPE_WEBHOOK_SECRET (from Stripe webhook endpoint)"

