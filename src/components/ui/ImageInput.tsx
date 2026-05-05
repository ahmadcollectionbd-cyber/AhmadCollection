import { useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

type Folder = 'products' | 'banners' | 'categories' | 'settings' | 'misc';

/**
 * Single-image input that accepts either a pasted URL or a direct file
 * upload. Used throughout the admin panel so every image field looks and
 * behaves the same — set once in `lib/upload.ts` and the compression /
 * Firebase Storage path is shared.
 */
export function ImageInput({
  value,
  onChange,
  folder = 'misc',
  placeholder = 'https://… or paste image URL',
  preview = true,
  previewClassName,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: Folder;
  placeholder?: string;
  preview?: boolean;
  previewClassName?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      // Lazy-load the upload helper so the customer-facing bundle never
      // pulls in firebase/storage.
      const mod = await import('../../lib/upload');
      const url = await mod.uploadAnyImage(file, folder);
      onChange(url);
      toast.success('Uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          className="input flex-1 min-w-[140px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <label
          className={`btn-outline cursor-pointer text-xs ${busy ? 'pointer-events-none opacity-60' : ''}`}
        >
          <FiUpload className="h-4 w-4" />
          {busy ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {preview && value && (
        <div
          className={`mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900 ${previewClassName ?? ''}`}
        >
          <img
            src={value}
            alt=""
            className="block h-auto max-h-40 w-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}
