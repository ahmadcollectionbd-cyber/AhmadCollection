import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCheck, FiHeart, FiPhone, FiShoppingCart, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDataStore } from '../stores/dataStore';
import { effectivePricePerKg, useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import { useSettingsStore } from '../stores/settingsStore';
import { SafeImage } from '../components/ui/SafeImage';
import { formatBDT, formatDate, callLink, whatsappLink } from '../lib/utils';
import { ProductCard } from '../components/product/ProductCard';
import { SEO } from '../components/seo/SEO';
import { useTranslation } from 'react-i18next';
import { gaEvent, pixelEvent } from '../lib/pixel';

export function Product() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const products = useDataStore((s) => s.products);
  const reviews = useDataStore((s) => s.reviews);
  const addReview = useDataStore((s) => s.addReview);
  const add = useCartStore((s) => s.add);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.has);
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const settings = useSettingsStore((s) => s.settings);

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const [imageIdx, setImageIdx] = useState(0);
  // `qtyOverride === null` means "use the per-product default" (1 unit, or
  // `minOrderKg` for per-kg food). Avoids a setState-in-effect cycle.
  const [qtyOverride, setQtyOverride] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [crateId, setCrateId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Derived values — safe even if product is undefined (values just default).
  const variants = product?.variants ?? [];
  const hasVariants = variants.length > 0;
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === variantId)
    : undefined;
  const isPerKg = !!product?.pricedPerKg;
  const minKg = product?.minOrderKg ?? 1;
  const crateOptions = product?.crateOptions ?? [];
  const foodPackages = product?.foodPackages ?? [];
  const hasPackages = foodPackages.length > 0;
  // When a product has pre-built food packages, qty represents the
  // number of packages and defaults to 1 — the per-kg minimum doesn't
  // apply. Otherwise per-kg minOrderKg seeds the kg input, and unit
  // products start at 1.
  const qty = qtyOverride ?? (hasPackages ? 1 : isPerKg ? minKg : 1);
  const setQty = setQtyOverride;
  /**
   * The customer's explicit package pick (single-select). When this is
   * `undefined` — or no longer matches a package on the current product
   * — `selectedPackageId` (derived below) falls back to the first
   * package, which is treated as the "main" package and is selected by
   * default. Quick-add from home/shop also uses the main package.
   */
  const [pickedPackageId, setPickedPackageId] = useState<string | undefined>(undefined);
  const selectedPackageId = hasPackages
    ? pickedPackageId && foodPackages.some((p) => p.id === pickedPackageId)
      ? pickedPackageId
      : foodPackages[0].id
    : undefined;

  // Auto-pick the best matching crate for per-kg food products. The user
  // can still override via `setCrateId` — `effectiveCrateId` (below) treats
  // the manual choice as priority and falls back to the auto pick.
  const autoCrateId = useMemo(() => {
    if (!isPerKg || crateOptions.length === 0) return undefined;
    const sorted = [...crateOptions]
      .filter((c) => c.capacityKg)
      .sort((a, b) => (b.capacityKg ?? 0) - (a.capacityKg ?? 0));
    const best = sorted.find((c) => (c.capacityKg ?? 0) <= qty) ?? sorted[sorted.length - 1];
    return best?.id;
  }, [qty, isPerKg, crateOptions]);
  const effectiveCrateId = crateId ?? autoCrateId;

  if (!product) {
    return (
      <div className="section py-20 text-center">
        <h1 className="heading text-2xl font-bold">Product not found</h1>
        <Link to="/shop" className="btn-primary mt-4 inline-flex">Back to Shop</Link>
      </div>
    );
  }

  const selectedPackage = hasPackages
    ? foodPackages.find((p) => p.id === selectedPackageId) ?? foodPackages[0]
    : undefined;

  const effectivePrice = hasPackages && selectedPackage
    ? selectedPackage.price
    : isPerKg
      ? effectivePricePerKg(product, qty)
      : (selectedVariant?.price ?? product.price);
  const effectiveCompare = hasPackages && selectedPackage
    ? selectedPackage.comparePrice
    : selectedVariant?.comparePrice ?? product.comparePrice;
  const effectiveStock = hasPackages && selectedPackage
    ? selectedPackage.stock ?? Number.MAX_SAFE_INTEGER
    : hasVariants
      ? selectedVariant?.stock ?? 0
      : product.stock;
  const requiresVariantPick = hasVariants && !selectedVariant;

  const selectedCrate = crateOptions.find((c) => c.id === effectiveCrateId);
  const lineSubtotal = hasPackages && selectedPackage
    ? (selectedPackage.price + (selectedPackage.crate?.price ?? 0)) * qty
    : isPerKg
      ? effectivePrice * qty + (selectedCrate?.price ?? 0)
      : effectivePrice * qty;

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const related = products.filter((p) => p.id !== product.id && p.categoryIds.some((c) => product.categoryIds.includes(c))).slice(0, 4);
  const isWished = wished(product.id);

  const discount =
    effectiveCompare && effectiveCompare > effectivePrice
      ? Math.round(((effectiveCompare - effectivePrice) / effectiveCompare) * 100)
      : 0;

  const wm = `Hi! I'm interested in *${product.name}* (${formatBDT(effectivePrice)}). Is it available?`;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description.slice(0, 160)}
        image={product.images[0]}
        path={`/product/${product.slug}`}
        type="product"
        product={product}
      />
      <ProductPixel productId={product.id} name={product.name} price={product.price} categoryIds={product.categoryIds} />
      <section className="section mt-8">
        <nav className="mb-5 text-xs text-slate-500">
          <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/shop" className="hover:text-brand-600">Shop</Link> /{' '}
          <span className="text-slate-700 dark:text-slate-300">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="card overflow-hidden">
              <div className="aspect-square bg-gradient-soft">
                <motion.div
                  key={imageIdx}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full"
                >
                  <SafeImage
                    src={product.images[imageIdx]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === imageIdx ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <SafeImage src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.bestseller && <span className="badge-brand">Bestseller</span>}
              {discount > 0 && <span className="badge-accent">-{discount}% off</span>}
              {effectiveStock > 0 ? (
                <span className="badge bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <FiCheck className="h-3 w-3" /> {t('product.inStock')}
                </span>
              ) : (
                <span className="badge bg-red-500/10 text-red-700 dark:text-red-300">{t('product.outOfStock')}</span>
              )}
            </div>
            <h1 className={`heading mt-3 text-2xl font-extrabold sm:text-3xl ${lang === 'bn' && product.nameBn ? 'font-bn' : ''}`}>
              {lang === 'bn' && product.nameBn ? product.nameBn : product.name}
            </h1>
            {(product.shortDescription || product.shortDescriptionBn) && (
              <p className={`mt-2 text-sm text-slate-500 dark:text-slate-400 ${lang === 'bn' && product.shortDescriptionBn ? 'font-bn' : ''}`}>
                {lang === 'bn' && product.shortDescriptionBn ? product.shortDescriptionBn : product.shortDescription}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-slate-500">· {t('product.reviewsCount', { count: product.reviewsCount })}</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">
                {formatBDT(effectivePrice)}
                {isPerKg && !hasPackages && <span className="ml-1 text-base font-bold text-slate-500">/ kg</span>}
              </span>
              {effectiveCompare && effectiveCompare > effectivePrice && (
                <span className="text-base text-slate-400 line-through">{formatBDT(effectiveCompare)}</span>
              )}
              {isPerKg && !hasPackages && qty > 0 && (
                <span className="ml-auto text-xs text-slate-500">
                  {qty} kg = <strong className="text-slate-700 dark:text-slate-200">{formatBDT(effectivePrice * qty)}</strong>
                </span>
              )}
              {hasPackages && qty > 0 && (
                <span className="ml-auto text-xs text-slate-500">
                  {qty} × = <strong className="text-slate-700 dark:text-slate-200">{formatBDT(lineSubtotal)}</strong>
                </span>
              )}
            </div>

            {isPerKg && !hasPackages && (product.weightTiers?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.weightTiers!
                  .slice()
                  .sort((a, b) => a.minKg - b.minKg)
                  .map((tier) => (
                    <span
                      key={tier.minKg}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        qty >= tier.minKg
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tier.minKg}+ kg → {formatBDT(tier.pricePerKg)}/kg
                    </span>
                  ))}
              </div>
            )}

            <p className={`mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${lang === 'bn' && product.descriptionBn ? 'font-bn' : ''}`}>
              {lang === 'bn' && product.descriptionBn ? product.descriptionBn : product.description}
            </p>

            {hasVariants && (
              <div className="mt-5">
                <span className="label">
                  {product.type === 'clothing' ? 'Size' : 'Option'}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const out = v.stock <= 0;
                    const active = v.id === variantId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={out}
                        onClick={() => {
                          setVariantId(v.id);
                          setQty(1);
                        }}
                        className={`min-w-[3rem] rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                          active
                            ? 'border-brand-500 bg-brand-500/10 text-brand-700 ring-2 ring-brand-500/30 dark:text-brand-300'
                            : out
                              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-white/10 dark:bg-slate-800 dark:text-slate-500'
                              : 'border-slate-200 bg-white/70 hover:border-brand-400 dark:border-white/10 dark:bg-slate-900/60'
                        }`}
                      >
                        {lang === 'bn' && v.labelBn ? v.labelBn : v.label}
                      </button>
                    );
                  })}
                </div>
                {requiresVariantPick && (
                  <p className="mt-1.5 text-xs text-accent-500">
                    {product.type === 'clothing' ? 'Select a size to continue.' : 'Select an option to continue.'}
                  </p>
                )}
              </div>
            )}

            {hasPackages && (
              <div className="mt-5 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                <span className="label">প্যাকেজ / Package</span>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Pick a package, then choose the quantity below. The first
                  package is selected by default.
                </p>
                <div className="mt-3 grid gap-2.5" role="radiogroup" aria-label="Package">
                  {foodPackages.map((pkg) => {
                    const active = pkg.id === selectedPackageId;
                    const out = typeof pkg.stock === 'number' && pkg.stock <= 0;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={out}
                        onClick={() => {
                          setPickedPackageId(pkg.id);
                          setQty(1);
                        }}
                        className={`text-left rounded-xl border p-3 transition ${
                          active
                            ? 'border-emerald-500 bg-white/90 ring-1 ring-emerald-500/30 dark:bg-slate-900/60'
                            : out
                              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-white/10 dark:bg-slate-800 dark:text-slate-500'
                              : 'border-slate-200 bg-white/70 hover:border-emerald-400 dark:border-white/10 dark:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              active
                                ? 'border-emerald-500'
                                : 'border-slate-300 dark:border-white/30'
                            }`}
                          >
                            {active && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className={`font-semibold ${lang === 'bn' && pkg.nameBn ? 'font-bn' : ''}`}>
                                {lang === 'bn' && pkg.nameBn ? pkg.nameBn : pkg.name}
                              </span>
                              <span className="text-xs text-slate-500">{pkg.weightKg} kg</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-sm">
                              <span className="font-bold text-brand-700 dark:text-brand-300">
                                {formatBDT(pkg.price)}
                              </span>
                              {pkg.comparePrice && pkg.comparePrice > pkg.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  {formatBDT(pkg.comparePrice)}
                                </span>
                              )}
                            </div>
                            {pkg.crate && (
                              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                <span>
                                  {lang === 'bn' && pkg.crate.nameBn ? pkg.crate.nameBn : pkg.crate.name}
                                  {(() => {
                                    // Crate is a count, not a weight.
                                    // Legacy data may still expose the
                                    // old `quantityKg` field — fall back
                                    // to it so older products still
                                    // render their crate count.
                                    const n = pkg.crate.quantity ?? pkg.crate.quantityKg;
                                    return n ? ` × ${n}` : '';
                                  })()}
                                </span>
                                <span className="opacity-80">
                                  {pkg.crate.price === 0 ? '— Free' : `+${formatBDT(pkg.crate.price)}`}
                                </span>
                              </div>
                            )}
                            {typeof pkg.stock === 'number' && pkg.stock <= 0 && (
                              <div className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                Out of stock
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2">
              <span className="label">{isPerKg && !hasPackages ? 'Weight (kg)' : 'Quantity'}</span>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
                <button
                  onClick={() => setQty(Math.max(isPerKg && !hasPackages ? minKg : 1, qty - 1))}
                  className="px-3 py-2 text-lg leading-none"
                >
                  −
                </button>
                {isPerKg && !hasPackages ? (
                  <input
                    type="number"
                    min={minKg}
                    max={effectiveStock || undefined}
                    step={1}
                    value={qty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v)) setQty(Math.max(minKg, Math.min(effectiveStock || v, v)));
                    }}
                    className="w-16 bg-transparent text-center text-sm font-semibold outline-none"
                  />
                ) : (
                  <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                )}
                <button
                  onClick={() => setQty(Math.min(effectiveStock, qty + 1))}
                  className="px-3 py-2 text-lg leading-none"
                >
                  +
                </button>
              </div>
              {isPerKg && !hasPackages && minKg > 1 && (
                <span className="text-[11px] text-slate-500">min {minKg} kg</span>
              )}
              {!hasPackages && (selectedVariant?.sku || product.sku) && (
                <span className="ml-auto text-xs text-slate-500">SKU: {selectedVariant?.sku ?? product.sku}</span>
              )}
            </div>

            {!hasPackages && crateOptions.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <span className="label">Crate / কেরাত (optional)</span>
                  {selectedCrate && (
                    <button
                      type="button"
                      onClick={() => setCrateId(undefined)}
                      className="text-[11px] font-semibold text-accent-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {crateOptions.map((c) => {
                    const active = c.id === crateId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCrateId(active ? undefined : c.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-slate-200 bg-white/70 hover:border-amber-400 dark:border-white/10 dark:bg-slate-900/60'
                        }`}
                      >
                        {lang === 'bn' && c.labelBn ? c.labelBn : c.label}
                        <span className="ml-1.5 opacity-80">+{formatBDT(c.price)}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Crate (kerat) is added to the order. You can also leave it empty.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-baseline justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{formatBDT(lineSubtotal)}</span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                disabled={effectiveStock <= 0 || requiresVariantPick}
                onClick={() => {
                  if (hasPackages && selectedPackage) {
                    add(product, qty, { pkg: selectedPackage });
                    pixelEvent('AddToCart', {
                      content_ids: [product.id],
                      content_name: product.name,
                      content_type: 'product',
                      currency: 'BDT',
                      value: lineSubtotal,
                    });
                    gaEvent('add_to_cart', {
                      currency: 'BDT',
                      value: lineSubtotal,
                      items: [{
                        item_id: product.id,
                        item_name: product.name,
                        item_variant: selectedPackage.name,
                        price: selectedPackage.price,
                        quantity: qty,
                      }],
                    });
                    toast.success('Added to cart');
                    return;
                  }
                  if (requiresVariantPick) {
                    toast.error(product.type === 'clothing' ? 'Select a size first' : 'Select an option first');
                    return;
                  }
                  add(product, qty, { variant: selectedVariant, crate: selectedCrate });
                  pixelEvent('AddToCart', {
                    content_ids: [product.id],
                    content_name: product.name,
                    content_type: 'product',
                    currency: 'BDT',
                    value: effectivePrice * qty,
                  });
                  gaEvent('add_to_cart', {
                    currency: 'BDT',
                    value: effectivePrice * qty,
                    items: [{
                      item_id: product.id,
                      item_name: product.name,
                      item_variant: selectedVariant?.label,
                      price: effectivePrice,
                      quantity: qty,
                    }],
                  });
                  toast.success('Added to cart');
                }}
                className="btn-outline"
              >
                <FiShoppingCart className="h-4 w-4" />
                {t('product.addToCart')}
              </button>
              <button
                disabled={effectiveStock <= 0 || requiresVariantPick}
                onClick={() => {
                  if (hasPackages && selectedPackage) {
                    const pkg = selectedPackage;
                    const buyNowItem = {
                      productId: product.id,
                      name: product.name,
                      price: pkg.price,
                      image: product.images[0],
                      quantity: qty,
                      stock: pkg.stock ?? product.stock,
                      slug: product.slug,
                      productType: product.type,
                      packageId: pkg.id,
                      packageLabel: pkg.name,
                      packageWeightKg: pkg.weightKg,
                      crateId: pkg.crate ? `pkg-${pkg.id}-crate` : undefined,
                      crateLabel: pkg.crate
                        ? (() => {
                            const n = pkg.crate.quantity ?? pkg.crate.quantityKg;
                            return `${pkg.crate.name}${n ? ` × ${n}` : ''}`;
                          })()
                        : undefined,
                      cratePrice: pkg.crate ? pkg.crate.price : undefined,
                    };
                    pixelEvent('AddToCart', {
                      content_ids: [product.id],
                      content_name: product.name,
                      currency: 'BDT',
                      value: lineSubtotal,
                    });
                    navigate('/checkout', { state: { buyNowItem } });
                    return;
                  }
                  if (requiresVariantPick) {
                    toast.error(product.type === 'clothing' ? 'Select a size first' : 'Select an option first');
                    return;
                  }
                  // Buy Now: navigate to checkout with just this product (don't add to cart)
                  const buyNowItem = {
                    productId: product.id,
                    name: product.name,
                    price: effectivePrice,
                    image: product.images[0],
                    quantity: qty,
                    stock: effectiveStock,
                    slug: product.slug,
                    productType: product.type,
                    variantId: selectedVariant?.id,
                    variantLabel: selectedVariant?.label,
                    weightKg: isPerKg ? qty : undefined,
                    crateId: selectedCrate?.id,
                    crateLabel: selectedCrate?.label,
                    cratePrice: selectedCrate?.price,
                  };
                  pixelEvent('AddToCart', {
                    content_ids: [product.id],
                    content_name: product.name,
                    currency: 'BDT',
                    value: effectivePrice * qty,
                  });
                  navigate('/checkout', { state: { buyNowItem } });
                }}
                className="btn-primary"
              >
                {t('product.buyNow')}
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <a href={whatsappLink(wm, settings.whatsappNumber)} target="_blank" rel="noreferrer" className="btn-outline" style={{ borderColor: '#25D36655', color: '#1ea552' }}>
                <FaWhatsapp className="h-4 w-4" />
                {t('product.whatsapp')}
              </a>
              <a href={callLink(settings.contactPhone)} className="btn-outline">
                <FiPhone className="h-4 w-4" />
                {t('product.call')}
              </a>
              <button
                onClick={() => {
                  toggle(product.id);
                  toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
                }}
                className="btn-outline"
              >
                <FiHeart className={`h-4 w-4 ${isWished ? 'fill-current text-accent-500' : ''}`} />
                {isWished ? 'Wished' : 'Wishlist'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex gap-2 border-b border-slate-200 dark:border-white/10">
            {(['description', 'specifications', 'reviews'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition ${tab === k ? 'border-brand-500 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                {t(`product.${k}`)}
              </button>
            ))}
          </div>
          <div className="card mt-4 p-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tab === 'description' && (
              <p className={lang === 'bn' && product.descriptionBn ? 'font-bn' : ''}>
                {lang === 'bn' && product.descriptionBn ? product.descriptionBn : product.description}
              </p>
            )}
            {tab === 'specifications' && (
              <dl className="grid gap-3 sm:grid-cols-2">
                {product.specifications.map((s) => (
                  <div key={s.key} className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/40">
                    <dt className="font-medium text-slate-700 dark:text-slate-200">{s.key}</dt>
                    <dd className="text-slate-500">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {tab === 'reviews' && (
              <div>
                {productReviews.length === 0 && <p className="mb-4 text-slate-500">No reviews yet. Be the first to review!</p>}
                <ul className="space-y-3">
                  {productReviews.map((r) => (
                    <li key={r.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{r.userName}</div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FiStar key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
                      <div className="mt-1 text-xs text-slate-400">{formatDate(r.createdAt)}</div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                  <h4 className="text-sm font-semibold">Write a review</h4>
                  {!user && (
                    <p className="mt-1 text-xs text-slate-500">
                      Anyone can review — just enter your name (and an optional phone) to submit.
                    </p>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {!user && (
                      <>
                        <input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Your name *"
                          className="input"
                          maxLength={60}
                        />
                        <input
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="Phone (optional)"
                          className="input"
                          maxLength={20}
                          inputMode="tel"
                        />
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewRating(i + 1)}
                        aria-label={`${i + 1} star`}
                      >
                        <FiStar className={`h-5 w-5 ${i < reviewRating ? 'fill-current text-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience…"
                    className="input mt-2 min-h-[80px]"
                    maxLength={1000}
                  />
                  <button
                    onClick={async () => {
                      if (!reviewComment.trim()) return toast.error('Please write a comment');
                      const trimmedName = (user?.name || guestName).trim();
                      if (!trimmedName) return toast.error('Please enter your name');
                      const phoneTrim = guestPhone.trim();
                      try {
                        await addReview({
                          id: `r-${Date.now()}`,
                          productId: product.id,
                          userId: user?.uid || 'guest',
                          userName: trimmedName,
                          ...(phoneTrim ? { userPhone: phoneTrim } : {}),
                          rating: reviewRating,
                          comment: reviewComment.trim(),
                          createdAt: Date.now(),
                        });
                        setReviewComment('');
                        if (!user) {
                          setGuestName('');
                          setGuestPhone('');
                        }
                        toast.success('Review submitted');
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Could not submit review');
                      }
                    }}
                    className="btn-primary mt-3"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="heading text-xl font-extrabold sm:text-2xl">{t('product.related')}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function ProductPixel({ productId, name, price, categoryIds }: { productId: string; name: string; price: number; categoryIds: string[] }) {
  useEffect(() => {
    pixelEvent('ViewContent', {
      content_ids: [productId],
      content_name: name,
      content_type: 'product',
      content_category: categoryIds.join(','),
      currency: 'BDT',
      value: price,
    });
    gaEvent('view_item', {
      currency: 'BDT',
      value: price,
      items: [{ item_id: productId, item_name: name, price }],
    });
  }, [productId, name, price, categoryIds]);
  return null;
}
