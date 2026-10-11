'use client';

import { Heart, List, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ProductMobileNavProps {
  productId: string;
  productSlug: string;
}

export default function ProductMobileNav({ productId, productSlug }: ProductMobileNavProps) {
  const { user, favorites, toggleFavorite } = useAuth();
  const isFavorite = Boolean(user && favorites.includes(productId));

  const handleFavorite = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }));
      return;
    }
    toggleFavorite(productId);
  };

  const handleChat = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }));
      return;
    }
    window.dispatchEvent(new CustomEvent('open-chat', { detail: { productSlug } }));
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black text-white border-t border-gray-800 flex justify-around items-center px-2 py-3 z-[60] pb-safe">
      <button onClick={handleFavorite} className="flex flex-col items-center gap-1">
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
        <span className="text-[10px] font-medium">Favoris</span>
      </button>

      <Link href={`/boutique/${productSlug}/caracteristiques`} className="flex flex-col items-center gap-1">
        <List className="w-5 h-5" />
        <span className="text-[10px] font-medium">Spécifications</span>
      </Link>

      <button onClick={handleChat} className="flex flex-col items-center gap-1">
        <MessageCircle className="w-5 h-5" />
        <span className="text-[10px] font-medium">Discuter</span>
      </button>

      <Link href={`/boutique/${productSlug}/avis`} className="flex flex-col items-center gap-1">
        <Star className="w-5 h-5" />
        <span className="text-[10px] font-medium">Avis</span>
      </Link>
    </div>
  );
}
