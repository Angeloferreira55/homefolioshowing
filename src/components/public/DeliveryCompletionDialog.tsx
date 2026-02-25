import { useState, useRef } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Camera, X, Package } from 'lucide-react';

interface DeliveryCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyAddress: string;
  shareToken: string;
  onCompleted: () => void;
}

const DeliveryCompletionDialog = ({
  open,
  onOpenChange,
  propertyId,
  propertyAddress,
  shareToken,
  onCompleted,
}: DeliveryCompletionDialogProps) => {
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setNotes('');
    clearPhoto();
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      let deliveryPhotoUrl: string | null = null;

      // Upload photo if selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('token', shareToken);
        formData.append('propertyId', propertyId);
        formData.append('photo', photoFile);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-delivery-photo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to upload photo');
        }

        const result = await response.json();
        deliveryPhotoUrl = result.publicUrl;
      }

      // Mark delivery as completed via RPC
      const { error } = await supabase.rpc('submit_delivery_completion' as any, {
        p_session_property_id: propertyId,
        p_share_token: shareToken,
        p_delivery_notes: notes.trim() || null,
        p_delivery_photo_url: deliveryPhotoUrl,
      });

      if (error) throw error;

      toast.success('Delivery confirmed!');
      resetForm();
      onOpenChange(false);
      onCompleted();
    } catch (error: any) {
      console.error('Delivery completion error:', error);
      toast.error(error.message || 'Failed to confirm delivery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-display text-xl">
            Confirm Delivery
          </ResponsiveDialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {propertyAddress}
          </p>
        </ResponsiveDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Optional notes */}
          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Notes (optional)</Label>
            <Textarea
              id="delivery-notes"
              placeholder="Left at front door, handed to homeowner..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Optional photo */}
          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={photoPreview}
                  alt="Delivery photo"
                  className="w-full h-40 object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearPhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Take or upload a photo
                </span>
              </button>
            )}
          </div>

          {/* Confirm button */}
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full h-12 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {photoFile ? 'Uploading...' : 'Confirming...'}
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Confirm Delivery
              </>
            )}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default DeliveryCompletionDialog;
