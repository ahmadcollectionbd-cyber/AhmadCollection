import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadProductImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured');
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `public/products/${Date.now()}-${safeName}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type || 'image/*' });
  return getDownloadURL(ref);
}

export async function uploadBannerImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured');
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `public/banners/${Date.now()}-${safeName}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type || 'image/*' });
  return getDownloadURL(ref);
}

export async function uploadCategoryImage(file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not configured');
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `public/categories/${Date.now()}-${safeName}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type || 'image/*' });
  return getDownloadURL(ref);
}
