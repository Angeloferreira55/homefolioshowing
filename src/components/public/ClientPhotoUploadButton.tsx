import { useState, useRef } from 'react';
import { Camera, Loader2, Send, X } from 'lucide-react';
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
    setCaption('');
  };

  const cancelUpload = () => {
    setPendingFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('token', shareToken);
      formData.append('propertyId', propertyId);
      formData.append('photo', pendingFile);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

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
        caption: caption.trim() || null,
        created_at: new Date().toISOString(),
      });
      toast.success('Photo uploaded!');
      cancelUpload();

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

      {pendingFile && preview ? (
        <div className="flex items-center gap-2 print:hidden">
          <img src={preview} alt="Preview" className="w-10 h-10 rounded object-cover border" />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={100}
            className="flex-1 text-xs border rounded px-2 py-1.5 bg-background min-w-0"
            onKeyDown={(e) => { if (e.key === 'Enter') confirmUpload(); }}
          />
          <button
            onClick={confirmUpload}
            disabled={uploading}
            className="text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
          <button
            onClick={cancelUpload}
            disabled={uploading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
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
      )}
    </>
  );
}
