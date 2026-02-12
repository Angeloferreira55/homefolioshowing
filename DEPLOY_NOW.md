# 🚀 Deploy for Beta Testing - Quick Start

## ✅ Frontend Deployed
Your frontend is automatically deploying to Lovable now. Check the Lovable dashboard for deployment status.

## 📋 Next: Deploy Edge Functions to Supabase

### 1. Get Your Supabase Access Token
Go to: https://supabase.com/dashboard/account/tokens

### 2. Set the Token
```bash
export SUPABASE_ACCESS_TOKEN='your-token-here'
```

### 3. Deploy All Edge Functions

Run these commands one by one:

```bash
# Core functions
npx supabase functions deploy parse-mls-file
npx supabase functions deploy optimize-route
npx supabase functions deploy geocode-address
npx supabase functions deploy generate-property-pdf
npx supabase functions deploy generate-session-pdf
npx supabase functions deploy ai-assistant
npx supabase functions deploy elevenlabs-tts

# Subscription/Auth functions
npx supabase functions deploy create-checkout
npx supabase functions deploy customer-portal
npx supabase functions deploy check-subscription

# Admin functions (if not already deployed)
npx supabase functions deploy admin-create-user
npx supabase functions deploy admin-list-users
npx supabase functions deploy admin-delete-user
```

**Note:** You DON'T need to deploy `stripe-webhook` yet since you're not accepting payments during beta.

## 🎟️ Create Beta Trial Codes

### Option 1: Via Admin Panel (Easiest)
1. Sign in to your app as admin (`angelo@houseforsaleabq.com` or `contact@home-folio.net`)
2. Go to Dashboard
3. Look for "Beta Codes" or "Manage Codes" section
4. Create new beta codes with:
   - Duration: 30 days (or custom)
   - Tier: Pro, Team, or Team5
   - Number of uses: 1 (single-use) or unlimited

### Option 2: Via Supabase Dashboard (If needed)
1. Go to Supabase Dashboard → Table Editor
2. Open the `beta_trial_codes` table
3. Click "Insert row"
4. Fill in:
   - `code`: Generate a random code (e.g., `BETA-2024-ABC123`)
   - `tier`: `pro`, `team`, or `team5`
   - `trial_days`: `30` (or your preferred duration)
   - `max_uses`: `1` (single-use) or `null` (unlimited)
   - `created_by`: Your user ID

## 👥 Invite Beta Testers

### Email Template
```
Subject: You're invited to beta test HomeFolio!

Hi [Name],

I'm excited to invite you to beta test HomeFolio, a platform for real estate agents to create and share professional property showings.

Here's how to get started:

1. Sign up at: https://homefolioshowing.lovable.app/signup
2. Use this beta code to unlock premium features: [YOUR-BETA-CODE]

Your beta access includes:
✓ Unlimited property listings
✓ Professional showing sessions
✓ QR code sharing
✓ PDF generation
✓ AI property summaries
✓ Route optimization

What I'd love your feedback on:
- Is the interface intuitive?
- Can you create a showing session easily?
- How's the mobile experience?
- What features are missing?
- Would you pay for this? What price seems fair?

Your feedback is invaluable in making this product better!

Thanks,
[Your Name]
```

## ✅ Beta Testing Checklist

Before sending invites, test these yourself:

### Quick Test Flow (5 minutes)
1. **Create a property**
   - Add address, price, beds, baths
   - Upload at least one photo

2. **Create a showing session**
   - Add the property to a session
   - Generate QR code

3. **Test client experience**
   - Scan QR code with your phone
   - View property details on mobile
   - Check that photos, details, and layout look good

4. **Generate PDF**
   - Download property PDF
   - Verify clean layout (no duplicates, photo at top)

5. **Test beta code redemption**
   - Sign up with a new email (use + trick: yourname+test@gmail.com)
   - Redeem a beta code
   - Verify premium access is granted

### What to Watch For
- ✅ Mobile experience is smooth
- ✅ QR codes work reliably
- ✅ PDFs look professional
- ✅ No errors in the browser console
- ✅ All images load properly

## 📊 Gather Feedback

### Key Questions for Beta Testers
1. **Usability**: Was it easy to create your first showing session?
2. **Value**: Does this solve a real problem for you?
3. **Missing Features**: What features would make this a must-have?
4. **Pricing**: Would you pay $20/mo? $50/mo? More? Less?
5. **Competition**: How does this compare to what you use now?

### Set Up a Feedback Form
Use Google Forms, Typeform, or similar with these questions:
- What did you like most?
- What was frustrating or confusing?
- What features are missing?
- How likely are you to recommend this? (1-10 scale)
- Would you pay for this? What price?
- Any bugs or issues you encountered?

## 🔧 Troubleshooting

### Edge Functions Not Working
1. Check function logs in Supabase Dashboard
2. Verify environment variables are set correctly
3. Redeploy the specific function

### Beta Codes Not Working
1. Check `beta_trial_codes` table in Supabase
2. Verify `is_active` is `true`
3. Check `max_uses` hasn't been exceeded

### Photos Not Loading
1. Check Supabase Storage buckets
2. Verify storage policies allow public read
3. Check browser console for CORS errors

### AI Assistant Not Responding
1. Verify `OPENAI_API_KEY` is set in Supabase Edge Function secrets
2. Check ai-assistant function logs for errors
3. Verify OpenAI API has credits

### Voice Not Working
1. Verify `ELEVENLABS_API_KEY` is set in Supabase Edge Function secrets
2. Check elevenlabs-tts function logs
3. Verify ElevenLabs account has credits

## 📈 Success Metrics for Beta

**Week 1 Goals:**
- [ ] 5-10 beta testers signed up
- [ ] Each tester creates at least 1 showing session
- [ ] No critical bugs reported
- [ ] Positive feedback on core workflow

**Week 2-4 Goals:**
- [ ] 20+ active beta testers
- [ ] Collect detailed feedback via form
- [ ] Identify top 3 missing features
- [ ] Validate pricing assumptions
- [ ] Fix all reported bugs

## 🎯 Next Steps After Beta

1. **Review Feedback**: Analyze all feedback and identify patterns
2. **Prioritize Fixes**: Fix critical bugs and add must-have features
3. **Set Up Stripe**: Follow [STRIPE_SETUP.md](./STRIPE_SETUP.md) when ready to charge
4. **Launch Marketing**: Build landing page, create demo video
5. **Go Live**: Public launch with pricing

## 💡 Tips for Successful Beta

1. **Start Small**: 5-10 testers is better than 100 for initial feedback
2. **Ask Specific Questions**: Don't just say "give feedback"
3. **Follow Up**: Check in with testers after a few days
4. **Be Responsive**: Fix bugs quickly, show you're listening
5. **Show Progress**: Let testers know when you add their suggestions
6. **Thank Them**: Beta testers are gold - show appreciation!

## 📞 Support During Beta

Create a support channel:
- Email: support@home-folio.net (or your email)
- Slack/Discord: Consider creating a private beta tester channel
- Phone: Offer 1-on-1 calls for valuable feedback

---

**You're ready to launch! 🚀**

Questions? Check [BETA_TESTING_CHECKLIST.md](./BETA_TESTING_CHECKLIST.md) for detailed feature status.
