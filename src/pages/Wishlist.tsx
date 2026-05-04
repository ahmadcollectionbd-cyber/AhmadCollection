import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiHeart } from 'react-icons/fi';
import { useMemo } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { ProductCard } from '../components/product/ProductCard';

export function Wishlist() {
  const ids = useWishlistStore((s) => s.ids);
  const all = useDataStore((s) => s.products);
  const products = useMemo(() => all.filter((p) => ids.includes(p.id)), [all, ids]);

  return (
    <>
      <Helmet><title>Wishlist — Ahmad Collection</title></Helmet>
      <section className="section mt-8">
        <h1 className="heading text-2xl font-extrabold sm:text-3xl">My Wishlist</h1>
        <p className="text-sm text-slate-500">{products.length} saved items</p>
        {products.length === 0 ? (
          <div className="card mt-6 p-12 text-center">
            <FiHeart className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm text-slate-500">No items in your wishlist yet.</p>
            <Link to="/shop" className="btn-primary mt-4 inline-flex">Browse products</Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </>
  );
}
