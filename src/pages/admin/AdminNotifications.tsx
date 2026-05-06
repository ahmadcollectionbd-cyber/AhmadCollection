import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { FiBell, FiEdit2, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import { useDataStore } from '../../stores/dataStore';
import { formatDateTime } from '../../lib/utils';
import type { Announcement } from '../../types';
import { PageHeader } from '../../components/admin/PageHeader';

const newId = () => `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function AdminNotifications() {
  const announcements = useDataStore((s) => s.announcements);
  const addAnnouncement = useDataStore((s) => s.addAnnouncement);
  const updateAnnouncement = useDataStore((s) => s.updateAnnouncement);
  const removeAnnouncement = useDataStore((s) => s.removeAnnouncement);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [href, setHref] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...announcements].sort((a, b) => b.createdAt - a.createdAt),
    [announcements],
  );

  function clearForm() {
    setEditingId(null);
    setTitle('');
    setBody('');
    setHref('');
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body ?? '');
    setHref(a.href ?? '');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title: title.trim(),
          body: body.trim() || undefined,
          href: href.trim() || undefined,
        });
        toast.success('Notification updated');
      } else {
        const a: Announcement = {
          id: newId(),
          title: title.trim(),
          body: body.trim() || undefined,
          href: href.trim() || undefined,
          active: true,
          createdAt: Date.now(),
        };
        await addAnnouncement(a);
        toast.success('Notification published to all users');
      }
      clearForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(a: Announcement) {
    await updateAnnouncement(a.id, { active: !a.active });
    toast.success(a.active ? 'Hidden from users' : 'Visible to users');
  }

  async function onDelete(a: Announcement) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    await removeAnnouncement(a.id);
    toast.success('Deleted');
  }

  return (
    <>
      <Helmet><title>Notifications — Admin</title></Helmet>
      <PageHeader
        icon={<FiBell />}
        title="Notifications"
        subtitle="Push announcements to every shopper's bell dropdown in realtime."
        accent="amber"
      />

      <form onSubmit={onPublish} className="card mt-6 grid gap-3 p-5">
        {editingId && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 px-3 py-2 text-xs text-brand-700 dark:text-brand-300">
            <span className="font-semibold">
              Editing notification — changes will be saved to the existing entry.
            </span>
            <button
              type="button"
              onClick={clearForm}
              className="text-[11px] underline-offset-2 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <div>
          <label className="label">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Eid sale starts tomorrow"
            className="input mt-1"
            maxLength={120}
          />
        </div>
        <div>
          <label className="label">Body (optional)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Up to 30% off on premium dates and attar collection."
            className="input mt-1 min-h-[80px]"
            maxLength={400}
          />
        </div>
        <div>
          <label className="label">Link (optional)</label>
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/shop?cat=dates"
            className="input mt-1"
          />
          <p className="mt-1 text-xs text-slate-500">
            Where customers go when they tap the notification. Use a relative
            path like <code className="font-mono">/shop</code> or a full URL.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              className="btn-outline text-xs"
            >
              <FiX className="h-3.5 w-3.5" />
              Cancel edit
            </button>
          )}
          <button type="submit" disabled={busy} className="btn-primary text-xs">
            {editingId ? <FiSave className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
            {busy
              ? editingId
                ? 'Saving…'
                : 'Publishing…'
              : editingId
                ? 'Save changes'
                : 'Publish to all users'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="heading text-lg font-bold">Published ({sorted.length})</h2>
        {sorted.length === 0 ? (
          <div className="card mt-3 p-10 text-center text-sm text-slate-500">
            No announcements yet. Compose one above to get started.
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {sorted.map((a) => (
              <li key={a.id} className="card flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.title}</span>
                    {!a.active && <span className="badge text-[10px]">Hidden</span>}
                  </div>
                  {a.body && <p className="mt-1 text-sm text-slate-500">{a.body}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Posted {formatDateTime(a.createdAt)}</span>
                    {a.href && <span>· goes to <code className="font-mono">{a.href}</code></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className={
                      'btn-outline text-xs ' +
                      (editingId === a.id ? '!border-brand-500 !text-brand-600' : '')
                    }
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                    {editingId === a.id ? 'Editing' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(a)}
                    className="btn-outline text-xs"
                  >
                    {a.active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(a)}
                    className="btn-outline text-xs text-accent-600"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
