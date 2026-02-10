#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 1. Add all changes
echo "📝 Adding all changes to git..."
git add .

# 2. Commit changes
echo "💾 Creating commit..."
git commit -m "Add security improvements and UI enhancements

- Add rate limiting to all Edge Functions (parse-mls-file, optimize-route, geocode-address, generate-property-pdf, generate-session-pdf)
- Add server-side file type validation with magic bytes
- Add CORS configuration utility
- Improve mobile UX on AgentProfileCard
- Enhance QR code quality and customization

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
echo "  npx supabase functions deploy parse-mls-file"
echo "  npx supabase functions deploy optimize-route"
echo "  npx supabase functions deploy geocode-address"
echo "  npx supabase functions deploy generate-property-pdf"
echo "  npx supabase functions deploy generate-session-pdf"
echo ""
echo "Get your access token at: https://supabase.com/dashboard/account/tokens"

