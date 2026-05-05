import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCheck, FiHeart, FiPhone, FiShoppingCart, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDataStore } from '../stores/dataStore';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import { useSettingsStore } from '../stores/settingsStore';
import { SafeImage } from '../components/ui/SafeImage';
import { formatBDT, formatDate, callLink, whatsappLink } from '../lib/utils';
import { ProductCard } from '../components/product/ProductCard';
import { SEO } from '../components/seo/SEO';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
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
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  if (!product) {
    return (
      <div className="section py-20 text-center">
        <h1 className="heading text-2xl font-bold">Product not found</h1>
        <Link to="/shop" className="btn-primary mt-4 inline-flex">Back to Shop</Link>
      </div>
    );
  }

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const related = products.filter((p) => p.id !== product.id && p.categoryIds.some((c) => product.categoryIds.includes(c))).slice(0, 4);
  const isWished = wished(product.id);

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const wm = `Hi! I'm interested in *${product.name}* (${formatBDT(product.price)}). Is it available?`;

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
              {product.stock > 0 ? (
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
              <span className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">{formatBDT(product.price)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-base text-slate-400 line-through">{formatBDT(product.comparePrice)}</span>
              )}
            </div>

            <p className={`mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${lang === 'bn' && product.descriptionBn ? 'font-bn' : ''}`}>
              {lang === 'bn' && product.descriptionBn ? product.descriptionBn : product.description}
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="label">Quantity</span>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-lg leading-none">−</button>
                <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 text-lg leading-none">+</button>
              </div>
              {product.sku && <span className="ml-auto text-xs text-slate-500">SKU: {product.sku}</span>}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  add(product, qty);
                  pixelEvent('AddToCart', {
                    content_ids: [product.id],
                    content_name: product.name,
                    content_type: 'product',
                    currency: 'BDT',
                    value: product.price * qty,
                  });
                  gaEvent('add_to_cart', {
                    currency: 'BDT',
                    value: product.price * qty,
                    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }],
                  });
                  toast.success('Added to cart');
                }}
                className="btn-outline"
              >
                <FiShoppingCart className="h-4 w-4" />
                {t('product.addToCart')}
              </button>
              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  add(product, qty);
                  pixelEvent('AddToCart', {
                    content_ids: [product.id],
                    content_name: product.name,
                    currency: 'BDT',
                    value: product.price * qty,
                  });
                  navigate('/checkout');
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
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setReviewRating(i + 1)}>
                        <FiStar className={`h-5 w-5 ${i < reviewRating ? 'fill-current text-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience…"
                    className="input mt-2 min-h-[80px]"
                  />
                  <button
                    onClick={() => {
                      if (!reviewComment.trim()) return toast.error('Please write a comment');
                      addReview({
                        id: `r-${Date.now()}`,
                        productId: product.id,
                        userId: user?.uid || 'guest',
                        userName: user?.name || 'Guest',
                        rating: reviewRating,
                        comment: reviewComment.trim(),
                        createdAt: Date.now(),
                      });
                      setReviewComment('');
                      toast.success('Review submitted');
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
