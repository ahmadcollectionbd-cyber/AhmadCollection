import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiBox, FiEdit2, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useDataStore } from '../../stores/dataStore';
import type { FoodPackage, Product, ProductColor, ProductType, ProductVariant } from '../../types';
import { formatBDT, slugify } from '../../lib/utils';
import { uploadProductImage } from '../../lib/upload';
import { PageHeader } from '../../components/admin/PageHeader';

const CLOTHING_SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', 'Free'] as const;

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(0),
  comparePrice: z.coerce.number().optional(),
  stock: z.coerce.number().min(0),
  categoryId: z.string().min(1),
  type: z.enum(['standard', 'clothing', 'food']).default('standard'),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
});

type Form = z.infer<typeof schema>;

/** Stable id helper for size variants. */
function sizeVariantId(size: string) {
  return `sz-${size.toLowerCase().replace(/\s+/g, '-')}`;
}

export function AdminProducts() {
  const products = useDataStore((s) => s.products);
  const categories = useDataStore((s) => s.categories);
  const addProduct = useDataStore((s) => s.addProduct);
  const updateProduct = useDataStore((s) => s.updateProduct);
  const removeProduct = useDataStore((s) => s.removeProduct);

  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productType, setProductType] = useState<ProductType>('standard');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [colorUploadingId, setColorUploadingId] = useState<string | null>(null);
  const [foodPackages, setFoodPackages] = useState<FoodPackage[]>([]);
  const [advanceCharge, setAdvanceCharge] = useState<string>('');
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema) as unknown as Resolver<Form>,
  });

  function startCreate() {
    setEditing(null);
    setImages([]);
    setProductType('standard');
    setVariants([]);
    setColors([]);
    setFoodPackages([]);
    setAdvanceCharge('');
    setSpecifications([]);
    reset({
      name: '',
      description: '',
      shortDescription: '',
      price: 0,
      stock: 0,
      categoryId: categories[0]?.id,
      type: 'standard',
      featured: false,
      bestseller: false,
    });
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setImages(p.images);
    setProductType(p.type ?? 'standard');
    setVariants(p.variants ?? []);
    setColors(p.colors ?? []);
    setFoodPackages(p.foodPackages ?? []);
    setAdvanceCharge(
      typeof p.advanceDeliveryCharge === 'number' ? String(p.advanceDeliveryCharge) : '',
    );
    setSpecifications(p.specifications ?? []);
    reset({
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription ?? '',
      price: p.price,
      comparePrice: p.comparePrice,
      stock: p.stock,
      categoryId: p.categoryIds[0],
      type: p.type ?? 'standard',
      featured: p.featured,
      bestseller: p.bestseller,
    });
    setOpen(true);
  }

  function toggleSizeVariant(size: string) {
    const id = sizeVariantId(size);
    setVariants((prev) => {
      const existing = prev.find((v) => v.id === id);
      if (existing) return prev.filter((v) => v.id !== id);
      return [
        ...prev,
        { id, label: size, attributes: { size }, stock: 0 },
      ];
    });
  }

  function updateVariant(id: string, patch: Partial<ProductVariant>) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function addColor() {
    setColors((prev) => [
      ...prev,
      { id: `clr-${Date.now()}-${prev.length}`, name: '', swatch: '', image: '' },
    ]);
  }

  function updateColor(id: string, patch: Partial<ProductColor>) {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeColor(id: string) {
    setColors((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleColorImage(id: string, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setColorUploadingId(id);
    try {
      const url = await uploadProductImage(file);
      updateColor(id, { image: url });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setColorUploadingId(null);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadProductImage(f);
        urls.push(url);
      }
      setImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: Form) {
    if (images.length === 0) {
      toast.error('Add at least one image');
      return;
    }
    const finalVariants =
      values.type === 'clothing' && variants.length > 0 ? variants : undefined;
    const finalColors =
      values.type === 'clothing' && colors.length > 0
        ? colors
            .filter((c) => c.name.trim().length > 0)
            .map((c) => {
              const out: ProductColor = { id: c.id, name: c.name.trim() };
              if (c.nameBn?.trim()) out.nameBn = c.nameBn.trim();
              if (c.swatch?.trim()) out.swatch = c.swatch.trim();
              if (c.image?.trim()) out.image = c.image.trim();
              return out;
            })
        : undefined;
    const isFood = values.type === 'food';
    const finalPackages =
      isFood && foodPackages.length > 0
        ? foodPackages
            .filter((pkg) => pkg.name.trim().length > 0 && pkg.weightKg > 0 && pkg.price >= 0)
            .map((pkg) => {
              const out: FoodPackage = {
                id: pkg.id,
                name: pkg.name.trim(),
                weightKg: pkg.weightKg,
                price: pkg.price,
              };
              if (pkg.nameBn?.trim()) out.nameBn = pkg.nameBn.trim();
              if (typeof pkg.comparePrice === 'number' && pkg.comparePrice > 0)
                out.comparePrice = pkg.comparePrice;
              if (typeof pkg.stock === 'number' && pkg.stock >= 0) out.stock = pkg.stock;
              if (pkg.crate && pkg.crate.name.trim().length > 0) {
                // Older drafts may still carry the legacy `quantityKg`
                // field; prefer the renamed `quantity` count and fall
                // back to it so editing-and-saving doesn't drop the
                // value. Stored field is `quantity` going forward.
                const rawQuantity =
                  typeof pkg.crate.quantity === 'number'
                    ? pkg.crate.quantity
                    : typeof pkg.crate.quantityKg === 'number'
                      ? pkg.crate.quantityKg
                      : 1;
                out.crate = {
                  name: pkg.crate.name.trim(),
                  quantity: Math.max(1, Math.round(rawQuantity || 1)),
                  price: Math.max(0, pkg.crate.price || 0),
                };
                if (pkg.crate.nameBn?.trim()) out.crate.nameBn = pkg.crate.nameBn.trim();
              }
              return out;
            })
        : undefined;

    // Aggregate stock: clothing sums size variants; food-with-packages
    // sums each package's stock so the admin list shows a meaningful
    // total. Otherwise we trust the manually entered value.
    const aggregateStock = finalVariants
      ? finalVariants.reduce((acc, v) => acc + (v.stock || 0), 0)
      : finalPackages
        ? finalPackages.reduce(
            (acc, p) => acc + (typeof p.stock === 'number' ? p.stock : 0),
            0,
          )
        : values.stock;

    // Food prices come from packages (or per-kg tiers), so the base
    // price/comparePrice fields are hidden in the form. Persist 0 to
    // avoid stale legacy values overriding the package prices.
    const finalBasePrice = isFood ? 0 : values.price;
    const finalCompare = isFood ? undefined : values.comparePrice;
    const finalAdvance =
      advanceCharge.trim() === '' ? undefined : Math.max(0, Number(advanceCharge) || 0);

    const finalShortDesc = values.shortDescription?.trim() || undefined;
    const finalSpecs = specifications.filter((s) => s.key.trim() && s.value.trim());
    if (editing) {
      const newSlug = slugify(values.name);
      await updateProduct(editing.id, {
        name: values.name,
        slug: editing.name === values.name ? editing.slug : newSlug,
        description: values.description,
        shortDescription: finalShortDesc,
        specifications: finalSpecs,
        price: finalBasePrice,
        comparePrice: finalCompare,
        stock: aggregateStock,
        categoryIds: [values.categoryId],
        images,
        type: values.type,
        variants: finalVariants,
        colors: finalColors,
        foodPackages: finalPackages,
        advanceDeliveryCharge: finalAdvance,
        featured: values.featured,
        bestseller: values.bestseller,
      });
      toast.success('Product updated');
    } else {
      const id = `p-${Date.now()}`;
      await addProduct({
        id,
        slug: slugify(values.name),
        name: values.name,
        description: values.description,
        shortDescription: finalShortDesc,
        price: finalBasePrice,
        comparePrice: finalCompare,
        stock: aggregateStock,
        images,
        categoryIds: [values.categoryId],
        sku: `AC-${id.slice(-4).toUpperCase()}`,
        rating: 0,
        reviewsCount: 0,
        specifications: finalSpecs,
        type: values.type,
        variants: finalVariants,
        colors: finalColors,
        foodPackages: finalPackages,
        advanceDeliveryCharge: finalAdvance,
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
      <PageHeader
        icon={<FiBox />}
        title="Products"
        subtitle={`${products.length} total`}
        accent="brand"
        actions={
          <>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="input h-9 w-44 py-1.5 text-xs" />
            <button onClick={startCreate} className="btn-primary text-xs">
              <FiPlus className="h-4 w-4" />
              New
            </button>
          </>
        }
      />

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
              {filtered.map((p) => {
                // Food products store pricing/stock per package — derive a
                // meaningful display value for the admin list. Show a range
                // when packages span more than one price; sum package stocks
                // for the stock badge so the legacy `p.stock` field (always
                // 0 for new food products) doesn't masquerade as out-of-stock.
                const pkgs = p.type === 'food' ? p.foodPackages ?? [] : [];
                const pkgPrices = pkgs.map((pkg) => pkg.price);
                const minPkgPrice = pkgPrices.length ? Math.min(...pkgPrices) : null;
                const maxPkgPrice = pkgPrices.length ? Math.max(...pkgPrices) : null;
                const priceLabel =
                  minPkgPrice !== null && maxPkgPrice !== null
                    ? minPkgPrice === maxPkgPrice
                      ? formatBDT(minPkgPrice)
                      : `${formatBDT(minPkgPrice)} – ${formatBDT(maxPkgPrice)}`
                    : formatBDT(p.price);
                const pkgStock = pkgs.reduce(
                  (acc, pkg) => acc + (typeof pkg.stock === 'number' ? pkg.stock : 0),
                  0,
                );
                const displayStock = pkgs.length ? pkgStock : p.stock;
                return (
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
                  <td className="px-4 py-3 font-semibold">{priceLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${displayStock > 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
                      {displayStock}
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
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
              <div>
                <label className="label">Short description <span className="text-[10px] text-slate-400">(shown below title)</span></label>
                <input className="input mt-1" placeholder="Brief tagline for the product" {...register('shortDescription')} />
              </div>
              {productType !== 'food' && (
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
                    <input
                      type="number"
                      className="input mt-1 disabled:opacity-60"
                      disabled={productType === 'clothing'}
                      {...register('stock')}
                    />
                    {productType === 'clothing' && (
                      <p className="mt-1 text-[10px] text-slate-500">Set per-size below.</p>
                    )}
                  </div>
                </div>
              )}
              {productType === 'food' && (
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 text-[11px] text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-200">
                  Food products are priced through their <strong>Pre-built
                  packages</strong> below — each package has its own price and
                  stock. The default Price / Compare price / Stock fields are
                  not used.
                </div>
              )}
              <div>
                <label className="label">Category</label>
                <select className="input mt-1" {...register('categoryId')}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Product type</label>
                <select
                  className="input mt-1"
                  {...register('type', {
                    onChange: (e) => {
                      const v = e.target.value as ProductType;
                      setProductType(v);
                      if (v !== 'clothing') {
                        setVariants([]);
                        setColors([]);
                      }
                      if (v === 'food') {
                        // Food prices come from packages — clear the
                        // legacy base price / stock so the hidden fields
                        // don't keep stale values.
                        setValue('price', 0);
                        setValue('comparePrice', undefined);
                        setValue('stock', 0);
                      }
                    },
                  })}
                >
                  <option value="standard">Standard (no variants)</option>
                  <option value="clothing">Clothing (size variants)</option>
                  <option value="food">Food / mango (per-kg, advanced)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {productType === 'standard' && 'Single price, single SKU. Inside / Outside delivery.'}
                  {productType === 'clothing' && 'Pick the sizes you stock and set per-size stock below.'}
                  {productType === 'food' && 'Pricing comes from pre-built packages below. Optional per-kg pricing and crate (kerat) options.'}
                </p>
              </div>

              {productType === 'clothing' && (
                <div className="rounded-2xl border border-sky-200/60 bg-sky-50/40 p-3 dark:border-sky-500/20 dark:bg-sky-500/5">
                  <div className="flex items-center justify-between">
                    <span className="label">Size variants</span>
                    <span className="text-[11px] text-slate-500">
                      Total stock: <strong>{variants.reduce((a, v) => a + (v.stock || 0), 0)}</strong>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CLOTHING_SIZE_PRESETS.map((size) => {
                      const id = sizeVariantId(size);
                      const active = !!variants.find((v) => v.id === id);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSizeVariant(size)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                            active
                              ? 'border-sky-500 bg-sky-500 text-white'
                              : 'border-slate-200 bg-white/70 hover:border-sky-400 dark:border-white/10 dark:bg-slate-900/60'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {variants.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {variants.map((v) => (
                        <div
                          key={v.id}
                          className="grid items-center gap-2 sm:grid-cols-[60px_1fr_1fr_28px]"
                        >
                          <span className="rounded-md bg-sky-500/10 px-2 py-1 text-center text-xs font-bold text-sky-700 dark:text-sky-300">
                            {v.label}
                          </span>
                          <label className="text-[11px] text-slate-500">
                            Stock
                            <input
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) =>
                                updateVariant(v.id, { stock: Math.max(0, Number(e.target.value)) })
                              }
                              className="input mt-0.5 h-9 py-1.5 text-xs"
                            />
                          </label>
                          <label className="text-[11px] text-slate-500">
                            Price override (৳, optional)
                            <input
                              type="number"
                              min={0}
                              value={v.price ?? ''}
                              onChange={(e) =>
                                updateVariant(v.id, {
                                  price: e.target.value === '' ? undefined : Number(e.target.value),
                                })
                              }
                              className="input mt-0.5 h-9 py-1.5 text-xs"
                              placeholder="leave empty"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleSizeVariant(v.attributes.size!)}
                            className="rounded-md p-1.5 text-accent-500 hover:bg-accent-500/10"
                            aria-label={`Remove size ${v.label}`}
                          >
                            <FiX className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <p className="text-[11px] text-slate-500">
                        Empty price falls back to the product&apos;s base price. Total
                        across sizes is used as the product stock.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {productType === 'clothing' && (
                <div className="rounded-2xl border border-fuchsia-200/60 bg-fuchsia-50/40 p-3 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/5">
                  <div className="flex items-center justify-between">
                    <span className="label">Colour variants (optional)</span>
                    <button
                      type="button"
                      onClick={addColor}
                      className="text-[11px] font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-300"
                    >
                      + Add colour
                    </button>
                  </div>
                  {colors.length === 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Add the colours this product comes in. Customer picks
                      a colour <em>and</em> a size; the picked colour&apos;s
                      photo becomes the product hero image.
                    </p>
                  ) : (
                    <div className="mt-2 grid gap-3">
                      {colors.map((c, idx) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-fuchsia-300/60 bg-white/60 p-3 dark:border-fuchsia-500/20 dark:bg-slate-900/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                              Colour #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeColor(c.id)}
                              className="rounded-md p-1 text-accent-500 hover:bg-accent-500/10"
                              aria-label={`Remove colour ${c.name || idx + 1}`}
                            >
                              <FiX className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <label className="text-[11px] text-slate-500">
                              Name
                              <input
                                type="text"
                                value={c.name}
                                placeholder="Red"
                                onChange={(e) => updateColor(c.id, { name: e.target.value })}
                                className="input mt-0.5 h-9 py-1.5 text-xs"
                              />
                            </label>
                            <label className="text-[11px] text-slate-500">
                              Name (Bangla, optional)
                              <input
                                type="text"
                                value={c.nameBn ?? ''}
                                placeholder="লাল"
                                onChange={(e) => updateColor(c.id, { nameBn: e.target.value })}
                                className="input mt-0.5 h-9 py-1.5 text-xs"
                              />
                            </label>
                            <label className="text-[11px] text-slate-500">
                              Swatch (CSS colour, optional)
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={
                                    c.swatch && /^#[0-9a-fA-F]{6}$/.test(c.swatch)
                                      ? c.swatch
                                      : '#000000'
                                  }
                                  onChange={(e) => updateColor(c.id, { swatch: e.target.value })}
                                  className="h-9 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5 dark:border-white/10"
                                  aria-label="Swatch colour picker"
                                />
                                <input
                                  type="text"
                                  value={c.swatch ?? ''}
                                  placeholder="#dc2626"
                                  onChange={(e) => updateColor(c.id, { swatch: e.target.value })}
                                  className="input h-9 py-1.5 text-xs"
                                />
                              </div>
                            </label>
                            <div className="text-[11px] text-slate-500">
                              Image
                              <div className="mt-0.5 flex items-center gap-2">
                                {c.image ? (
                                  <img
                                    src={c.image}
                                    alt=""
                                    className="h-9 w-9 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-md border border-dashed border-slate-300 dark:border-white/10" />
                                )}
                                <label className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold hover:border-fuchsia-400 dark:border-white/10 dark:bg-slate-900/60">
                                  <FiUpload className="h-3.5 w-3.5" />
                                  {colorUploadingId === c.id
                                    ? '…'
                                    : c.image
                                      ? 'Replace'
                                      : 'Upload'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      handleColorImage(c.id, e.target.files);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                {c.image && (
                                  <button
                                    type="button"
                                    onClick={() => updateColor(c.id, { image: '' })}
                                    className="text-[11px] font-semibold text-accent-500 hover:underline"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="text-[11px] text-slate-500">
                        Customers pick a colour and a size separately — each
                        combination becomes its own cart line. Swatch and
                        photo are optional but improve the buying experience.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {productType === 'food' && (
                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="label">Pre-built packages</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFoodPackages((prev) => [
                            ...prev,
                            {
                              id: `pkg-${Date.now()}-${prev.length}`,
                              name: '',
                              weightKg: 5,
                              price: 0,
                            },
                          ])
                        }
                        className="text-[11px] font-semibold text-emerald-600 hover:underline"
                      >
                        + Add package
                      </button>
                    </div>
                    {foodPackages.length === 0 ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        e.g. "Family pack 5 kg ৳1500 + 5 kg crate free". Customers
                        pick any number of packages, each with its own quantity.
                      </p>
                    ) : (
                      <div className="mt-2 grid gap-3">
                        {foodPackages.map((pkg, idx) => (
                          <div
                            key={pkg.id}
                            className="rounded-xl border border-emerald-300/60 bg-white/60 p-3 dark:border-emerald-500/20 dark:bg-slate-900/40"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                Package #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFoodPackages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="rounded-md p-1 text-accent-500 hover:bg-accent-500/10"
                                aria-label="Remove package"
                              >
                                <FiX className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <label className="text-[11px] text-slate-500">
                                Name
                                <input
                                  type="text"
                                  value={pkg.name}
                                  placeholder="Family pack"
                                  onChange={(e) =>
                                    setFoodPackages((prev) =>
                                      prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                                    )
                                  }
                                  className="input mt-0.5 h-9 py-1.5 text-xs"
                                />
                              </label>
                              <label className="text-[11px] text-slate-500">
                                Name (Bangla, optional)
                                <input
                                  type="text"
                                  value={pkg.nameBn ?? ''}
                                  placeholder="ফ্যামিলি প্যাক"
                                  onChange={(e) =>
                                    setFoodPackages((prev) =>
                                      prev.map((x, i) =>
                                        i === idx ? { ...x, nameBn: e.target.value } : x,
                                      ),
                                    )
                                  }
                                  className="input mt-0.5 h-9 py-1.5 text-xs"
                                />
                              </label>
                              <label className="text-[11px] text-slate-500">
                                Weight (kg)
                                <input
                                  type="number"
                                  min={0.5}
                                  step={0.5}
                                  value={pkg.weightKg}
                                  onChange={(e) =>
                                    setFoodPackages((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? { ...x, weightKg: Math.max(0, Number(e.target.value) || 0) }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="input mt-0.5 h-9 py-1.5 text-xs"
                                />
                              </label>
                              <label className="text-[11px] text-slate-500">
                                Price (৳)
                                <input
                                  type="number"
                                  min={0}
                                  value={pkg.price}
                                  onChange={(e) =>
                                    setFoodPackages((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? { ...x, price: Math.max(0, Number(e.target.value) || 0) }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="input mt-0.5 h-9 py-1.5 text-xs"
                                />
                              </label>
                              <label className="text-[11px] text-slate-500">
                                Compare price (৳, optional)
                                <input
                                  type="number"
                                  min={0}
                                  value={pkg.comparePrice ?? ''}
                                  onChange={(e) =>
                                    setFoodPackages((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              comparePrice:
                                                e.target.value === ''
                                                  ? undefined
                                                  : Math.max(0, Number(e.target.value)),
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="input mt-0.5 h-9 py-1.5 text-xs"
                                />
                              </label>
                              <label className="text-[11px] text-slate-500">
                                Stock (optional)
                                <input
                                  type="number"
                                  min={0}
                                  value={pkg.stock ?? ''}
                                  placeholder="unlimited"
                                  onChange={(e) =>
                                    setFoodPackages((prev) =>
                                      prev.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              stock:
                                                e.target.value === ''
                                                  ? undefined
                                                  : Math.max(0, Number(e.target.value)),
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="input mt-0.5 h-9 py-1.5 text-xs"
                                />
                              </label>
                            </div>

                            <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/60 p-2 dark:border-amber-500/20 dark:bg-amber-500/10">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                  Included crate (optional)
                                </span>
                                {pkg.crate ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFoodPackages((prev) =>
                                        prev.map((x, i) =>
                                          i === idx ? { ...x, crate: undefined } : x,
                                        ),
                                      )
                                    }
                                    className="text-[11px] font-semibold text-accent-500 hover:underline"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFoodPackages((prev) =>
                                        prev.map((x, i) =>
                                          i === idx
                                            ? {
                                                ...x,
                                                crate: { name: '', quantity: 1, price: 0 },
                                              }
                                            : x,
                                        ),
                                      )
                                    }
                                    className="text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-300"
                                  >
                                    + Add crate
                                  </button>
                                )}
                              </div>
                              {pkg.crate && (
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                  <label className="text-[11px] text-slate-500">
                                    Crate name
                                    <input
                                      type="text"
                                      value={pkg.crate.name}
                                      placeholder="Wooden crate"
                                      onChange={(e) =>
                                        setFoodPackages((prev) =>
                                          prev.map((x, i) =>
                                            i === idx && x.crate
                                              ? { ...x, crate: { ...x.crate, name: e.target.value } }
                                              : x,
                                          ),
                                        )
                                      }
                                      className="input mt-0.5 h-9 py-1.5 text-xs"
                                    />
                                  </label>
                                  <label className="text-[11px] text-slate-500">
                                    Crate name (Bangla)
                                    <input
                                      type="text"
                                      value={pkg.crate.nameBn ?? ''}
                                      placeholder="কাঠের কেরাত"
                                      onChange={(e) =>
                                        setFoodPackages((prev) =>
                                          prev.map((x, i) =>
                                            i === idx && x.crate
                                              ? { ...x, crate: { ...x.crate, nameBn: e.target.value } }
                                              : x,
                                          ),
                                        )
                                      }
                                      className="input mt-0.5 h-9 py-1.5 text-xs"
                                    />
                                  </label>
                                  <label className="text-[11px] text-slate-500">
                                    Quantity
                                    <input
                                      type="number"
                                      min={1}
                                      step={1}
                                      value={
                                        pkg.crate.quantity ?? pkg.crate.quantityKg ?? 1
                                      }
                                      onChange={(e) =>
                                        setFoodPackages((prev) =>
                                          prev.map((x, i) =>
                                            i === idx && x.crate
                                              ? {
                                                  ...x,
                                                  crate: {
                                                    ...x.crate,
                                                    quantity: Math.max(
                                                      1,
                                                      Math.round(Number(e.target.value) || 1),
                                                    ),
                                                  },
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                      className="input mt-0.5 h-9 py-1.5 text-xs"
                                    />
                                  </label>
                                  <div className="flex items-end gap-2">
                                    <label className="flex-1 text-[11px] text-slate-500">
                                      Price (৳)
                                      <input
                                        type="number"
                                        min={0}
                                        value={pkg.crate.price}
                                        onChange={(e) =>
                                          setFoodPackages((prev) =>
                                            prev.map((x, i) =>
                                              i === idx && x.crate
                                                ? {
                                                    ...x,
                                                    crate: {
                                                      ...x.crate,
                                                      price: Math.max(0, Number(e.target.value) || 0),
                                                    },
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="input mt-0.5 h-9 py-1.5 text-xs"
                                      />
                                    </label>
                                    <label className="mb-1 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                      <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5"
                                        checked={pkg.crate.price === 0}
                                        onChange={(e) =>
                                          setFoodPackages((prev) =>
                                            prev.map((x, i) =>
                                              i === idx && x.crate
                                                ? {
                                                    ...x,
                                                    crate: {
                                                      ...x.crate,
                                                      price: e.target.checked ? 0 : x.crate.price || 50,
                                                    },
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                      />
                                      Free
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Specifications editor */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-3 dark:border-white/10 dark:bg-slate-900/20">
                <div className="flex items-center justify-between">
                  <span className="label">Specifications</span>
                  <button
                    type="button"
                    onClick={() => setSpecifications((prev) => [...prev, { key: '', value: '' }])}
                    className="text-[11px] font-semibold text-brand-600 hover:underline"
                  >
                    + Add spec
                  </button>
                </div>
                {specifications.length === 0 ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    e.g. Weight: 500g, Material: Cotton. Shown on the product page Specifications tab.
                  </p>
                ) : (
                  <div className="mt-2 grid gap-2">
                    {specifications.map((spec, idx) => (
                      <div key={idx} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_28px]">
                        <input
                          type="text"
                          value={spec.key}
                          placeholder="Key (e.g. Weight)"
                          onChange={(e) =>
                            setSpecifications((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, key: e.target.value } : s)),
                            )
                          }
                          className="input h-9 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          placeholder="Value (e.g. 500g)"
                          onChange={(e) =>
                            setSpecifications((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, value: e.target.value } : s)),
                            )
                          }
                          className="input h-9 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecifications((prev) => prev.filter((_, i) => i !== idx))}
                          className="rounded-md p-1.5 text-accent-500 hover:bg-accent-500/10"
                          aria-label="Remove spec"
                        >
                          <FiX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Images</label>
                <div className="mt-1 grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    {images.map((url, i) => (
                      <div key={url + i} className="relative group">
                        <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -right-2 -top-2 hidden rounded-full bg-rose-500 p-1 text-white shadow group-hover:block"
                          aria-label="Remove image"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-white/10">
                      <FiUpload className="h-4 w-4" />
                      <span className="mt-1">{uploading ? '…' : 'Upload'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="image-url-input"
                      type="url"
                      placeholder="…or paste image URL"
                      className="input flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const v = (e.target as HTMLInputElement).value.trim();
                          if (v) {
                            setImages((prev) => [...prev, v]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('image-url-input') as HTMLInputElement | null;
                        const v = el?.value.trim();
                        if (v) {
                          setImages((prev) => [...prev, v]);
                          if (el) el.value = '';
                        }
                      }}
                      className="btn-outline text-xs whitespace-nowrap"
                    >
                      Add URL
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Drop image files or paste a URL and press Enter. First image is the cover.</p>
                </div>
              </div>

              <div>
                <label className="label">Advance delivery charge (BDT, optional override)</label>
                <input
                  className="input mt-1"
                  type="number"
                  min={0}
                  placeholder="Leave empty to use the category default"
                  value={advanceCharge}
                  onChange={(e) => setAdvanceCharge(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Customer pays this upfront via bKash/Nagad before the order is
                  confirmed; balance is COD on delivery. Overrides the category's
                  advance charge for this product only.
                </p>
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
