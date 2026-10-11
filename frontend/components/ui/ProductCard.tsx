"use client";

import { Link } from "@/navigation";
import Image from "next/image";
import { ShoppingCart, ArrowRight, Heart } from "lucide-react";
import { Product, formatPrice } from "@/lib/data";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {useLiveProductPricing} from '@/lib/use-live-product-pricing';

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  viewMode?: "grid" | "list";
}

export default function ProductCard({
  product: initialProduct,
  showQuickAdd = true,
  viewMode = "grid",
}: ProductCardProps) {
  const product = useLiveProductPricing(initialProduct);
  const isVariable = product.type === "variable";
  const prices = product.variations?.map(v => v.price).filter(Number.isFinite) ?? [];
  const minimumPrice = prices.length ? Math.min(...prices) : product.price;
  const { addItem } = useCart();
  const { user, favorites, toggleFavorite } = useAuth();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVariable || product.stock <= 0) return;
    addItem({
      id: product.id,
      wpId: product.wpId,
      name: product.name,
      price: product.price,
      thumbnail: product.thumbnail,
      slug: product.slug,
      crossSells: product.crossSells,
    });
  };

  const discountPercent = product.priceOld
    ? Math.round(((product.priceOld - product.price) / product.priceOld) * 100)
    : null;

  const isFavorite = Boolean(user && favorites.includes(product.id));

  const finalThumbnailSrc =
    product.thumbnail && typeof product.thumbnail === "string" && product.thumbnail.trim() !== ""
      ? product.thumbnail
      : "/images/hero-products.png";

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-row items-stretch">
        {/* Image Container */}
        <Link
          href={`/boutique/${product.slug}`}
          className="relative block w-32 h-auto min-h-[128px] sm:w-48 sm:min-h-[192px] shrink-0 overflow-hidden bg-gray-50"
        >
          <Image
            src={finalThumbnailSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 192px"
          />

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-2 left-2 bg-accent-red text-neutral-dark text-xs font-bold px-2 py-0.5 rounded-full">
              {product.badge}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) {
                window.dispatchEvent(
                  new CustomEvent("open-auth-modal", {
                    detail: { tab: "login" },
                  }),
                );
                return;
              }
              toggleFavorite(product.id);
            }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-primary p-1.5 rounded-full shadow-sm transition-colors"
            aria-label={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary" : ""}`} />
          </button>

          {/* Discount Badge */}
          {discountPercent && (
            <span className={product.specialPromotion ? "absolute top-10 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full" : "absolute top-10 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"}>
              {product.specialPromotion ? `Spécial -${product.specialPromotion.percent}%` : `-${discountPercent}%`}
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <div>
              {/* Category */}
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {product.category}
              </p>

              {/* Title */}
              <Link href={`/boutique/${product.slug}`}>
                <h3 className="font-semibold text-lg text-body hover:text-primary transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
            </div>
            
            {/* Price (Top right in list view) */}
            <div className="text-right ml-4">
              <div className="text-xl font-bold text-primary">
                {isVariable ? "Dès " : ""}{formatPrice(isVariable ? minimumPrice : product.price)}
              </div>
              {product.priceOld && (
                <div className="text-sm text-gray-400 line-through">
                  {formatPrice(product.priceOld)}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
            {product.description}
          </p>

          {/* Stock & CTA */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <span
              className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}
            >
              {product.stock > 0
                ? `${product.stock} en stock`
                : "Rupture de stock"}
            </span>

            {product.checkoutType === "direct" ? (
              <Link
                href={`/boutique/${product.slug}`}
                className="flex items-center space-x-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-primary px-4 py-2 rounded-lg transition-colors"
              >
                <span>Voir les détails</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={handleQuickAdd}
                disabled={product.stock === 0}
                className="flex items-center space-x-2 text-sm font-medium bg-primary hover:bg-accent-blue text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ajouter au panier</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <Link
        href={`/boutique/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-gray-50"
      >
        <Image
          src={finalThumbnailSrc}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Badge */}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-accent-red text-neutral-dark text-xs font-bold px-3 py-1 rounded-full">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
              window.dispatchEvent(
                new CustomEvent("open-auth-modal", {
                  detail: { tab: "login" },
                }),
              );
              return;
            }
            toggleFavorite(product.id);
          }}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-primary p-2 rounded-full shadow-sm transition-colors"
          aria-label={
            isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary" : ""}`} />
        </button>

        {/* Discount Badge */}
        {discountPercent && (
          <span className={product.specialPromotion ? "absolute top-12 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full" : "absolute top-12 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full"}>
            {product.specialPromotion ? `Spécial -${product.specialPromotion.percent}%` : `-${discountPercent}%`}
          </span>
        )}

        {/* Quick Add Button */}
        {showQuickAdd && !isVariable && product.checkoutType === "classic" && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 bg-primary text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-accent-blue"
            aria-label="Ajouter au panier"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {product.category}
        </p>

        {/* Title */}
        <Link href={`/boutique/${product.slug}`}>
          <h3 className="font-semibold text-body hover:text-primary transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-bold text-primary">
            {isVariable ? "Dès " : ""}{formatPrice(isVariable ? minimumPrice : product.price)}
          </span>
          {product.priceOld && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.priceOld)}
            </span>
          )}
        </div>

        {/* Stock & CTA */}
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}
          >
            {product.stock > 0
              ? `${product.stock} en stock`
              : "Rupture de stock"}
          </span>

          {product.checkoutType === "direct" ? (
            <Link
              href={`/boutique/${product.slug}`}
              className="flex items-center space-x-1 text-sm font-medium text-primary hover:text-accent-blue transition-colors"
            >
              <span>Voir</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={product.stock === 0}
              className="flex items-center space-x-1 text-sm font-medium text-primary hover:text-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Ajouter</span>
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
