/**
 * File optimization utilities for faster uploads
 */

interface CompressionOptions {
  maxSizeMB?: number;
  quality?: number;
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxSizeMB = 5, quality = 0.8 } = options;

  // Skip if already small enough
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions (maintain aspect ratio)
        let { width, height } = img;
        const maxDimension = 2048; // Max width/height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimize file before upload
 */
export async function optimizeFileForUpload(file: File): Promise<File> {
  const fileType = file.type;

  // Compress images
  if (fileType.startsWith('image/')) {
    try {
      return await compressImage(file);
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      return file;
    }
  }

  // For PDFs, return as-is (PDF compression is complex and risky)
  return file;
}

/**
 * Calculate optimal chunk size based on file size
 */
export function getOptimalChunkSize(fileSize: number): number {
  if (fileSize < 1024 * 1024) {
    // < 1MB: don't chunk
    return fileSize;
  } else if (fileSize < 10 * 1024 * 1024) {
    // 1-10MB: 512KB chunks
    return 512 * 1024;
  } else {
    // > 10MB: 1MB chunks
    return 1024 * 1024;
  }
}

/**
 * Adaptive polling delay based on attempt number
 */
export function getAdaptivePollingDelay(attemptNumber: number): number {
  // Start fast, then slow down
  // Attempt 1-2: 1 second
  // Attempt 3-5: 2 seconds
  // Attempt 6-10: 3 seconds
  // Attempt 11+: 5 seconds

  if (attemptNumber <= 2) return 1000;
  if (attemptNumber <= 5) return 2000;
  if (attemptNumber <= 10) return 3000;
  return 5000;
}

/**
 * Split array into batches for parallel processing
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
