import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import { formatBDT } from '../../lib/utils';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useLangStore } from '../../stores/langStore';
import { SafeImage } from '../ui/SafeImage';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCartStore((s) => s.add);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.has(product.id));
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();

  // Food products with pre-built packages quick-add the first ("main")
  // package by default. Listings show a price range when packages span
  // multiple price points so customers know the spread up front.
  const foodPackages =
    product.type === 'food' ? product.foodPackages ?? [] : [];
  const hasPackages = foodPackages.length > 0;
  const mainPackage = hasPackages ? foodPackages[0] : undefined;

  const packagePrices = hasPackages ? foodPackages.map((p) => p.price) : [];
  const minPackagePrice = packagePrices.length ? Math.min(...packagePrices) : product.price;
  const maxPackagePrice = packagePrices.length ? Math.max(...packagePrices) : product.price;
  const showPriceRange = hasPackages && minPackagePrice !== maxPackagePrice;
  const displayPrice = hasPackages ? minPackagePrice : product.price;
  const displayCompare = hasPackages
    ? mainPackage?.comparePrice
    : product.comparePrice;

  const discount =
    !showPriceRange && displayCompare && displayCompare > displayPrice
      ? Math.round(((displayCompare - displayPrice) / displayCompare) * 100)
      : 0;

  // Products that need extra config on the detail page (size pick,
  // colour pick, kg input, crate selector) skip the quick-add and route
  // to detail so the customer can choose. Food products with packages
  // stay on the listing — quick-add / Buy Now uses the main package
  // transparently. Clothing colours always require a pick.
  const needsConfig =
    (product.variants && product.variants.length > 0) ||
    (product.colors && product.colors.length > 0) ||
    !!product.pricedPerKg;

  const outOfStock = hasPackages
    ? (mainPackage?.stock ?? Number.MAX_SAFE_INTEGER) <= 0
    : product.stock <= 0;

  const quickAdd = () => {
    if (mainPackage) {
      add(product, 1, { pkg: mainPackage });
    } else {
      add(product, 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-500/10 dark:border-white/10 dark:bg-slate-900/80 dark:hover:shadow-brand-500/5"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          {discount > 0 && (
            <span className="absolute left-2.5 top-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              -{discount}%
            </span>
          )}
          {product.bestseller && (
            <span className="absolute left-2.5 top-10 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              <FiZap className="mr-0.5 inline h-2.5 w-2.5" />Best
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
              toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
            }}
            className={`absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
              wished
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/95 text-slate-500 hover:bg-white hover:text-red-500 hover:scale-110 dark:bg-slate-800/95 dark:text-slate-300'
            }`}
            aria-label="Toggle wishlist"
          >
            <FiHeart className={`h-4 w-4 ${wished ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Link>

      <div className="p-3.5 sm:p-4">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="flex items-center gap-1 text-[10px] text-amber-500 sm:text-[11px]">
            <FiStar className="h-3 w-3 fill-current" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviewsCount})</span>
          </div>
          <h3 className={`mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-slate-800 transition group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-300 sm:text-sm ${lang === 'bn' && product.nameBn ? 'font-bn' : ''}`}>
            {lang === 'bn' && product.nameBn ? product.nameBn : product.name}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-brand-600 dark:text-brand-300 sm:text-lg">
              {showPriceRange
                ? `${formatBDT(minPackagePrice)} – ${formatBDT(maxPackagePrice)}`
                : formatBDT(displayPrice)}
            </span>
            {!showPriceRange && displayCompare && displayCompare > displayPrice && (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs">{formatBDT(displayCompare)}</span>
            )}
          </div>
        </Link>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              if (needsConfig) {
                navigate(`/product/${product.slug}`);
                return;
              }
              quickAdd();
              toast.success('Added to cart');
            }}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[10px] font-semibold text-slate-700 transition-all hover:border-brand-500 hover:text-brand-600 hover:shadow-sm disabled:opacity-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-400 sm:text-xs"
          >
            <FiShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Add
          </button>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              if (needsConfig) {
                navigate(`/product/${product.slug}`);
                return;
              }
              quickAdd();
              navigate('/checkout');
            }}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:shadow-brand-500/25 disabled:opacity-50 sm:text-xs"
          >
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
