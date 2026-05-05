/**
 * ImgBB image upload — free hosting for product / banner / category images.
 *
 * Why ImgBB:
 *  - 100% free, no monthly cap, 32MB max per image
 *  - Direct browser upload (no backend / serverless function required)
 *  - Returns a permanent CDN URL, ready to drop into Firestore
 *
 * Used as an alternative to Firebase Storage when the project is on the
 * free Spark plan (which blocks Storage). The admin pastes a free API
 * key from https://api.imgbb.com into /admin/settings, and uploads
 * automatically route to ImgBB instead of Firebase Storage.
 */

const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

interface ImgBBResponse {
  data?: {
    url?: string;
    display_url?: string;
    image?: { url?: string };
  };
  success?: boolean;
  error?: { message?: string } | string;
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      // FileReader returns "data:<mime>;base64,<payload>" — ImgBB only wants
      // the payload, so strip the prefix.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadToImgBB(file: Blob, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('ImgBB API key not set. Configure it in admin settings.');
  }
  const base64 = await fileToBase64(file);
  const form = new FormData();
  form.append('image', base64);

  const url = `${IMGBB_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: 'POST', body: form });
  let body: ImgBBResponse;
  try {
    body = (await res.json()) as ImgBBResponse;
  } catch {
    throw new Error(`ImgBB returned non-JSON response (${res.status})`);
  }
  if (!res.ok || !body.success) {
    const message =
      typeof body.error === 'string'
        ? body.error
        : body.error?.message || `ImgBB upload failed (${res.status})`;
    throw new Error(message);
  }
  const finalUrl =
    body.data?.display_url || body.data?.url || body.data?.image?.url;
  if (!finalUrl) {
    throw new Error('ImgBB response missing image URL');
  }
  return finalUrl;
}
