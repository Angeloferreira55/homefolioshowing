import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, Users, Mail, Lock, Building, Phone, User, Copy, Check, Link as LinkIcon, Trash2, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatedUser {
  email: string;
  password: string;
  fullName: string;
  timestamp: string;
  welcomeToken?: string;
}

const ManageUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<'starter' | 'pro' | 'team5' | 'team'>('pro');
  const [trialDays, setTrialDays] = useState<number>(30);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [existingUsers, setExistingUsers] = useState<CreatedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Admin emails - only these users can access this page
  const ADMIN_EMAILS = ['angelo@houseforsaleabq.com', 'contact@home-folio.net'];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user is an admin
      const isAdmin = ADMIN_EMAILS.includes(session.user.email || '');

      if (!isAdmin) {
        toast.error('Unauthorized: Admin access only');
        navigate('/dashboard');
        return;
      }

      setUserRole('admin');
      await fetchExistingUsers();
    };
    checkAuth();
  }, [navigate]);

  const fetchExistingUsers = async () => {
    try {
      setLoadingUsers(true);

      // Use admin function to bypass RLS and fetch ALL users
      const response = await supabase.functions.invoke('admin-list-users');

      if (response.error) {
        console.error('Error fetching users:', response.error);
        setExistingUsers([]);
        return;
      }

      if (response.data?.error) {
        console.error('Error from admin-list-users:', response.data.error);
        setExistingUsers([]);
        return;
      }

      const users = response.data?.users || [];

      console.log('Found users via admin function:', users.length);
      console.log('User emails:', users.map((u: any) => u.email).join(', '));

      // Add password field for display consistency
      const allUsers = users.map((user: any) => ({
        ...user,
        password: '••••••••',
      }));

      setExistingUsers(allUsers);
    } catch (error) {
      console.error('Error in fetchExistingUsers:', error);
      setExistingUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const generatePassword = () => {
    // Generate a strong password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    if (!fullName) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create users');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email,
          password,
          fullName,
          company,
          phone,
          tier,
          trialDays,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(`Function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error('No response from function');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Add to created users list
      setCreatedUsers(prev => [
        {
          email,
          password,
          fullName,
          timestamp: new Date().toLocaleString(),
          welcomeToken: data.welcomeToken || undefined,
        },
        ...prev,
      ]);

      toast.success(`User created successfully: ${email}`);

      // Refresh existing users list to include the new user
      await fetchExistingUsers();

      // Clear form but keep company if they're creating multiple users from same company
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      // Keep company field for convenience
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = (user: CreatedUser, index: number) => {
    const credentials = `Email: ${user.email}\nPassword: ${user.password}\nName: ${user.fullName}`;
    navigator.clipboard.writeText(credentials);
    setCopiedIndex(index);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyWelcomeLink = (welcomeToken: string, index: number) => {
    const welcomeUrl = `${window.location.origin}/welcome/${welcomeToken}`;
    navigator.clipboard.writeText(welcomeUrl);
    setCopiedIndex(index);
    toast.success('Welcome link copied! Share this with the realtor.');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const regenerateWelcomeToken = async (email: string, fullName: string, index: number) => {
    try {
      setLoading(true);

      // Generate a simple welcome link
      const welcomeUrl = `${window.location.origin}/auth`;
      navigator.clipboard.writeText(welcomeUrl);
      toast.success('Login link copied to clipboard!');
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast.error('Failed to generate welcome link');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (email: string, fullName: string) => {
    if (!confirm(`Are you sure you want to delete ${fullName} (${email})? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { email },
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`User ${fullName} deleted successfully`);

      // Refresh the user lists
      await fetchExistingUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const downloadCredentials = () => {
    const content = createdUsers.map(user =>
      `Created: ${user.timestamp}\nName: ${user.fullName}\nEmail: ${user.email}\nPassword: ${user.password}\n\n---\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtor-credentials-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials downloaded!');
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8" />
            Manage Realtor Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Create accounts for realtors to test and use HomeFolio
          </p>

        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Create New User
              </CardTitle>
              <CardDescription>
                Add a new realtor account with pre-configured credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Smith"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="pl-10"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="flex-shrink-0"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Coldwell Banker"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="tier">Plan Type *</Label>
                  <div className="relative">
                    <Crown className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                    <Select value={tier} onValueChange={(value: 'starter' | 'pro' | 'team5' | 'team') => setTier(value)}>
                      <SelectTrigger id="tier" className="pl-10">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter (Free)</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="team5">Teams (up to 5)</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which plan tier this user will have access to
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trial Period *</Label>
                  <Select value={String(trialDays)} onValueChange={(value) => setTrialDays(Number(value))}>
                    <SelectTrigger id="trialDays">
                      <SelectValue placeholder="Select trial period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="3650">10 years (Unlimited)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How long they can use the platform without payment
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Created Users List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Realtor Accounts ({existingUsers.length + createdUsers.length})
                  </CardTitle>
                  <CardDescription>
                    {createdUsers.length > 0 && `${createdUsers.length} created this session • `}
                    {existingUsers.length} total accounts
                  </CardDescription>
                </div>
                {createdUsers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCredentials}
                  >
                    Download New
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Loading users...</p>
                </div>
              ) : existingUsers.length === 0 && createdUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No users created yet</p>
                  <p className="text-sm">Create your first realtor account to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {createdUsers.length > 0 && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        ⚠️ Save these credentials! Passwords are only shown once during creation.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {/* Newly created users in this session */}
                    {createdUsers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide px-1">
                          Created This Session
                        </p>
                        {createdUsers.map((user, index) => (
                          <div
                            key={`new-${index}`}
                            className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCredentials(user, index)}
                                className="flex-shrink-0 h-8 gap-1"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="bg-background/80 rounded p-2 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground">Password:</span>
                                <code className="flex-1 truncate">{user.password}</code>
                              </div>
                            </div>
                            {user.welcomeToken && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyWelcomeLink(user.welcomeToken!, index + 1000)}
                                className="w-full gap-2"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                {copiedIndex === index + 1000 ? 'Welcome Link Copied!' : 'Copy Welcome Link'}
                              </Button>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Created: {user.timestamp}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Existing users */}
                    {existingUsers.length > 0 && (
                      <div className="space-y-2">
                        {createdUsers.length > 0 && <Separator className="my-4" />}
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                          All Accounts
                        </p>
                        {existingUsers.map((user, index) => (
                          <div
                            key={`existing-${index}`}
                            className="p-4 bg-muted/50 rounded-lg border border-border space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {user.welcomeToken ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyWelcomeLink(user.welcomeToken!, index + 2000)}
                                  className="flex-1 gap-2"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  {copiedIndex === index + 2000 ? 'Welcome Link Copied!' : 'Copy Welcome Link'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => regenerateWelcomeToken(user.email, user.fullName, index)}
                                  disabled={loading}
                                  className="flex-1 gap-2"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  Generate Welcome Link
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteUser(user.email, user.fullName)}
                                disabled={loading}
                                className="gap-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Created: {user.timestamp}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <p>Fill in the realtor's information and click "Create User Account"</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <p><strong>Recommended:</strong> Click "Copy Welcome Link" and send it to the realtor via email. This link provides a professional onboarding experience.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <p><strong>Alternative:</strong> Copy the credentials manually and share them securely (the password is temporary and should be changed)</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <p>The realtor can sign in at <code className="bg-muted px-1.5 py-0.5 rounded">/auth</code>, complete their profile, and start creating showing sessions</p>
            </div>
            <Separator className="my-4" />
            <p className="text-xs">
              💡 Tip: Use the "Generate" button to create strong, random passwords. Keep the company field filled when creating multiple users from the same brokerage.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageUsers;
