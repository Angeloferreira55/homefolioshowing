import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ClientPhotoUploadButtonProps {
  propertyId: string;
  shareToken: string;
  sessionId: string;
  propertyAddress: string;
  onPhotoUploaded: (photo: { id: string; file_url: string; caption: string | null; created_at: string }) => void;
}

export function ClientPhotoUploadButton({ propertyId, shareToken, sessionId, propertyAddress, onPhotoUploaded }: ClientPhotoUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('token', shareToken);
      formData.append('propertyId', propertyId);
      formData.append('photo', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-client-photo`,
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
      onPhotoUploaded({
        id: result.photoId,
        file_url: result.publicUrl,
        caption: null,
        created_at: new Date().toISOString(),
      });
      toast.success('Photo uploaded!');

      // Notify agent (fire and forget)
      supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'client_photo_uploaded',
          sessionId,
          shareToken,
          propertyAddress,
        },
      });
    } catch (error: any) {
      console.error('Client photo upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 print:hidden"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
        <span>{uploading ? 'Uploading...' : 'Add Photo'}</span>
      </button>
    </>
  );
}
