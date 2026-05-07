import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiEdit2, FiGrid, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDataStore } from '../../stores/dataStore';
import { slugify } from '../../lib/utils';
import { ImageInput } from '../../components/ui/ImageInput';
import { PageHeader } from '../../components/admin/PageHeader';

export function AdminCategories() {
  const categories = useDataStore((s) => s.categories);
  const products = useDataStore((s) => s.products);
  const addCategory = useDataStore((s) => s.addCategory);
  const updateCategory = useDataStore((s) => s.updateCategory);
  const removeCategory = useDataStore((s) => s.removeCategory);

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [image, setImage] = useState('');
  const [icon, setIcon] = useState('');
  const [advanceCharge, setAdvanceCharge] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) return toast.error('Name required');
    const advance = advanceCharge.trim() === '' ? undefined : Math.max(0, Number(advanceCharge) || 0);
    // We persist empty strings (rather than `undefined`) so that clearing
    // the image / icon actually overwrites the old Firestore value. Setting
    // a field to `undefined` makes Firestore silently drop the patch and
    // keep the previous image — which is the bug the admin reported.
    const payload = {
      name: name.trim(),
      nameBn: nameBn.trim() || undefined,
      image: image.trim(),
      icon: icon.trim(),
      slug: slugify(name),
      advanceDeliveryCharge: advance,
    };
    if (editing) {
      updateCategory(editing, payload);
      toast.success('Category updated');
    } else {
      addCategory({ id: `cat-${Date.now()}`, ...payload });
      toast.success('Category created');
    }
    setName('');
    setNameBn('');
    setImage('');
    setIcon('');
    setAdvanceCharge('');
    setEditing(null);
  }

  return (
    <>
      <Helmet><title>Categories — Admin</title></Helmet>
      <PageHeader
        icon={<FiGrid />}
        title="Categories"
        subtitle={`${categories.length} categories`}
        accent="sky"
      />

      <div className="card mt-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Name (English)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="নাম (বাংলা)" value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
          <div className="sm:col-span-2">
            <label className="label mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Image (upload or paste URL)
            </label>
            <ImageInput value={image} onChange={setImage} folder="categories" />
            <p className="mt-1 text-[11px] text-slate-500">
              Shown on the home category strip. When set, the image takes
              priority over the icon below.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Icon (emoji)
            </label>
            <input
              className="input"
              placeholder="e.g. 🍯, 🥭, 🌶️"
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 4))}
              maxLength={4}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Optional fallback shown when no image is uploaded. Paste any
              emoji from your keyboard. Leave empty to use the bundled
              default for this category.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Advance delivery charge (BDT, optional)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={advanceCharge}
              onChange={(e) => setAdvanceCharge(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Customer pays this upfront via bKash/Nagad before the order is
              confirmed; the rest is COD. Per-product override on the product
              form takes priority over this category default.
            </p>
          </div>
          <button onClick={submit} className="btn-primary sm:col-span-2 sm:justify-self-end">
            <FiPlus className="h-4 w-4" />
            {editing ? 'Update' : 'Add'}
          </button>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = products.filter((p) => p.categoryIds.includes(c.id)).length;
          return (
            <li key={c.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                {c.image ? (
                  <img src={c.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : c.icon ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-soft text-2xl">
                    {c.icon}
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gradient-soft" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.nameBn || '—'} · {count} items</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditing(c.id);
                      setName(c.name);
                      setNameBn(c.nameBn || '');
                      setImage(c.image || '');
                      setIcon(c.icon || '');
                      setAdvanceCharge(
                        typeof c.advanceDeliveryCharge === 'number' ? String(c.advanceDeliveryCharge) : '',
                      );
                    }}
                    className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (count > 0) return toast.error('Remove products from this category first');
                      if (confirm(`Delete "${c.name}"?`)) {
                        removeCategory(c.id);
                        toast.success('Deleted');
                      }
                    }}
                    className="rounded-lg p-1.5 text-accent-500 hover:bg-accent-500/10"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
