import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useDataStore } from '../../stores/dataStore';
import type { Product } from '../../types';
import { formatBDT, slugify } from '../../lib/utils';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  comparePrice: z.coerce.number().optional(),
  stock: z.coerce.number().min(0),
  categoryId: z.string().min(1),
  image: z.string().url('Provide a valid image URL'),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
});

type Form = z.infer<typeof schema>;

export function AdminProducts() {
  const products = useDataStore((s) => s.products);
  const categories = useDataStore((s) => s.categories);
  const addProduct = useDataStore((s) => s.addProduct);
  const updateProduct = useDataStore((s) => s.updateProduct);
  const removeProduct = useDataStore((s) => s.removeProduct);

  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema) as unknown as Resolver<Form>,
  });

  function startCreate() {
    setEditing(null);
    reset({ name: '', description: '', price: 0, stock: 0, categoryId: categories[0]?.id, image: '', featured: false, bestseller: false });
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditing(p);
    reset({
      name: p.name,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      stock: p.stock,
      categoryId: p.categoryIds[0],
      image: p.images[0] || '',
      featured: p.featured,
      bestseller: p.bestseller,
    });
    setOpen(true);
  }

  function onSubmit(values: Form) {
    if (editing) {
      updateProduct(editing.id, {
        name: values.name,
        slug: slugify(values.name),
        description: values.description,
        price: values.price,
        comparePrice: values.comparePrice,
        stock: values.stock,
        categoryIds: [values.categoryId],
        images: [values.image],
        featured: values.featured,
        bestseller: values.bestseller,
      });
      toast.success('Product updated');
    } else {
      const id = `p-${Date.now()}`;
      addProduct({
        id,
        slug: slugify(values.name),
        name: values.name,
        description: values.description,
        price: values.price,
        comparePrice: values.comparePrice,
        stock: values.stock,
        images: [values.image],
        categoryIds: [values.categoryId],
        sku: `AC-${id.slice(-4).toUpperCase()}`,
        rating: 0,
        reviewsCount: 0,
        specifications: [],
        featured: values.featured,
        bestseller: values.bestseller,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success('Product created');
    }
    setOpen(false);
  }

  return (
    <>
      <Helmet><title>Products — Admin</title></Helmet>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="heading text-2xl font-extrabold">Products</h1>
          <p className="text-sm text-slate-500">{products.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="input h-9 w-44 py-1.5 text-xs" />
          <button onClick={startCreate} className="btn-primary text-xs">
            <FiPlus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="line-clamp-1 font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {p.categoryIds.map((cid) => categories.find((c) => c.id === cid)?.name).filter(Boolean).join(', ')}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.stock > 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><FiEdit2 className="h-4 w-4" /></button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"?`)) {
                            removeProduct(p.id);
                            toast.success('Product deleted');
                          }
                        }}
                        className="rounded-lg p-1.5 text-accent-500 hover:bg-accent-500/10"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="heading text-xl font-extrabold">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><FiX className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input mt-1" {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-accent-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input mt-1 min-h-[80px]" {...register('description')} />
                {errors.description && <p className="mt-1 text-xs text-accent-500">{errors.description.message}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Price (৳)</label>
                  <input type="number" className="input mt-1" {...register('price')} />
                </div>
                <div>
                  <label className="label">Compare price</label>
                  <input type="number" className="input mt-1" {...register('comparePrice')} />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input type="number" className="input mt-1" {...register('stock')} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Category</label>
                  <select className="input mt-1" {...register('categoryId')}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Image URL</label>
                  <input className="input mt-1" placeholder="https://…" {...register('image')} />
                  {errors.image && <p className="mt-1 text-xs text-accent-500">{errors.image.message}</p>}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2"><input type="checkbox" {...register('featured')} />Featured</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" {...register('bestseller')} />Bestseller</label>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
