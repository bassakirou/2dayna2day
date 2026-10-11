"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/data";
import { useCart } from "@/context/CartContext";

interface BannerBlockProps {
  title: string;
  subtitle: string;
  image: string;
  product?: Product;
}

export default function BannerBlock({
  title,
  subtitle,
  image,
  product,
}: BannerBlockProps) {
  const { addItem } = useCart();
  const available = !!product && product.stock !== 0;
  const addToCart = () => {
    if (!available || !product) return;
    addItem({ id: product.id, wpId: product.wpId, name: product.name,
      price: product.price, thumbnail: product.thumbnail, slug: product.slug,
      crossSells: product.crossSells });
  };
  return (
    <section className="relative min-h-[80vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image src={image} alt={title} fill sizes="100vw" className="object-cover" priority />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-heading leading-tight mb-6">
            {title}
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8">{subtitle}</p>
          {product && <div className="flex flex-col sm:flex-row gap-4">
            {available ? <Link
              href={`/checkout/direct/${product.slug}`}
              className="inline-flex items-center justify-center gap-2 bg-accent-red !text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-accent-red/90 transition-colors"
            >
              Commander directement <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link> : <button type="button" disabled className="bg-accent-red text-white px-8 py-4 rounded-full font-bold text-lg opacity-50 cursor-not-allowed">Indisponible</button>}
            <button type="button" onClick={addToCart} disabled={!available}
              className="inline-flex items-center justify-center gap-2 bg-black !text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Ajouter au panier <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>}
        </div>
      </div>

    </section>
  );
}
