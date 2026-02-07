import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logNetworkError, logAuthError } from '@/lib/errorLogger';
import { calculateBackoff, sleep, isRetryableError } from '@/lib/networkRetry';

interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  maxRetries?: number;
  timeoutMs?: number;
  onProgress?: (percent: number) => void;
}

interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async ({
    bucket,
    path,
    file,
    maxRetries = 2,
    timeoutMs = 60000,
    onProgress,
  }: UploadOptions): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);

    const updateProgress = (percent: number) => {
      setProgress(percent);
      onProgress?.(percent);
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get fresh session for each attempt
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          const authError = new Error('Please sign in to upload files');
          logAuthError(authError, { component: 'useFileUpload', action: 'getSession' });
          throw authError;
        }

        const accessToken = sessionData.session.access_token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        if (attempt > 0) {
          // Wait before retry with exponential backoff
          const delay = calculateBackoff(attempt - 1, 1000, 10000);
          await sleep(delay);
          updateProgress(0);
        }

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Set timeout
          xhr.timeout = timeoutMs;

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              updateProgress(percent);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let errorMessage = 'Upload failed';
              try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || response.message || errorMessage;
              } catch {
                // Use default error message
              }
              reject(new Error(`${errorMessage} (${xhr.status})`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
          xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

          xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          xhr.setRequestHeader('x-upsert', 'true');
          xhr.send(file);
        });

        setUploading(false);
        return { success: true, path };
      } catch (error: any) {
        lastError = error;
        
        const willRetry = attempt < maxRetries && isRetryableError(error);
        
        logNetworkError(error, {
          component: 'useFileUpload',
          action: 'upload',
          attempt: attempt + 1,
          maxAttempts: maxRetries + 1,
          willRetry,
          url: `${bucket}/${path}`,
          method: 'POST',
        });
        
        // Don't retry on auth errors
        if (error.message.includes('sign in') || error.message.includes('401')) {
          break;
        }

        // Don't retry on non-retryable errors
        if (!willRetry) {
          break;
        }
      }
    }

    setUploading(false);
    setProgress(0);
    
    return { 
      success: false, 
      error: lastError?.message || 'Upload failed after multiple attempts'
    };
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
  }, []);

  return { upload, uploading, progress, reset };
};
