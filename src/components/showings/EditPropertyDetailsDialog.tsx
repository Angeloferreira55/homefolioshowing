import { useState, useEffect, useRef } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, Home, MessageSquare, ImagePlus, X, Upload, ClipboardList, MapPin, User, Tag, Plus } from 'lucide-react';

const PREDEFINED_TAGS = ['Past Client', 'Sphere', 'Neighbor', 'Lead', 'VIP', 'Family'];
const TAG_COLORS: Record<string, string> = {
  'Past Client': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Sphere': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Neighbor': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Lead': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'VIP': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Family': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};
const DEFAULT_TAG_COLOR = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

interface EditPropertyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
  onSaved?: () => void;
  isPopBy?: boolean;
}

const EditPropertyDetailsDialog = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
  onSaved,
  isPopBy = false,
}: EditPropertyDetailsDialogProps) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && propertyId) {
      fetchPropertyDetails();
    }
    // Reset photo state when dialog closes
    if (!open) {
      setNewPhotoFile(null);
      setNewPhotoPreview(null);
    }
  }, [open, propertyId]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_properties')
        .select('address, city, state, zip_code, summary, description, agent_notes, photo_url, recipient_name, category_tags')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      setAddress(data?.address || '');
      setCity(data?.city || '');
      setState(data?.state || '');
      setZipCode(data?.zip_code || '');
      setSummary(data?.summary || '');
      setDescription(data?.description || '');
      setAgentNotes(data?.agent_notes || '');
      setRecipientName(data?.recipient_name || '');
      setCategoryTags(data?.category_tags || []);
      setCurrentPhotoUrl(data?.photo_url || null);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setNewPhotoFile(file);
    setNewPhotoPreview(URL.createObjectURL(file));
  };

  const clearNewPhoto = () => {
    setNewPhotoFile(null);
    if (newPhotoPreview) {
      URL.revokeObjectURL(newPhotoPreview);
      setNewPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!newPhotoFile) return currentPhotoUrl;

    setUploadingPhoto(true);
    try {
      const fileExt = newPhotoFile.name.split('.').pop();
      const fileName = `${propertyId}-${Date.now()}.${fileExt}`;
      const filePath = `${propertyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, newPhotoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload new photo if selected
      let photoUrl = currentPhotoUrl;
      if (newPhotoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('session_properties')
        .update({
          address: address.trim(),
          city: city.trim() || null,
          state: state.trim() || null,
          zip_code: zipCode.trim() || null,
          summary: summary.trim() || null,
          description: description.trim() || null,
          agent_notes: agentNotes.trim() || null,
          recipient_name: recipientName.trim() || null,
          category_tags: categoryTags,
          photo_url: photoUrl,
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Property details saved!');
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving property details:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const displayPhoto = newPhotoPreview || currentPhotoUrl;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-display text-xl">
            Edit Property Details
          </ResponsiveDialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {propertyAddress}
          </p>
        </ResponsiveDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Recipient Name — Pop-By only */}
            {isPopBy && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Recipient Name
              </Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="John & Jane Smith"
              />
              <p className="text-xs text-muted-foreground">
                Who lives at this address. Shown on the delivery card.
              </p>
            </div>
            )}

            {/* Address Fields */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Address
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  maxLength={2}
                />
                <Input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="ZIP"
                />
              </div>
            </div>

            {/* Property Photo — hidden for Pop-By */}
            {!isPopBy && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-primary" />
                Property Photo
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {displayPhoto ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={displayPhoto}
                    alt="Property"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    {newPhotoPreview && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={clearNewPhoto}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {newPhotoPreview && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                        New photo selected
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload photo</span>
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                Main photo shown on property cards. Max 5MB.
              </p>
            </div>
            )}

            {/* Summary — hidden for Pop-By */}
            {!isPopBy && (
            <div className="space-y-2">
              <Label htmlFor="summary" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Summary
              </Label>
              <Textarea
                id="summary"
                placeholder="Brief highlights of this property..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                A short summary shown at the top of the property detail.
              </p>
            </div>
            )}

            {/* About This Home — hidden for Pop-By */}
            {!isPopBy && (
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                About This Home
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the property, neighborhood, features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Full property description your client will see.
              </p>
            </div>
            )}

            {/* Delivery Notes (Pop-By) / Agent's Notes (Home Folio) */}
            <div className="space-y-2">
              <Label htmlFor="agentNotes" className="flex items-center gap-2">
                {isPopBy ? (
                  <ClipboardList className="w-4 h-4 text-primary" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-primary" />
                )}
                {isPopBy ? 'Delivery Notes' : "Agent's Notes"}
              </Label>
              <Textarea
                id="agentNotes"
                placeholder={isPopBy
                  ? "Gate code, delivery instructions, where to leave items..."
                  : "Your personal notes for the client about this property..."}
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {isPopBy
                  ? 'Instructions visible to the delivery person on the shared link.'
                  : 'Personal notes highlighted for your client.'}
              </p>
            </div>

            {/* Category Tags — Pop-By only */}
            {isPopBy && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Category Tags
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PREDEFINED_TAGS.map((tag) => {
                  const isActive = categoryTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setCategoryTags(isActive
                          ? categoryTags.filter(t => t !== tag)
                          : [...categoryTags, tag]
                        );
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                        isActive
                          ? TAG_COLORS[tag] || DEFAULT_TAG_COLOR
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      } ${isActive ? 'ring-1 ring-current/20' : ''}`}
                    >
                      {tag}
                    </button>
                  );
                })}
                {categoryTags
                  .filter(t => !PREDEFINED_TAGS.includes(t))
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCategoryTags(categoryTags.filter(t => t !== tag))}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${DEFAULT_TAG_COLOR} ring-1 ring-current/20 flex items-center gap-1`}
                    >
                      {tag}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom tag..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = customTag.trim();
                      if (tag && !categoryTags.includes(tag)) {
                        setCategoryTags([...categoryTags, tag]);
                        setCustomTag('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    const tag = customTag.trim();
                    if (tag && !categoryTags.includes(tag)) {
                      setCategoryTags([...categoryTags, tag]);
                      setCustomTag('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || uploadingPhoto}
              className="w-full h-12"
            >
              {saving || uploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {uploadingPhoto ? 'Uploading photo...' : 'Saving...'}
                </>
              ) : (
                'Save Details'
              )}
            </Button>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default EditPropertyDetailsDialog;
