import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: 'session_shared' | 'property_added' | 'feedback_submitted';
  sessionId: string;
  propertyAddress?: string;
  rating?: number;
  feedback?: Record<string, unknown>;
  shareLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create service role client to access profiles
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, sessionId, propertyAddress, rating, feedback, shareLink }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for session ${sessionId}`);

    // Get session info including agent
    const { data: session, error: sessionError } = await supabase
      .from('showing_sessions')
      .select('*, profiles!showing_sessions_admin_id_fkey(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      // Try without the join - the foreign key might not exist
      const { data: sessionData, error: sessionError2 } = await supabase
        .from('showing_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError2) {
        console.error('Session fetch error:', sessionError2);
        throw new Error(`Failed to fetch session: ${sessionError2.message}`);
      }

      // Get agent profile separately
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sessionData.admin_id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to fetch agent profile');
      }

      const agentEmail = profile.email;
      const agentName = profile.full_name || 'Agent';
      const clientName = sessionData.client_name;
      const sessionTitle = sessionData.title;

      // Build email content based on type
      let subject = '';
      let html = '';

      switch (type) {
        case 'session_shared':
          subject = `🏠 Session "${sessionTitle}" link copied`;
          html = buildSessionSharedEmail(agentName, clientName, sessionTitle, shareLink || '');
          break;

        case 'property_added':
          subject = `🏡 New property added to "${sessionTitle}"`;
          html = buildPropertyAddedEmail(agentName, clientName, sessionTitle, propertyAddress || 'Unknown address');
          break;

        case 'feedback_submitted':
          subject = `⭐ ${clientName} rated a property ${rating}/10`;
          html = buildFeedbackSubmittedEmail(agentName, clientName, propertyAddress || 'Unknown property', rating || 0, feedback);
          break;

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      console.log(`Sending ${type} email to ${agentEmail}`);

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Homefolio <notifications@resend.dev>",
        to: [agentEmail],
        subject,
        html,
      });

      if (emailError) {
        console.error('Resend error:', emailError);
        throw new Error(`Failed to send email: ${emailError.message}`);
      }

      console.log('Email sent successfully:', emailData);

      return new Response(
        JSON.stringify({ success: true, emailId: emailData?.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we got here, the join worked
    const profile = (session as any).profiles;
    const agentEmail = profile?.email;
    const agentName = profile?.full_name || 'Agent';
    const clientName = session.client_name;
    const sessionTitle = session.title;

    if (!agentEmail) {
      throw new Error('Agent email not found');
    }

    // Build email content based on type
    let subject = '';
    let html = '';

    switch (type) {
      case 'session_shared':
        subject = `🏠 Session "${sessionTitle}" link copied`;
        html = buildSessionSharedEmail(agentName, clientName, sessionTitle, shareLink || '');
        break;

      case 'property_added':
        subject = `🏡 New property added to "${sessionTitle}"`;
        html = buildPropertyAddedEmail(agentName, clientName, sessionTitle, propertyAddress || 'Unknown address');
        break;

      case 'feedback_submitted':
        subject = `⭐ ${clientName} rated a property ${rating}/10`;
        html = buildFeedbackSubmittedEmail(agentName, clientName, propertyAddress || 'Unknown property', rating || 0, feedback);
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log(`Sending ${type} email to ${agentEmail}`);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Homefolio <notifications@resend.dev>",
      to: [agentEmail],
      subject,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-notification-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function buildSessionSharedEmail(agentName: string, clientName: string, sessionTitle: string, shareLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏠 Session Link Shared</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px;">Hi ${agentName},</p>
        <p>You just copied the share link for <strong>"${sessionTitle}"</strong> (client: ${clientName}).</p>
        <p>The link is ready to share with your client:</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all;">
          <a href="${shareLink}" style="color: #2563eb; text-decoration: none;">${shareLink}</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Your client can use this link to view properties and submit feedback.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Homefolio - Property Tours Made Simple</p>
      </div>
    </body>
    </html>
  `;
}

function buildPropertyAddedEmail(agentName: string, clientName: string, sessionTitle: string, propertyAddress: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏡 New Property Added</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px;">Hi ${agentName},</p>
        <p>A new property has been added to the showing session <strong>"${sessionTitle}"</strong> for ${clientName}.</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: 600;">📍 ${propertyAddress}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">Log in to Homefolio to add more details, documents, or photos.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Homefolio - Property Tours Made Simple</p>
      </div>
    </body>
    </html>
  `;
}

function buildFeedbackSubmittedEmail(agentName: string, clientName: string, propertyAddress: string, rating: number, feedback?: Record<string, unknown>): string {
  const ratingStars = '⭐'.repeat(Math.min(Math.floor(rating), 10));
  
  let feedbackHtml = '';
  if (feedback) {
    const feedbackItems: string[] = [];
    
    if (feedback.topThingsLiked) {
      feedbackItems.push(`<li><strong>Top things liked:</strong> ${feedback.topThingsLiked}</li>`);
    }
    if (feedback.concerns) {
      feedbackItems.push(`<li><strong>Concerns:</strong> ${feedback.concerns}</li>`);
    }
    if (feedback.lifestyleFit) {
      const fitMap: Record<string, string> = { 'yes': 'Yes', 'no': 'No', 'not_sure': 'Not sure' };
      feedbackItems.push(`<li><strong>Lifestyle fit:</strong> ${fitMap[feedback.lifestyleFit as string] || feedback.lifestyleFit}</li>`);
    }
    if (feedback.priceFeel) {
      const priceMap: Record<string, string> = { 'too_high': 'Too high', 'fair': 'Fair', 'great_value': 'Great value' };
      feedbackItems.push(`<li><strong>Price feels:</strong> ${priceMap[feedback.priceFeel as string] || feedback.priceFeel}</li>`);
    }
    if (feedback.nextStep) {
      const stepMap: Record<string, string> = { 'see_again': 'See it again', 'write_offer': 'Write offer!', 'keep_looking': 'Keep looking', 'sleep_on_it': 'Sleep on it' };
      feedbackItems.push(`<li><strong>Next step:</strong> ${stepMap[feedback.nextStep as string] || feedback.nextStep}</li>`);
    }
    if (feedback.layoutThoughts) {
      feedbackItems.push(`<li><strong>Layout thoughts:</strong> ${feedback.layoutThoughts}</li>`);
    }
    if (feedback.neighborhoodThoughts) {
      feedbackItems.push(`<li><strong>Neighborhood:</strong> ${feedback.neighborhoodThoughts}</li>`);
    }
    if (feedback.conditionConcerns) {
      feedbackItems.push(`<li><strong>Condition concerns:</strong> ${feedback.conditionConcerns}</li>`);
    }
    if (feedback.investigateRequest) {
      feedbackItems.push(`<li><strong>Investigate:</strong> ${feedback.investigateRequest}</li>`);
    }
    
    if (feedbackItems.length > 0) {
      feedbackHtml = `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1a365d;">Detailed Feedback</h3>
          <ul style="margin: 0; padding-left: 20px; color: #475569;">
            ${feedbackItems.join('')}
          </ul>
        </div>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⭐ Client Feedback Received</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px;">Hi ${agentName},</p>
        <p><strong>${clientName}</strong> just submitted feedback for a property!</p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">📍 ${propertyAddress}</p>
          <p style="margin: 0; font-size: 32px;">${ratingStars}</p>
          <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700; color: #1a365d;">${rating}/10</p>
        </div>
        
        ${feedbackHtml}
        
        <p style="color: #64748b; font-size: 14px;">Log in to Homefolio to view the full details and plan your next steps.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Homefolio - Property Tours Made Simple</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
