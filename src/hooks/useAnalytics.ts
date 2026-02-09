import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AnalyticsEventType = 
  | 'session_view'
  | 'property_view'
  | 'property_rating'
  | 'document_view'
  | 'session_share'
  | 'photo_upload'
  | 'pdf_download'
  | 'session_print';

interface TrackEventParams {
  eventType: AnalyticsEventType;
  sessionId?: string;
  propertyId?: string;
  adminId: string;
  metadata?: Record<string, unknown>;
}

export const trackEvent = async ({
  eventType,
  sessionId,
  propertyId,
  adminId,
  metadata = {},
}: TrackEventParams) => {
  try {
    // Use type assertion to work around generated types not being updated yet
    const insertData = {
      event_type: eventType,
      session_id: sessionId || null,
      property_id: propertyId || null,
      admin_id: adminId,
      metadata: metadata as Json,
    };
    
    const { error } = await supabase
      .from('analytics_events')
      .insert(insertData as any);
    
    if (error) {
      console.error('Failed to track event:', error);
    }
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
};

export const useAnalytics = () => {
  return { trackEvent };
};
