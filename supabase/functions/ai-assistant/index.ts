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

Key features of HomeFolio:
- Create showing sessions with multiple properties
- Add properties via PDF upload, Realtor.com link, or manual entry
- Upload and share property documents (disclosures, inspections, etc.)
- Password-protect sessions for client privacy
- Clients can view properties, rate them, and provide feedback
- Get directions to properties and optimize routes
- Track analytics and client engagement
- Team management for brokerages
- Professional branding with agent profiles and logos

IMPORTANT: Answering Guidelines:
- Be helpful, friendly, and concise
- Provide step-by-step instructions when appropriate
- NEVER make assumptions about features you're not certain about
- If you don't know specific details about a feature (like data recovery, deletion behavior, etc.), be honest and say: "I'm not certain about that specific functionality. For the most accurate information, please check the Help page or contact support at contact@home-folio.net"
- Only confirm features that are explicitly listed above
- Keep responses focused on HomeFolio features and real estate workflows
- Be professional and supportive

Available subscription tiers:
- Starter (Free): 5 sessions, 1 property per session
- Pro ($29/mo): Unlimited sessions and properties
- Team ($99/mo): Team collaboration, up to 50 team members
- Team5 ($49/mo): Team features for up to 5 members

Common Questions:
- For questions about data recovery, deletion, backups, or technical details not listed above, admit uncertainty and direct to support
- Focus on helping users with the features listed above
- When in doubt, be honest about limitations of your knowledge`;

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
