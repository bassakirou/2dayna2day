'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NegotiateButtonProps {
  productSlug?: string;
  className?: string;
  label?: string;
}

export default function NegotiateButton({ productSlug, className = '', label = 'Négocier le prix' }: NegotiateButtonProps) {
  const pathname = usePathname();

  const handleNegotiate = () => {
    const slug = productSlug || pathname.split('/')[2];
    if (slug) {
      window.dispatchEvent(new CustomEvent('open-chat', { detail: { productSlug: slug } }));
    } else {
      window.dispatchEvent(new CustomEvent('open-chat', { detail: {} }));
    }
  };

  return (
    <button
      type="button"
      onClick={handleNegotiate}
      className={`inline-flex items-center justify-center font-medium transition-colors ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {label}
    </button>
  );
}