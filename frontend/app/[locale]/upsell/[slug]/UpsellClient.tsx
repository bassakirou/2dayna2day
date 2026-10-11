"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import Image from "next/image";
import { Check, X, ArrowRight, ArrowLeft, Clock, Sparkles } from "lucide-react";
import { formatPrice, type Product } from "@/lib/data";
import { Link } from "@/navigation";
import { getProductBySlugFromWp } from "@/lib/wp-products";

interface UpsellClientProps {
  product: Product;
}

export default function UpsellClient({ product }: UpsellClientProps) {
  const router = useRouter();
  const [currentProduct, setCurrentProduct] = useState(product);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const upsellData = currentProduct.twodayUpsell;

  useEffect(() => {
    let active = true;
    getProductBySlugFromWp(product.slug).then(value => {
      if (active && value) setCurrentProduct(value);
    }).catch(() => {
      if (active) setError("Impossible de charger les offres. Vous pouvez continuer sans ajout.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [product.slug]);

  const checkoutUrl = (upsell?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (upsell) params.set("upsell", upsell);
    else params.delete("upsell");
    const query = params.toString();
    return `/checkout/direct/${product.slug}${query ? `?${query}` : ""}`;
  };
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // If no upsell found, redirect to checkout
    if (!loading && !error && (!upsellData || !upsellData.products || upsellData.products.length === 0)) {
      router.replace(`/checkout/direct/${product.slug}${window.location.search}`);
    }
  }, [upsellData, product.slug, router, loading, error]);

  if (loading) return <p role="status" className="p-8">Chargement des offres…</p>;

  if (!upsellData || !upsellData.products || upsellData.products.length === 0) {
    return <div className="p-8"><p role="alert">{error || "Aucune offre complémentaire."}</p><button onClick={() => router.push(checkoutUrl())} className="underline">Continuer au paiement</button></div>;
  }

  const upsells = upsellData.products;
  const currentUpsell = upsells[currentIndex];
  const avantages = upsellData.avantages || [];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % upsells.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + upsells.length) % upsells.length);
  };

  const handleAddUpsell = async () => {
    setIsAdding(true);
    // Add upsell param to checkout URL
    router.push(checkoutUrl(currentUpsell.slug));
  };

  const handleSkip = () => {
    router.push(checkoutUrl());
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <header className="bg-primary py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href={`/boutique/${product.slug}`} className="inline-flex items-center text-white hover:text-accent-yellow transition-colors font-medium text-lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Link>
          <span className="text-xl font-bold text-white font-heading">
            2dayna<span className="text-accent-yellow">2day</span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Timer Banner */}
          <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-center space-x-2">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">
              Offre exclusive avant de valider !
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-center mb-6">
              <span className="inline-flex items-center space-x-2 bg-accent-red/20 text-neutral-dark px-4 py-2 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Offre spéciale</span>
              </span>
            </div>

            {/* Carousel Navigation (if multiple) */}
            {upsells.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrev} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-gray-500">
                  {currentIndex + 1} / {upsells.length}
                </span>
                <button onClick={handleNext} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Product */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={currentUpsell.thumbnail || "/placeholder.jpg"}
                  alt={currentUpsell.name}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-body mb-2">
                  {currentUpsell.name}
                </h2>
                <p className="text-gray-600 text-sm mb-3">
                  {currentUpsell.description}
                </p>
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(currentUpsell.price)}
                  </span>
                  {currentUpsell.priceOld && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(currentUpsell.priceOld)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Benefits */}
            {avantages.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-8">
                <p className="font-medium text-body mb-3">
                  En ajoutant cet article :
                </p>
                <ul className="space-y-2">
                  {avantages.map((av, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{av}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAddUpsell}
                disabled={isAdding}
                className="w-full bg-accent-red text-neutral-dark py-4 rounded-full font-bold hover:bg-accent-red/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isAdding ? (
                  <span>Redirection...</span>
                ) : (
                  <>
                    <span>Oui, j&apos;ajoute à ma commande</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                className="w-full py-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Non merci, passer au paiement</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
