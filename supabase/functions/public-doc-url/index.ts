import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Body = {
  token?: string;
  docId?: string;
  expiresInSeconds?: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, docId, expiresInSeconds } = (await req.json()) as Body;

    if (!token || !docId) {
      return new Response(JSON.stringify({ error: 'token and docId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate share token exists
    const { data: validToken } = await supabase.rpc('is_valid_share_token', { token });
    if (!validToken) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure this document belongs to the session associated with this token
    const { data: docRow, error: docErr } = await supabase
      .from('property_documents')
      .select('file_url, session_property_id')
      .eq('id', docId)
      .maybeSingle();

    if (docErr || !docRow?.file_url) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: sessionRow, error: sessionErr } = await supabase
      .from('session_properties')
      .select('session_id')
      .eq('id', docRow.session_property_id)
      .maybeSingle();

    if (sessionErr || !sessionRow?.session_id) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: showingSession, error: showingErr } = await supabase
      .from('showing_sessions')
      .select('id')
      .eq('id', sessionRow.session_id)
      .eq('share_token', token)
      .maybeSingle();

    if (showingErr || !showingSession?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ttl = Math.min(Math.max(expiresInSeconds ?? 3600, 60), 60 * 60 * 12);
    const { data: signed, error: signErr } = await supabase.storage
      .from('property-documents')
      .createSignedUrl(docRow.file_url, ttl);

    if (signErr || !signed?.signedUrl) {
      console.error('createSignedUrl error', signErr);
      return new Response(JSON.stringify({ error: 'Failed to create signed URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ signedUrl: signed.signedUrl, expiresInSeconds: ttl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('public-doc-url error', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
