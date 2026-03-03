import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoId, token } = await req.json();

    if (!photoId || !token) {
      return new Response(
        JSON.stringify({ error: 'photoId and token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get the photo and its associated property
    const { data: photo, error: photoError } = await supabase
      .from('client_photos')
      .select('id, file_url, session_property_id')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return new Response(
        JSON.stringify({ error: 'Photo not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the property's session
    const { data: property, error: propError } = await supabase
      .from('session_properties')
      .select('session_id')
      .eq('id', photo.session_property_id)
      .single();

    if (propError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate share token matches the session
    const { data: session, error: sessionError } = await supabase
      .from('showing_sessions')
      .select('id')
      .eq('id', property.session_id)
      .eq('share_token', token)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the storage file
    try {
      const url = new URL(photo.file_url);
      const pathParts = url.pathname.split('/client-photos/');
      if (pathParts[1]) {
        await supabase.storage.from('client-photos').remove([pathParts[1]]);
      }
    } catch (e) {
      console.error('Storage delete error (non-fatal):', e);
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('client_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete photo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('delete-client-photo error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
