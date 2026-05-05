import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDataStore } from '../../stores/dataStore';
import { slugify } from '../../lib/utils';
import { ImageInput } from '../../components/ui/ImageInput';

export function AdminCategories() {
  const categories = useDataStore((s) => s.categories);
  const products = useDataStore((s) => s.products);
  const addCategory = useDataStore((s) => s.addCategory);
  const updateCategory = useDataStore((s) => s.updateCategory);
  const removeCategory = useDataStore((s) => s.removeCategory);

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [image, setImage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) return toast.error('Name required');
    if (editing) {
      updateCategory(editing, { name: name.trim(), nameBn: nameBn.trim() || undefined, image: image.trim() || undefined, slug: slugify(name) });
      toast.success('Category updated');
    } else {
      addCategory({ id: `cat-${Date.now()}`, name: name.trim(), nameBn: nameBn.trim() || undefined, image: image.trim() || undefined, slug: slugify(name) });
      toast.success('Category created');
    }
    setName(''); setNameBn(''); setImage(''); setEditing(null);
  }

  return (
    <>
      <Helmet><title>Categories — Admin</title></Helmet>
      <h1 className="heading text-2xl font-extrabold">Categories</h1>
      <p className="text-sm text-slate-500">{categories.length} categories</p>

      <div className="card mt-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Name (English)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="নাম (বাংলা)" value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
          <div className="sm:col-span-2">
            <label className="label mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Image (upload or paste URL)
            </label>
            <ImageInput value={image} onChange={setImage} folder="categories" />
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
                {c.image ? <img src={c.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-gradient-soft" />}
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
