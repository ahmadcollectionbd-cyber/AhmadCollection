import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiArrowDown, FiArrowUp, FiEdit2, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDataStore } from '../../stores/dataStore';
import { uploadBannerImage } from '../../lib/upload';
import type { Banner, ImagePosition } from '../../types';

const IMAGE_POSITIONS: ImagePosition[] = [
  'top',
  'center',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

const blankBanner = (): Banner => ({
  id: `b-${Date.now()}`,
  title: '',
  subtitle: '',
  image: '',
  imagePosition: 'top',
  fitMode: 'split',
  ctaLabel: '',
  ctaHref: '',
  active: true,
  order: 0,
});

export function AdminBanners() {
  const banners = useDataStore((s) => s.banners);
  const addBanner = useDataStore((s) => s.addBanner);
  const updateBanner = useDataStore((s) => s.updateBanner);
  const removeBanner = useDataStore((s) => s.removeBanner);

  const [editing, setEditing] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  function startNew() {
    setEditing(blankBanner());
  }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error('Title required');
    if (!editing.image.trim()) return toast.error('Image required (upload or paste URL)');
    setBusy(true);
    try {
      const exists = banners.find((b) => b.id === editing.id);
      if (exists) {
        await updateBanner(editing.id, editing);
        toast.success('Banner updated');
      } else {
        await addBanner({
          ...editing,
          order: editing.order ?? banners.length + 1,
        });
        toast.success('Banner added');
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File) {
    if (!editing) return;
    setBusy(true);
    try {
      const url = await uploadBannerImage(file);
      setEditing({ ...editing, image: url });
      toast.success('Uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function move(b: Banner, dir: -1 | 1) {
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    const a = b.order ?? idx + 1;
    const c = swap.order ?? idx + 1 + dir;
    await Promise.all([
      updateBanner(b.id, { order: c }),
      updateBanner(swap.id, { order: a }),
    ]);
  }

  async function remove(id: string) {
    if (!confirm('Delete this banner?')) return;
    await removeBanner(id);
    toast.success('Deleted');
  }

  async function toggleActive(b: Banner) {
    await updateBanner(b.id, { active: !b.active });
  }

  return (
    <>
      <Helmet><title>Banners — Admin</title></Helmet>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading text-2xl font-extrabold">Hero Banners / Slides</h1>
          <p className="text-sm text-slate-500">{banners.length} slides</p>
        </div>
        <button onClick={startNew} className="btn-primary text-xs">
          <FiPlus className="h-4 w-4" />
          New banner
        </button>
      </div>

      {editing && (
        <div className="card mt-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">
              {banners.find((b) => b.id === editing.id) ? 'Edit slide' : 'New slide'}
            </h2>
            <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Title</span>
              <input
                className="input mt-1"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="খাঁটি সরিষার তেল"
              />
            </label>
            <label className="block">
              <span className="label">Subtitle</span>
              <input
                className="input mt-1"
                value={editing.subtitle ?? ''}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="Cold-pressed, no preservatives"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="label">Image (upload or paste URL)</span>
              <div className="mt-1 flex gap-2">
                <input
                  className="input flex-1"
                  value={editing.image}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="https://… or /banners/…"
                />
                <label className="btn-outline text-xs">
                  <FiUpload className="h-4 w-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {editing.image && (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                  {(editing.fitMode ?? 'split') === 'split' ? (
                    <div className="grid items-center gap-3 p-3 md:grid-cols-2 md:gap-5">
                      <div className="order-2 text-center md:order-1 md:text-left">
                        <div className="font-bn text-base font-bold leading-tight text-slate-900 dark:text-white">
                          {editing.title || 'Title preview'}
                        </div>
                        {editing.subtitle && (
                          <div className="font-bn mt-1 text-xs text-slate-500">{editing.subtitle}</div>
                        )}
                        {editing.ctaLabel && (
                          <div className="mt-2 inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold text-white">
                            {editing.ctaLabel}
                          </div>
                        )}
                      </div>
                      <img
                        src={editing.image}
                        alt=""
                        className="order-1 mx-auto block max-h-[200px] w-full rounded-lg object-contain md:order-2"
                      />
                    </div>
                  ) : (editing.fitMode ?? 'split') === 'contain' ? (
                    <img
                      src={editing.image}
                      alt=""
                      className="mx-auto block max-h-[60vh] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={editing.image}
                      alt=""
                      className="aspect-[16/7] w-full object-cover"
                      style={{
                        objectPosition: (editing.imagePosition ?? 'top').replace('-', ' '),
                      }}
                    />
                  )}
                </div>
              )}
            </label>

            <label className="block sm:col-span-2">
              <span className="label">Image fit</span>
              <select
                className="input mt-1"
                value={editing.fitMode ?? 'split'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    fitMode: e.target.value as 'split' | 'contain' | 'cover',
                  })
                }
              >
                <option value="split">Split (image + text side-by-side) — recommended</option>
                <option value="contain">Image only (full artwork, no overlay)</option>
                <option value="cover">Background photo with text overlaid (may crop)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                <strong>Split</strong> shows the full image on one side and your title /
                subtitle / button on the other — best for product photos.
                <strong className="ml-1">Image only</strong> is for fully-composed artwork
                that already has text baked into the picture (no overlay added).
                <strong className="ml-1">Background</strong> stretches the photo to fill the
                slot and overlays the bengali copy on top — may crop.
              </p>
            </label>

            {(editing.fitMode ?? 'split') === 'cover' && (
              <label className="block sm:col-span-2">
                <span className="label">Image focus point (only for &ldquo;Fill slot&rdquo;)</span>
                <select
                  className="input mt-1"
                  value={editing.imagePosition ?? 'top'}
                  onChange={(e) =>
                    setEditing({ ...editing, imagePosition: e.target.value as ImagePosition })
                  }
                >
                  {IMAGE_POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Controls which part of the image stays visible after cropping. Use
                  <code className="mx-1 rounded bg-slate-100 px-1">top</code> for portraits so
                  heads are preserved.
                </p>
              </label>
            )}

            <label className="block">
              <span className="label">Button label</span>
              <input
                className="input mt-1"
                value={editing.ctaLabel ?? ''}
                onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
                placeholder="Shop now"
              />
            </label>
            <label className="block">
              <span className="label">Button link</span>
              <input
                className="input mt-1"
                value={editing.ctaHref ?? ''}
                onChange={(e) => setEditing({ ...editing, ctaHref: e.target.value })}
                placeholder="/shop or /shop?cat=mango"
              />
            </label>

            <label className="block">
              <span className="label">Order (lower = first)</span>
              <input
                type="number"
                className="input mt-1"
                value={editing.order ?? 0}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-end gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>Active (visible on the homepage slider)</span>
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-outline text-xs">Cancel</button>
            <button onClick={save} disabled={busy} className="btn-primary text-xs">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {sorted.map((b, i) => (
          <li key={b.id} className="card overflow-hidden">
            <div className="relative">
              {b.image ? (
                (b.fitMode ?? 'split') === 'cover' ? (
                  <img
                    src={b.image}
                    alt={b.title}
                    className="aspect-[16/7] w-full object-cover"
                    style={{
                      objectPosition: (b.imagePosition ?? 'top').replace('-', ' '),
                    }}
                  />
                ) : (
                  <div className="flex w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="max-h-[200px] w-full object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="aspect-[16/7] w-full bg-gradient-soft" />
              )}
              <span
                className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  b.active ? 'bg-emerald-500 text-white' : 'bg-slate-500/80 text-white'
                }`}
              >
                {b.active ? 'Active' : 'Hidden'}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                #{b.order ?? i + 1}
              </span>
            </div>
            <div className="p-4">
              <div className="font-semibold">{b.title}</div>
              {b.subtitle && <div className="text-xs text-slate-500">{b.subtitle}</div>}
              {b.ctaHref && (
                <div className="mt-1 text-[11px] text-slate-500">
                  CTA: <span className="font-mono">{b.ctaLabel || 'Open'}</span> → <span className="font-mono">{b.ctaHref}</span>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                <button onClick={() => move(b, -1)} disabled={i === 0} className="btn-outline text-xs disabled:opacity-40">
                  <FiArrowUp className="h-3.5 w-3.5" /> Up
                </button>
                <button onClick={() => move(b, 1)} disabled={i === sorted.length - 1} className="btn-outline text-xs disabled:opacity-40">
                  <FiArrowDown className="h-3.5 w-3.5" /> Down
                </button>
                <button onClick={() => toggleActive(b)} className="btn-outline text-xs">
                  {b.active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => setEditing({ ...b })} className="btn-outline text-xs">
                  <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => remove(b.id)} className="btn-outline text-xs !border-accent-200 !text-accent-600">
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="col-span-full text-center text-sm text-slate-500">No banners yet — click <em>New banner</em>.</li>
        )}
      </ul>
    </>
  );
}
