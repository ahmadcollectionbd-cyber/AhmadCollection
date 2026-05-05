import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error('Canvas not supported'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          },
          'image/webp',
          quality,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

async function uploadToStorage(file: File, folder: string): Promise<string> {
  if (!storage) {
    throw new Error(
      'Firebase Storage is not configured. Please paste an image URL instead, or set up Firebase Storage in your project.',
    );
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `public/${folder}/${Date.now()}-${safeName}`;
  const sRef = storageRef(storage, path);

  try {
    const compressed = await compressImage(file);
    await uploadBytes(sRef, compressed, { contentType: 'image/webp' });
  } catch {
    await uploadBytes(sRef, file, { contentType: file.type || 'image/*' });
  }

  return getDownloadURL(sRef);
}

export async function uploadProductImage(file: File): Promise<string> {
  return uploadToStorage(file, 'products');
}

export async function uploadBannerImage(file: File): Promise<string> {
  return uploadToStorage(file, 'banners');
}

export async function uploadCategoryImage(file: File): Promise<string> {
  return uploadToStorage(file, 'categories');
}

/** Generic upload used by the reusable `<ImageInput />` component. */
export async function uploadAnyImage(
  file: File,
  folder: 'products' | 'banners' | 'categories' | 'settings' | 'misc' = 'misc',
): Promise<string> {
  return uploadToStorage(file, folder);
}
