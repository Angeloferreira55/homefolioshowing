import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '@/assets/homefolio-logo.png';

const Welcome = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('Invalid welcome link');
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-welcome-token', {
        body: { token },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setUserInfo(data.user);
    } catch (err: any) {
      console.error('Token validation error:', err);
      setError(err.message || 'This welcome link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSettingPassword(true);

      // Sign in with the temporary password first
      // Since we don't have the temp password here, we'll need to use a different approach
      // We'll use the Edge Function to update the password with admin privileges

      const { data: updateData, error: updateError } = await supabase.functions.invoke('update-welcome-password', {
        body: {
          token,
          newPassword,
        },
      });

      if (updateError) throw updateError;
      if (updateData?.error) throw new Error(updateData.error);

      toast.success('Password updated successfully!');

      // Now sign in with the new password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userInfo.email,
        password: newPassword,
      });

      if (signInError) {
        toast.error('Password updated, but auto-login failed. Please sign in manually.');
        navigate('/auth');
        return;
      }

      toast.success(`Welcome, ${userInfo.fullName}!`);

      // Redirect to profile setup
      setTimeout(() => {
        navigate('/admin/profile');
      }, 1000);

    } catch (err: any) {
      console.error('Password setup error:', err);
      toast.error(err.message || 'Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating your welcome link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Please contact your administrator for a new welcome link, or try signing in directly.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
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
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="HomeFolio" className="h-16" />
          </div>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-display text-3xl">
            Welcome, {userInfo.fullName}!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your HomeFolio account has been created and is ready to use
          </CardDescription>
          {userInfo.company && (
            <p className="text-sm text-muted-foreground mt-1">
              {userInfo.company}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Your Account Details</h3>
            <div className="text-sm space-y-1">
              <p><strong>Email:</strong> {userInfo.email}</p>
            </div>
          </div>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Set Your Password
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a secure password to protect your account
              </p>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={settingPassword}
            >
              {settingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                'Set Password & Continue'
              )}
            </Button>
          </form>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm">What's Next?</h3>
            <div className="space-y-2">
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
                    Import properties and share beautiful digital portfolios with clients
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
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
