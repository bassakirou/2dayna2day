'use client';

import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProductFavoriteButtonProps {
  productId: string;
  className?: string;
}

export default function ProductFavoriteButton({ productId, className }: ProductFavoriteButtonProps) {
  const { user, favorites, toggleFavorite } = useAuth();
  const isFavorite = Boolean(user && favorites.includes(productId));

  return (
    <button
      type="button"
      onClick={() => {
        if (!user) {
          window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }));
          return;
        }
        toggleFavorite(productId);
      }}
      className={className}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
      <span className="font-medium">Favori</span>
    </button>
  );
}
