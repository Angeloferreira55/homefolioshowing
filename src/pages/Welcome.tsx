import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, Lock, Sparkles } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-display text-3xl">
            Welcome to HomeFolio!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your account has been created and is ready to use
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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

          <Alert>
            <Lock className="w-4 h-4" />
            <AlertDescription className="text-xs">
              <strong>Security Tip:</strong> We recommend changing your password after signing in for the first time.
            </AlertDescription>
          </Alert>

          <Button onClick={handleGetStarted} className="w-full" size="lg">
            Sign In to Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

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