import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useActiveAgent } from '@/hooks/useActiveAgent';
import { toast } from 'sonner';
import {
  Camera,
  Building2,
  User,
  Phone,
  Mail,
  Award,
  Save,
  Loader2,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Globe,
  ArrowLeft,
} from 'lucide-react';

// X/Twitter icon
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface AgentFormData {
  full_name: string;
  email: string;
  phone: string;
  slogan: string;
  bio: string;
  license_number: string;
  brokerage_name: string;
  brokerage_address: string;
  brokerage_phone: string;
  brokerage_email: string;
  linkedin_url: string;
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  website_url: string;
  avatar_url?: string;
  brokerage_logo_url?: string;
}

const emptyForm: AgentFormData = {
  full_name: '',
  email: '',
  phone: '',
  slogan: '',
  bio: '',
  license_number: '',
  brokerage_name: '',
  brokerage_address: '',
  brokerage_phone: '',
  brokerage_email: '',
  linkedin_url: '',
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  youtube_url: '',
  website_url: '',
};

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const ManagedAgentEdit = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { refetchAgents } = useActiveAgent();
  const isNew = agentId === 'new';

  const [formData, setFormData] = useState<AgentFormData>(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing agent data
  useEffect(() => {
    if (isNew) return;
    const fetchAgent = async () => {
      const { data, error } = await supabase
        .from('managed_agents')
        .select('*')
        .eq('id', agentId!)
        .single();

      if (error || !data) {
        toast.error('Agent profile not found');
        navigate('/admin/agents');
        return;
      }

      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        slogan: data.slogan || '',
        bio: data.bio || '',
        license_number: data.license_number || '',
        brokerage_name: data.brokerage_name || '',
        brokerage_address: data.brokerage_address || '',
        brokerage_phone: data.brokerage_phone || '',
        brokerage_email: data.brokerage_email || '',
        linkedin_url: data.linkedin_url || '',
        instagram_url: data.instagram_url || '',
        facebook_url: data.facebook_url || '',
        twitter_url: data.twitter_url || '',
        youtube_url: data.youtube_url || '',
        website_url: data.website_url || '',
      });
      setAvatarPreview(data.avatar_url);
      setLogoPreview(data.brokerage_logo_url);
      setLoading(false);
    };
    fetchAgent();
  }, [agentId, isNew, navigate]);

  const handleChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadImage = async (file: File, type: 'avatar' | 'logo'): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const ext = file.name.split('.').pop();
      const agentPath = isNew ? 'temp' : agentId;
      const path = `${user.id}/agent-${agentPath}/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`Failed to upload ${type}`);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-assets')
        .getPublicUrl(path);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(`Failed to upload ${type}`);
      return null;
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target?.result as string);
    reader.readAsDataURL(file);

    const url = await uploadImage(file, 'avatar');
    if (url) {
      setFormData(prev => ({ ...prev, avatar_url: url }));
    }
    setUploadingAvatar(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => setLogoPreview(event.target?.result as string);
    reader.readAsDataURL(file);

    const url = await uploadImage(file, 'logo');
    if (url) {
      setFormData(prev => ({ ...prev, brokerage_logo_url: url }));
    }
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        slogan: formData.slogan.trim() || null,
        bio: formData.bio.trim() || null,
        license_number: formData.license_number.trim() || null,
        brokerage_name: formData.brokerage_name.trim() || null,
        brokerage_address: formData.brokerage_address.trim() || null,
        brokerage_phone: formData.brokerage_phone.trim() || null,
        brokerage_email: formData.brokerage_email.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        instagram_url: formData.instagram_url.trim() || null,
        facebook_url: formData.facebook_url.trim() || null,
        twitter_url: formData.twitter_url.trim() || null,
        youtube_url: formData.youtube_url.trim() || null,
        website_url: formData.website_url.trim() || null,
        avatar_url: formData.avatar_url || null,
        brokerage_logo_url: formData.brokerage_logo_url || null,
      };

      if (isNew) {
        const { error } = await supabase
          .from('managed_agents')
          .insert({ ...payload, owner_id: user.id });
        if (error) throw error;
        toast.success('Agent profile created');
      } else {
        const { error } = await supabase
          .from('managed_agents')
          .update(payload)
          .eq('id', agentId!);
        if (error) throw error;
        toast.success('Agent profile updated');
      }

      await refetchAgents();
      navigate('/admin/agents');
    } catch (err) {
      console.error('Save error:', err);
      toast.error(isNew ? 'Failed to create agent profile' : 'Failed to update agent profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/agents')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {isNew ? 'Add Agent Profile' : 'Edit Agent Profile'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew
                ? 'Create a profile for an agent you manage'
                : `Editing ${formData.full_name || 'agent'}'s profile`}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Agent's name, photo, and contact info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {avatarPreview && <AvatarImage src={avatarPreview} />}
                    <AvatarFallback className="text-lg">
                      {getInitials(formData.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Agent Photo</p>
                  <p className="text-xs text-muted-foreground">This appears on shared sessions</p>
                </div>
              </div>

              <Separator />

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Jane Smith"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan / Tagline</Label>
                <Input
                  id="slogan"
                  placeholder="Your trusted real estate partner"
                  value={formData.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="A short bio about this agent..."
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number" className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> License Number
                </Label>
                <Input
                  id="license_number"
                  placeholder="RE-123456"
                  value={formData.license_number}
                  onChange={(e) => handleChange('license_number', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Brokerage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Brokerage Details
              </CardTitle>
              <CardDescription>Brokerage branding that appears on sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Brokerage Logo</p>
                  <p className="text-xs text-muted-foreground">Displayed alongside agent branding</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="brokerage_name">Brokerage Name</Label>
                <Input
                  id="brokerage_name"
                  placeholder="ABC Realty"
                  value={formData.brokerage_name}
                  onChange={(e) => handleChange('brokerage_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brokerage_address">Brokerage Address</Label>
                <Input
                  id="brokerage_address"
                  placeholder="123 Main St, Anytown, USA"
                  value={formData.brokerage_address}
                  onChange={(e) => handleChange('brokerage_address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brokerage_phone">Brokerage Phone</Label>
                  <Input
                    id="brokerage_phone"
                    placeholder="(555) 987-6543"
                    value={formData.brokerage_phone}
                    onChange={(e) => handleChange('brokerage_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerage_email">Brokerage Email</Label>
                  <Input
                    id="brokerage_email"
                    type="email"
                    placeholder="info@abcrealty.com"
                    value={formData.brokerage_email}
                    onChange={(e) => handleChange('brokerage_email', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Social Media & Website
              </CardTitle>
              <CardDescription>Agent's online presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website_url" className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Website
                </Label>
                <Input
                  id="website_url"
                  placeholder="https://janesmith.com"
                  value={formData.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </Label>
                  <Input
                    id="linkedin_url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin_url}
                    onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url" className="flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </Label>
                  <Input
                    id="instagram_url"
                    placeholder="https://instagram.com/..."
                    value={formData.instagram_url}
                    onChange={(e) => handleChange('instagram_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url" className="flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5" /> Facebook
                  </Label>
                  <Input
                    id="facebook_url"
                    placeholder="https://facebook.com/..."
                    value={formData.facebook_url}
                    onChange={(e) => handleChange('facebook_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url" className="flex items-center gap-1.5">
                    <XIcon className="w-3.5 h-3.5" /> X / Twitter
                  </Label>
                  <Input
                    id="twitter_url"
                    placeholder="https://x.com/..."
                    value={formData.twitter_url}
                    onChange={(e) => handleChange('twitter_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url" className="flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5" /> YouTube
                </Label>
                <Input
                  id="youtube_url"
                  placeholder="https://youtube.com/@..."
                  value={formData.youtube_url}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3 pb-8">
            <Button variant="outline" onClick={() => navigate('/admin/agents')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.full_name.trim()}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isNew ? 'Create Agent Profile' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManagedAgentEdit;
