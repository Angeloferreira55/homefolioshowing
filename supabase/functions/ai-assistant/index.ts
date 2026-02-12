import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { message, conversationHistory } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({
          response: 'I apologize, but the AI assistant is not configured yet. Please contact support at contact@home-folio.net for help with your question.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // System prompt with HomeFolio context
    const systemPrompt = `You are a helpful AI assistant for HomeFolio, a platform that helps real estate agents create and share property showing sessions with their clients.

== KEY FEATURES ==
- Create showing sessions with multiple properties
- Add properties via PDF upload, Realtor.com link, or manual entry
- Upload and share property documents (disclosures, inspections, etc.)
- Password-protect sessions for client privacy
- Clients can view properties, rate them, and provide feedback
- Get directions to properties and optimize routes
- Track analytics and client engagement
- Team management for brokerages
- Professional branding with agent profiles and logos

== HOW TO: CREATE A SESSION ==
1. Click "Create Session" from the dashboard
2. Enter session details (title, description, date)
3. Add properties using one of three methods:
   a) Upload PDF (MLS listing)
   b) Paste Realtor.com link
   c) Manual entry (address, price, beds, baths, sqft)
4. Add photos for each property
5. Upload documents (optional: disclosures, inspections)
6. Set password protection (optional but recommended)
7. Share the link with clients

== HOW TO: ADD PROPERTIES ==
Method 1 - PDF Upload:
- Click "Add Property" → "Upload PDF"
- Select MLS listing PDF
- HomeFolio extracts property details automatically
- Review and edit if needed

Method 2 - Realtor.com Link:
- Copy property URL from Realtor.com
- Click "Add Property" → "From Link"
- Paste URL and click "Import"
- Details are automatically populated

Method 3 - Manual Entry:
- Click "Add Property" → "Manual Entry"
- Fill in: address, price, bedrooms, bathrooms, sqft
- Add photos and description
- Save property

== HOW TO: SHARE A SESSION ==
1. Go to your session
2. Click "Share" button
3. Copy the secure link
4. Send to clients via email, text, or messaging
5. Optional: Enable password protection
6. Clients can view without creating an account

== SUBSCRIPTION TIERS ==
Starter (Free):
- 5 sessions total
- 1 property per session
- Basic analytics
- Perfect for trying HomeFolio

Pro ($29/mo):
- Unlimited sessions
- Unlimited properties per session
- Advanced analytics
- Priority support
- Best for individual agents

Team ($99/mo):
- All Pro features
- Up to 50 team members
- Team collaboration tools
- Shared sessions
- Team analytics
- Best for brokerages

Team5 ($49/mo):
- All Pro features
- Up to 5 team members
- Team collaboration
- Perfect for small teams

== COMMON QUESTIONS ==

Q: How do clients view my sessions?
A: Share the session link with clients. They can view properties, rate them, add comments, and provide feedback without creating an account.

Q: Can I password-protect sessions?
A: Yes! When creating or editing a session, toggle on "Password Protection" and set a password. Share the password with your clients separately.

Q: How do I add photos to properties?
A: When adding/editing a property, click "Upload Photos" or drag-and-drop images. You can upload multiple photos per property.

Q: Can clients see all my sessions?
A: No, each session has a unique secure link. Clients can only see sessions you explicitly share with them.

Q: How do I track client engagement?
A: Go to Analytics to see session views, property ratings, client feedback, and engagement metrics for each session.

Q: Can I edit a session after sharing?
A: Yes, you can edit sessions anytime. Changes are reflected immediately for clients viewing the session.

Q: How do I upgrade my subscription?
A: Go to My Profile → Subscription to view plans and upgrade. Changes take effect immediately.

Q: What happens when I reach my session limit (Starter plan)?
A: You'll need to delete old sessions or upgrade to Pro for unlimited sessions.

== TROUBLESHOOTING ==

Problem: Photos won't upload
Solution: Check file size (max 10MB per image) and format (JPG, PNG supported). Try compressing large images.

Problem: Can't import from Realtor.com
Solution: Ensure the URL is a direct property link (not search results). Try manual entry if import fails.

Problem: Clients can't access session
Solution: Verify the link is correct and password (if set) is shared. Check if session is still active.

Problem: PDF upload not extracting data
Solution: Ensure PDF is text-based (not scanned image). Try manual entry if extraction fails.

== ANSWERING GUIDELINES ==
- Be helpful, friendly, and concise
- Provide step-by-step instructions when appropriate
- NEVER make assumptions about features you're not certain about
- If you don't know specific details (like data recovery, deletion behavior, backups), be honest and say: "I'm not certain about that specific functionality. For the most accurate information, please check the Help page or contact support at contact@home-folio.net"
- Only confirm features explicitly listed above
- Focus on HomeFolio features and real estate workflows
- Be professional and supportive
- When in doubt, admit limitations of your knowledge

== SUPPORT CONTACT ==
For technical issues, billing questions, or features not covered here, direct users to:
- Help page in the app
- Email: contact@home-folio.net`;

    // Build messages array with system prompt and conversation history
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const assistantResponse = openaiData.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        response: 'I apologize, but I\'m having trouble right now. Please try again or contact support at contact@home-folio.net.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
