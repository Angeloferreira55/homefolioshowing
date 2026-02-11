import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, UserCircle, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeTokenData {
  email: string;
  full_name: string | null;
  company: string | null;
  used: boolean;
  expires_at: string;
}

const Welcome = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<WelcomeTokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid welcome link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('welcome_tokens')
          .select('email, full_name, company, used, expires_at')
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          setError('This welcome link is invalid or has expired');
          setLoading(false);
          return;
        }

        // Check if expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          setError('This welcome link has expired. Please contact your administrator for a new link.');
          setLoading(false);
          return;
        }

        // Check if already used
        if (data.used) {
          setError('This welcome link has already been used. Please sign in at /auth');
          setLoading(false);
          return;
        }

        setTokenData(data);
        setLoading(false);

        // Mark token as used
        await supabase
          .from('welcome_tokens')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('token', token);

      } catch (err) {
        console.error('Error verifying token:', err);
        setError('Failed to verify welcome link');
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Verifying your welcome link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full mt-4"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-display text-3xl">
            Welcome to HomeFolio{tokenData?.full_name ? `, ${tokenData.full_name}` : ''}!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your account has been created and is ready to use
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Account Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Your Account Details
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{tokenData?.email}</span>
              </div>
              {tokenData?.company && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Company: {tokenData.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-3">
            <h3 className="font-semibold">What's Next?</h3>

            <div className="space-y-2">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Sign In to Your Account</p>
                  <p className="text-xs text-muted-foreground">
                    Use your email and the temporary password provided by your administrator
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Complete Your Profile</p>
                  <p className="text-xs text-muted-foreground">
                    Add your photo, bio, social links, and brokerage information
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Create Your First Showing Session</p>
                  <p className="text-xs text-muted-foreground">
                    Import properties from MLS sheets and share beautiful digital portfolios with clients
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Reminder */}
          <Alert>
            <Lock className="w-4 h-4" />
            <AlertDescription className="text-xs">
              <strong>Security Tip:</strong> We recommend changing your password after signing in for the first time. You can do this from your profile settings.
            </AlertDescription>
          </Alert>

          {/* Action Button */}
          <Button
            onClick={handleGetStarted}
            className="w-full"
            size="lg"
          >
            Sign In to Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Help */}
          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact your administrator or email{' '}
            <a href="mailto:support@home-folio.net" className="text-primary hover:underline">
              support@home-folio.net
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;
