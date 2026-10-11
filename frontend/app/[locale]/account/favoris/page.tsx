'use client';

import Image from 'next/image';
import { Link } from '@/navigation';
import AccountSkeleton from '@/components/ui/skeletons/AccountSkeleton';
import { HeartOff } from 'lucide-react';
import { formatPrice, type Product } from '@/lib/data';
import { getProducts } from '@/lib/wp-products';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';

export default function AccountFavoritesPage() {
  const { favorites, toggleFavorite } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError('');
    getProducts()
      .then((items) => {
        if (!mounted) return;
        setProducts(items);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
        setError('Impossible de charger vos favoris.');
      }).finally(() => { if (mounted) setLoading(false); });
    return () => {
      mounted = false;
    };
  }, [retry]);

  const favoriteProducts = useMemo(
    () => favorites.map((id) => products.find((p) => p.id === id)).filter(Boolean),
    [favorites, products],
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-body">Favoris</h2>
        <p className="text-sm text-gray-600">Vos produits enregistrés</p>
      </div>

      {loading ? <AccountSkeleton /> : error ? <div role="alert">{error} <button className="underline" onClick={() => setRetry(n => n + 1)}>Réessayer</button></div> : favoriteProducts.length === 0 ? (
        <div className="bg-neutral-light rounded-xl p-6 text-center">
          <p className="text-gray-600">Aucun favori pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favoriteProducts.map((product) => {
            if (!product) return null;
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Link href={`/boutique/${product.slug}`} className="relative block aspect-square bg-gray-50">
                  <Image src={product.thumbnail} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                </Link>
                <div className="p-4">
                  <Link href={`/boutique/${product.slug}`}>
                    <p className="font-semibold text-body line-clamp-2">{product.name}</p>
                  </Link>
                  <p className="text-primary font-bold mt-2">{formatPrice(product.price)}</p>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product.id)}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-body font-medium hover:bg-neutral-light transition-colors"
                  >
                    <HeartOff className="w-4 h-4" />
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
