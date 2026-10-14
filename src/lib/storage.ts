import { storage, isFirebaseConfigured } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import type { UploadProgress } from '@/types';

export const storageUtils = {
  async uploadImage(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    if (!isFirebaseConfigured) {
      onProgress?.({
        fileId: path,
        fileName: file.name,
        progress: 100,
        status: 'complete',
      });
      return URL.createObjectURL(file);
    }

    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=31536000',
      });

      return await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({
              fileId: path,
              fileName: file.name,
              progress,
              status: 'uploading',
            });
          },
          (error) => {
            onProgress?.({
              fileId: path,
              fileName: file.name,
              progress: 0,
              status: 'error',
              error: error.message,
            });
            // Fallback to object URL on storage failure
            resolve(URL.createObjectURL(file));
          },
          async () => {
            onProgress?.({
              fileId: path,
              fileName: file.name,
              progress: 100,
              status: 'processing',
            });
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onProgress?.({
                fileId: path,
                fileName: file.name,
                progress: 100,
                status: 'complete',
              });
              resolve(downloadURL);
            } catch {
              resolve(URL.createObjectURL(file));
            }
          }
        );
      });
    } catch {
      return URL.createObjectURL(file);
    }
  },

  async deleteImage(path: string): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch {
      // Ignored
    }
  },

  async deleteTourImages(tourId: string): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      const tourRef = ref(storage, `tours/${tourId}`);
      const result = await listAll(tourRef);
      const deletePromises = result.items.map((item) => deleteObject(item));
      await Promise.all(deletePromises);
    } catch {
      // Ignored
    }
  },

  generateTourImagePath(tourId: string, sceneId: string, fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    return `tours/${tourId}/scenes/${sceneId}/original.${ext}`;
  },

  generateTourThumbnailPath(tourId: string, sceneId: string): string {
    return `tours/${tourId}/scenes/${sceneId}/thumbnail.webp`;
  },

  generateTourCoverPath(tourId: string, fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    return `tours/${tourId}/cover.${ext}`;
  },

  getPublicUrl(path: string): string {
    if (!isFirebaseConfigured) return path;
    return `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
  },
};

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type. Please use JPEG, PNG, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit.' };
  }

  return { valid: true };
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function isValidPanorama(width: number, height: number): { valid: boolean; warning?: string } {
  const aspectRatio = width / height;
  const minRatio = 1.8;
  const maxRatio = 2.2;
  const idealRatio = 2.0;

  if (aspectRatio < minRatio || aspectRatio > maxRatio) {
    return {
      valid: false,
      warning: `Image aspect ratio (${aspectRatio.toFixed(2)}:1) is not ideal for 360° panoramas. Expected ~2:1 (equirectangular).`,
    };
  }

  if (Math.abs(aspectRatio - idealRatio) > 0.1) {
    return {
      valid: true,
      warning: `Image aspect ratio (${aspectRatio.toFixed(2)}:1) differs from ideal 2:1. May not display correctly as a full 360° panorama.`,
    };
  }

  return { valid: true };
}

export async function generateThumbnail(
  file: File,
  maxWidth: number = 400,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxWidth / img.naturalWidth, 1);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate thumbnail'));
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail'));
    };
    img.src = url;
  });
}