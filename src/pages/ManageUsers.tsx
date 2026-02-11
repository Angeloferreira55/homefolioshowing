import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, Loader2, Users, Mail, Lock, Building, Phone, User, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatedUser {
  email: string;
  password: string;
  fullName: string;
  timestamp: string;
}

const ManageUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamMemberCount, setTeamMemberCount] = useState<number>(0);
  const [teamLimit, setTeamLimit] = useState<number>(10);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch user role and team info
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, team_id')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);

        // If team leader, fetch team member count
        if (profile.role === 'team_leader' && profile.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('max_members')
            .eq('id', profile.team_id)
            .single();

          if (teamData) {
            setTeamLimit(teamData.max_members);
          }

          // Get current team member count
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', profile.team_id);

          setTeamMemberCount(count || 0);
        }
      }
    };
    checkAuth();
  }, [navigate]);

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
        },
      });

      if (error) {
        throw error;
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
        },
        ...prev,
      ]);

      toast.success(`User created successfully: ${email}`);

      // Update team member count if team leader
      if (userRole === 'team_leader') {
        setTeamMemberCount(prev => prev + 1);
      }

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

          {/* Team info for team leaders */}
          {userRole === 'team_leader' && (
            <Alert className="mt-4">
              <Users className="w-4 h-4" />
              <AlertDescription>
                Team Members: <strong>{teamMemberCount} / {teamLimit}</strong>
                {teamMemberCount >= teamLimit && (
                  <span className="text-destructive ml-2">
                    (Limit reached - upgrade for more members)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
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
                {userRole === 'team_leader'
                  ? 'Add a new team member with pre-configured credentials'
                  : 'Add a new realtor account with pre-configured credentials'}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || (userRole === 'team_leader' && teamMemberCount >= teamLimit)}
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
                    Created Users ({createdUsers.length})
                  </CardTitle>
                  <CardDescription>
                    Recently created accounts in this session
                  </CardDescription>
                </div>
                {createdUsers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCredentials}
                  >
                    Download All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {createdUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No users created yet</p>
                  <p className="text-sm">Create your first realtor account to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription className="text-xs">
                      ⚠️ Save these credentials! Passwords are only shown once during creation.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {createdUsers.map((user, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted/50 rounded-lg border border-border space-y-2"
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
                        <p className="text-xs text-muted-foreground">
                          Created: {user.timestamp}
                        </p>
                      </div>
                    ))}
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
              <p>Copy the credentials and share them securely with the realtor (email, Slack, etc.)</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <p>The realtor can immediately sign in at <code className="bg-muted px-1.5 py-0.5 rounded">/auth</code> - no email confirmation needed</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <p>They can update their profile, add photos, and start creating showing sessions</p>
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
