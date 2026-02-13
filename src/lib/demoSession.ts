import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a demo showing session with sample properties
 * This helps new users explore the app with realistic data
 */
export async function createDemoSession(): Promise<{ sessionId: string; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { sessionId: '', error: 'User not authenticated' };
    }

    // Create the demo session
    const { data: session, error: sessionError } = await supabase
      .from('showing_sessions')
      .insert({
        admin_id: user.id,
        title: '🎯 Demo Showing - North Valley Homes',
        client_name: 'Demo Client',
        notes: 'This is a sample showing session to help you explore HomeFolio. Feel free to experiment with all the features!',
        session_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Error creating demo session:', sessionError);
      return { sessionId: '', error: 'Failed to create demo session' };
    }

    // Sample properties with realistic addresses in Albuquerque, NM
    const demoProperties = [
      {
        session_id: session.id,
        address: '123 Tramway Blvd NE',
        city: 'Albuquerque',
        state: 'NM',
        zip_code: '87122',
        price: 425000,
        beds: 4,
        baths: 3,
        sqft: 2400,
        order_index: 0,
        showing_time: '10:00',
      },
      {
        session_id: session.id,
        address: '456 Academy Rd NE',
        city: 'Albuquerque',
        state: 'NM',
        zip_code: '87109',
        price: 385000,
        beds: 3,
        baths: 2.5,
        sqft: 2100,
        order_index: 1,
        showing_time: '11:00',
      },
      {
        session_id: session.id,
        address: '789 Paseo del Norte NE',
        city: 'Albuquerque',
        state: 'NM',
        zip_code: '87122',
        price: 475000,
        beds: 5,
        baths: 3.5,
        sqft: 2850,
        order_index: 2,
        showing_time: '13:00',
      },
      {
        session_id: session.id,
        address: '321 Montgomery Blvd NE',
        city: 'Albuquerque',
        state: 'NM',
        zip_code: '87109',
        price: 350000,
        beds: 3,
        baths: 2,
        sqft: 1950,
        order_index: 3,
        showing_time: '14:30',
      },
    ];

    // Insert all properties
    const { error: propertiesError } = await supabase
      .from('session_properties')
      .insert(demoProperties);

    if (propertiesError) {
      console.error('Error creating demo properties:', propertiesError);
      // Still return session ID as session was created
      return { sessionId: session.id, error: null };
    }

    return { sessionId: session.id, error: null };
  } catch (error) {
    console.error('Error in createDemoSession:', error);
    return { sessionId: '', error: 'An unexpected error occurred' };
  }
}

/**
 * Checks if a session is a demo session
 */
export function isDemoSession(sessionTitle: string): boolean {
  return sessionTitle.includes('🎯 Demo') || sessionTitle.includes('Demo Showing');
}

/**
 * Deletes all demo sessions for the current user
 */
export async function cleanupDemoSessions(): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Find all demo sessions
    const { data: sessions, error: fetchError } = await (supabase
      .from('showing_sessions')
      .select('id, title') as any)
      .eq('admin_id', user.id);

    if (fetchError) {
      return { success: false, error: 'Failed to fetch sessions' };
    }

    // Filter demo sessions
    const demoSessions = sessions?.filter(s => isDemoSession(s.title)) || [];

    if (demoSessions.length === 0) {
      return { success: true, error: null };
    }

    // Delete demo sessions
    const { error: deleteError } = await supabase
      .from('showing_sessions')
      .delete()
      .in('id', demoSessions.map(s => s.id));

    if (deleteError) {
      return { success: false, error: 'Failed to delete demo sessions' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in cleanupDemoSessions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
