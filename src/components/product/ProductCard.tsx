import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import { formatBDT } from '../../lib/utils';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useLangStore } from '../../stores/langStore';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCartStore((s) => s.add);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.has(product.id));
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/80"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800/50">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {product.bestseller && (
            <span className="absolute left-2 top-8 rounded-lg bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
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
            className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
              wished
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white/90 text-slate-500 hover:bg-white hover:text-red-500 dark:bg-slate-800/90 dark:text-slate-300'
            }`}
            aria-label="Toggle wishlist"
          >
            <FiHeart className={`h-3.5 w-3.5 ${wished ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="flex items-center gap-1 text-[10px] text-amber-500 sm:text-[11px]">
            <FiStar className="h-3 w-3 fill-current" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviewsCount})</span>
          </div>
          <h3 className={`mt-1 line-clamp-2 text-xs font-semibold leading-tight text-slate-800 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-300 sm:text-sm ${lang === 'bn' && product.nameBn ? 'font-bn' : ''}`}>
            {lang === 'bn' && product.nameBn ? product.nameBn : product.name}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
            <span className="text-sm font-bold text-brand-600 dark:text-brand-300 sm:text-base">{formatBDT(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs">{formatBDT(product.comparePrice)}</span>
            )}
          </div>
        </Link>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => {
              add(product, 1);
              toast.success('Added to cart');
            }}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-[10px] font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 sm:text-xs"
          >
            <FiShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Add
          </button>
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => {
              add(product, 1);
              navigate('/checkout');
            }}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 py-2 text-[10px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 sm:text-xs"
          >
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
