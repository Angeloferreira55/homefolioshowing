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
import { UserPlus, Loader2, Users, Mail, Lock, Building, Phone, User, Copy, Check, Link as LinkIcon, Trash2, AlertCircle, Send, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';

interface TeamMember {
  userId?: string;
  email: string;
  password: string;
  fullName: string;
  timestamp: string;
  welcomeToken?: string;
}

interface TeamInfo {
  memberCount: number;
  maxMembers: number;
}

const TeamManagement = () => {
  const navigate = useNavigate();
  const { subscribed, tier, loading: subLoading } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [createdMembers, setCreatedMembers] = useState<TeamMember[]>([]);
  const [existingMembers, setExistingMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo>({ memberCount: 0, maxMembers: 0 });

  useEffect(() => {
    if (subLoading) return; // Wait for subscription check to finish

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has team/team5 subscription
      if (!subscribed || (tier !== 'team' && tier !== 'team5')) {
        toast.error('Team Management requires an active Team subscription');
        navigate('/admin/showings');
        return;
      }

      await fetchTeamMembers();
    };
    checkAuth();
  }, [navigate, subscribed, tier, subLoading]);

  const fetchTeamMembers = async () => {
    try {
      setLoadingMembers(true);

      // Use team-specific function to fetch only this team's members
      const response = await supabase.functions.invoke('team-list-users');

      if (response.error) {
        console.error('Error fetching team members:', response.error);
        setExistingMembers([]);
        return;
      }

      if (response.data?.error) {
        console.error('Error from team-list-users:', response.data.error);
        setExistingMembers([]);
        return;
      }

      const members = response.data?.members || [];
      const memberCount = response.data?.memberCount || 0;
      const maxMembers = response.data?.maxMembers || 0;

      setTeamInfo({ memberCount, maxMembers });

      // Add password field for display consistency
      const allMembers = members.map((member: any) => ({
        ...member,
        password: '••••••••',
      }));

      setExistingMembers(allMembers);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      setExistingMembers([]);
    } finally {
      setLoadingMembers(false);
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

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    if (!fullName) {
      toast.error('Full name is required');
      return;
    }

    // Check if team is at capacity
    if (teamInfo.memberCount >= teamInfo.maxMembers) {
      toast.error(`Team is at capacity (${teamInfo.maxMembers} members max)`);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create team members');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('team-create-user', {
        body: {
          email,
          password,
          fullName,
          company,
          phone,
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
        throw new Error(data.error || 'Failed to create team member');
      }

      // Add to created members list
      setCreatedMembers(prev => [
        {
          email,
          password,
          fullName,
          timestamp: new Date().toLocaleString(),
          welcomeToken: data.welcomeToken || undefined,
        },
        ...prev,
      ]);

      if (data.emailSent) {
        toast.success(`Team member created! Welcome email sent to ${email}`);
      } else {
        toast.success(`Team member created successfully: ${email}`);
      }

      // Refresh team members list
      await fetchTeamMembers();

      // Clear form but keep company if they're creating multiple users from same company
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      // Keep company field for convenience
    } catch (error: any) {
      console.error('Error creating team member:', error);
      toast.error(error.message || 'Failed to create team member');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = (member: TeamMember, index: number) => {
    const credentials = `Email: ${member.email}\nPassword: ${member.password}\nName: ${member.fullName}`;
    navigator.clipboard.writeText(credentials);
    setCopiedIndex(index);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyWelcomeLink = (welcomeToken: string, index: number) => {
    const welcomeUrl = `${window.location.origin}/welcome/${welcomeToken}`;
    navigator.clipboard.writeText(welcomeUrl);
    setCopiedIndex(index);
    toast.success('Welcome link copied! Share this with the team member.');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const deleteMember = async (email: string, fullName: string) => {
    if (!confirm(`Are you sure you want to remove ${fullName} (${email}) from your team? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('team-delete-user', {
        body: { email },
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Team member ${fullName} removed successfully`);

      // Refresh the team members list
      await fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove team member');
    } finally {
      setLoading(false);
    }
  };

  const resendWelcomeEmail = async (email: string, fullName: string) => {
    try {
      setLoading(true);
      const response = await supabase.functions.invoke('team-regenerate-welcome', {
        body: { memberEmail: email },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      if (response.data?.emailSent) {
        toast.success(`Welcome email sent to ${fullName} (${email})`);
      } else {
        toast.success(`Welcome link regenerated for ${fullName}`);
      }

      await fetchTeamMembers();
    } catch (error) {
      console.error('Error resending welcome email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend welcome email');
    } finally {
      setLoading(false);
    }
  };

  const downloadCredentials = () => {
    const content = createdMembers.map(member =>
      `Created: ${member.timestamp}\nName: ${member.fullName}\nEmail: ${member.email}\nPassword: ${member.password}\n\n---\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-credentials-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials downloaded!');
  };

  const isAtCapacity = teamInfo.memberCount >= teamInfo.maxMembers;
  const capacityPercentage = teamInfo.maxMembers > 0 ? (teamInfo.memberCount / teamInfo.maxMembers) * 100 : 0;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their accounts
          </p>
        </div>

        {/* Team Capacity Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Team Capacity</h3>
                  <p className="text-sm text-muted-foreground">
                    {teamInfo.memberCount} of {teamInfo.maxMembers} members
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {teamInfo.memberCount}/{teamInfo.maxMembers}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{tier} Plan</p>
                </div>
              </div>
              <Progress value={capacityPercentage} className="h-2" />
              {isAtCapacity && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your team is at full capacity. Remove a member or upgrade your plan to add more.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Team Member Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Team Member
              </CardTitle>
              <CardDescription>
                Create a new account for a member of your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMember} className="space-y-4">
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
                      disabled={isAtCapacity}
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
                      disabled={isAtCapacity}
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
                        disabled={isAtCapacity}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="flex-shrink-0"
                      disabled={isAtCapacity}
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
                      disabled={isAtCapacity}
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
                      disabled={isAtCapacity}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || isAtCapacity}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Team Member...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </>
                  )}
                </Button>
                {isAtCapacity && (
                  <p className="text-xs text-destructive text-center">
                    Team is at full capacity
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members ({teamInfo.memberCount})
                  </CardTitle>
                  <CardDescription>
                    {createdMembers.length > 0 && `${createdMembers.length} added this session • `}
                    {teamInfo.memberCount} total members
                  </CardDescription>
                </div>
                {createdMembers.length > 0 && (
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
              {loadingMembers ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Loading team members...</p>
                </div>
              ) : existingMembers.length === 0 && createdMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No team members yet</p>
                  <p className="text-sm">Add your first team member to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {createdMembers.length > 0 && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        ⚠️ Save these credentials! Passwords are only shown once during creation.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {/* Newly created members in this session */}
                    {createdMembers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide px-1">
                          Added This Session
                        </p>
                        {createdMembers.map((member, index) => (
                          <div
                            key={`new-${index}`}
                            className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{member.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCredentials(member, index)}
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
                                <code className="flex-1 truncate">{member.password}</code>
                              </div>
                            </div>
                            {member.welcomeToken && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyWelcomeLink(member.welcomeToken!, index + 1000)}
                                className="w-full gap-2"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                {copiedIndex === index + 1000 ? 'Welcome Link Copied!' : 'Copy Welcome Link'}
                              </Button>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Added: {member.timestamp}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Existing team members */}
                    {existingMembers.length > 0 && (
                      <div className="space-y-2">
                        {createdMembers.length > 0 && <Separator className="my-4" />}
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                          All Team Members
                        </p>
                        {existingMembers.map((member, index) => (
                          <div
                            key={`existing-${index}`}
                            className="p-4 bg-muted/50 rounded-lg border border-border space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{member.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resendWelcomeEmail(member.email, member.fullName)}
                                disabled={loading}
                                className="flex-1 gap-2"
                                title="Resend welcome email"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Resend Welcome
                              </Button>
                              {member.userId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/team-member/${member.userId}`)}
                                  className="gap-2"
                                  title="View profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMember(member.email, member.fullName)}
                                disabled={loading}
                                className="gap-2 text-destructive hover:text-destructive"
                                title="Remove from team"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Added: {member.timestamp}
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
              <p>Fill in the team member's information and click "Add Team Member"</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <p><strong>Recommended:</strong> Click "Copy Welcome Link" and send it to them via email for a professional onboarding experience.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <p>Team members inherit your subscription tier and have access until your subscription expires</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <p>Monitor your team capacity at the top - upgrade your plan if you need more members</p>
            </div>
            <Separator className="my-4" />
            <p className="text-xs">
              💡 Tip: Use the "Generate" button to create strong, random passwords. Keep the company field filled when adding multiple members.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TeamManagement;
