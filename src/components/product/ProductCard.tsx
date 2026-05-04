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
      className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/80 backdrop-blur transition hover:-translate-y-1 hover:shadow-glow-brand dark:border-white/10 dark:bg-slate-900/60"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-soft">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          {discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow-accent">
              -{discount}%
            </span>
          )}
          {product.bestseller && (
            <span className="absolute left-3 top-10 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              <FiZap className="mr-0.5 inline h-2.5 w-2.5" />Bestseller
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
              toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
            }}
            className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition ${
              wished
                ? 'bg-accent-500 text-white shadow-glow-accent'
                : 'bg-white/90 text-slate-700 hover:bg-white dark:bg-slate-900/80 dark:text-slate-200'
            }`}
            aria-label="Toggle wishlist"
          >
            <FiHeart className={`h-4 w-4 ${wished ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="flex items-center gap-1 text-[11px] text-amber-500">
            <FiStar className="h-3 w-3 fill-current" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviewsCount})</span>
          </div>
          <h3 className={`mt-1 line-clamp-2 text-sm font-semibold leading-tight text-slate-900 group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-300 ${lang === 'bn' && product.nameBn ? 'font-bn' : ''}`}>
            {lang === 'bn' && product.nameBn ? product.nameBn : product.name}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-brand-700 dark:text-brand-300">{formatBDT(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-slate-400 line-through">{formatBDT(product.comparePrice)}</span>
            )}
          </div>
        </Link>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => {
              add(product, 1);
              toast.success('Added to cart');
            }}
            className="btn-outline text-xs"
          >
            <FiShoppingCart className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => {
              add(product, 1);
              navigate('/checkout');
            }}
            className="btn-primary text-xs"
          >
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
