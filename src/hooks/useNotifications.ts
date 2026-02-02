import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  type: 'session_shared' | 'property_added' | 'feedback_submitted';
  sessionId: string;
  propertyAddress?: string;
  rating?: number;
  feedback?: Record<string, unknown>;
  shareLink?: string;
}

export async function sendNotificationEmail(payload: NotificationPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: payload,
    });

    if (error) {
      console.error('Notification email error:', error);
      return false;
    }

    if (!data?.success) {
      console.error('Notification email failed:', data?.error);
      return false;
    }

    console.log('Notification email sent:', data.emailId);
    return true;
  } catch (err) {
    console.error('Failed to send notification email:', err);
    return false;
  }
}
