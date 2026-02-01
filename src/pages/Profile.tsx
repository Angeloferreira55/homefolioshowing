import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, ProfileUpdate } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Award,
  Save,
  Loader2,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Globe
} from 'lucide-react';

// X/Twitter icon (not in lucide-react)
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import AdminLayout from '@/components/layout/AdminLayout';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, loading, saving, updateProfile, uploadImage } = useProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileUpdate>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        slogan: profile.slogan || '',
        bio: profile.bio || '',
        license_number: profile.license_number || '',
        brokerage_name: profile.brokerage_name || '',
        brokerage_address: profile.brokerage_address || '',
        brokerage_phone: profile.brokerage_phone || '',
        brokerage_email: profile.brokerage_email || '',
        linkedin_url: profile.linkedin_url || '',
        instagram_url: profile.instagram_url || '',
        facebook_url: profile.facebook_url || '',
        twitter_url: profile.twitter_url || '',
        youtube_url: profile.youtube_url || '',
        website_url: profile.website_url || '',
      });
      setAvatarPreview(profile.avatar_url);
      setLogoPreview(profile.brokerage_logo_url);
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    
    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
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
    
    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadImage(file, 'logo');
    if (url) {
      setFormData(prev => ({ ...prev, brokerage_logo_url: url }));
    }
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    await updateProfile(formData);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your agent profile and brokerage information</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <div className="space-y-8">
          {/* Profile Picture & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your profile picture and basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(formData.full_name || profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Profile Picture</p>
                  <p className="text-sm text-muted-foreground">
                    Upload a professional headshot. Recommended size: 400x400px
                  </p>
                </div>
              </div>

              <Separator />

              {/* Basic Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="license_number"
                      value={formData.license_number || ''}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                      placeholder="DRE# 01234567"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Slogan & Bio */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan / Tagline</Label>
                  <Input
                    id="slogan"
                    value={formData.slogan || ''}
                    onChange={(e) => handleInputChange('slogan', e.target.value)}
                    placeholder="Your key to finding the perfect home"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell clients about your experience, specialties, and approach..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brokerage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Brokerage Details
              </CardTitle>
              <CardDescription>Your brokerage company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brokerage Logo Upload */}
              <div className="flex items-center gap-6">
                <div 
                  className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Brokerage logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Brokerage Logo</p>
                  <p className="text-sm text-muted-foreground">
                    Upload your brokerage logo. Recommended: PNG with transparent background
                  </p>
                </div>
              </div>

              <Separator />

              {/* Brokerage Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brokerage_name">Brokerage Name</Label>
                  <Input
                    id="brokerage_name"
                    value={formData.brokerage_name || ''}
                    onChange={(e) => handleInputChange('brokerage_name', e.target.value)}
                    placeholder="Coldwell Banker Premier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerage_email">Office Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="brokerage_email"
                      type="email"
                      value={formData.brokerage_email || ''}
                      onChange={(e) => handleInputChange('brokerage_email', e.target.value)}
                      placeholder="office@brokerage.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerage_phone">Office Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="brokerage_phone"
                      value={formData.brokerage_phone || ''}
                      onChange={(e) => handleInputChange('brokerage_phone', e.target.value)}
                      placeholder="(555) 987-6543"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerage_address">Office Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="brokerage_address"
                      value={formData.brokerage_address || ''}
                      onChange={(e) => handleInputChange('brokerage_address', e.target.value)}
                      placeholder="123 Main St, Suite 100, City, State"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Social Media & Website
              </CardTitle>
              <CardDescription>Connect with clients on social media</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url || ''}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/yourprofile"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="facebook_url"
                      value={formData.facebook_url || ''}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url">X (Twitter)</Label>
                  <div className="relative">
                    <XIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="twitter_url"
                      value={formData.twitter_url || ''}
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      placeholder="https://x.com/yourhandle"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="youtube_url"
                      value={formData.youtube_url || ''}
                      onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Personal Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website_url"
                      value={formData.website_url || ''}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
