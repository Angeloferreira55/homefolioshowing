import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Send,
  Award,
  User,
} from 'lucide-react';

interface MemberProfile {
  full_name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  slogan: string | null;
  bio: string | null;
  license_number: string | null;
  brokerage_name: string | null;
  brokerage_address: string | null;
  brokerage_phone: string | null;
  brokerage_email: string | null;
  brokerage_logo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  created_at: string;
}

function getInitials(name: string | null): string {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function LinkRow({ icon: Icon, label, url }: { icon: any; label: string; url: string | null }) {
  if (!url) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
          {url}
        </a>
      </div>
    </div>
  );
}

const TeamMemberProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await supabase.functions.invoke('team-get-member-profile', {
          body: { memberUserId: userId },
        });

        if (response.error) throw response.error;
        if (response.data?.error) throw new Error(response.data.error);

        setProfile(response.data.profile);
      } catch (err) {
        console.error('Error fetching member profile:', err);
        toast.error('Failed to load team member profile');
        navigate('/admin/team-management');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, navigate]);

  const handleResendWelcome = async () => {
    if (!profile) return;
    try {
      setResending(true);
      const response = await supabase.functions.invoke('team-regenerate-welcome', {
        body: { memberEmail: profile.email },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      if (response.data?.emailSent) {
        toast.success(`Welcome email sent to ${profile.full_name}`);
      } else {
        toast.success('Welcome link regenerated');
      }
    } catch (err) {
      console.error('Error resending welcome:', err);
      toast.error('Failed to resend welcome email');
    } finally {
      setResending(false);
    }
  };

  const hasSocialLinks = profile && (
    profile.linkedin_url || profile.instagram_url || profile.facebook_url ||
    profile.twitter_url || profile.youtube_url || profile.website_url
  );

  const hasBrokerageInfo = profile && (
    profile.brokerage_name || profile.brokerage_address ||
    profile.brokerage_phone || profile.brokerage_email
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/team-management')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Team Member Profile</h1>
            <p className="text-sm text-muted-foreground">View your team member's profile details</p>
          </div>
          <Button
            variant="outline"
            onClick={handleResendWelcome}
            disabled={resending}
            className="gap-2"
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Resend Welcome Email
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20 flex-shrink-0">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name || ''} />
                    )}
                    <AvatarFallback className="text-lg font-medium">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h2 className="text-xl font-semibold">{profile.full_name || 'No name set'}</h2>
                    {profile.slogan && (
                      <p className="text-sm text-muted-foreground italic">{profile.slogan}</p>
                    )}
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid sm:grid-cols-2 gap-x-8">
                  <InfoRow icon={Mail} label="Email" value={profile.email} />
                  <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                  <InfoRow icon={Building2} label="Company" value={profile.company} />
                  <InfoRow icon={Award} label="License #" value={profile.license_number} />
                </div>

                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Brokerage Info */}
            {hasBrokerageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5" />
                    Brokerage Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    {profile.brokerage_logo_url && (
                      <img
                        src={profile.brokerage_logo_url}
                        alt="Brokerage logo"
                        className="h-16 w-16 object-contain rounded-lg border flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 grid sm:grid-cols-2 gap-x-8">
                      <InfoRow icon={Building2} label="Brokerage" value={profile.brokerage_name} />
                      <InfoRow icon={MapPin} label="Address" value={profile.brokerage_address} />
                      <InfoRow icon={Phone} label="Brokerage Phone" value={profile.brokerage_phone} />
                      <InfoRow icon={Mail} label="Brokerage Email" value={profile.brokerage_email} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5" />
                    Social & Web
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <LinkRow icon={Globe} label="Website" url={profile.website_url} />
                    <LinkRow icon={Globe} label="LinkedIn" url={profile.linkedin_url} />
                    <LinkRow icon={Globe} label="Instagram" url={profile.instagram_url} />
                    <LinkRow icon={Globe} label="Facebook" url={profile.facebook_url} />
                    <LinkRow icon={Globe} label="X / Twitter" url={profile.twitter_url} />
                    <LinkRow icon={Globe} label="YouTube" url={profile.youtube_url} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default TeamMemberProfile;
