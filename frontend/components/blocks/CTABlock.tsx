"use client";

import { Link, usePathname } from "@/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/data";
import { useCart } from "@/context/CartContext";

interface CTABlockProps {
  text?: string;
  bgColor?: string;
  textColor?: string;
  buttonText?: string;
  cartButtonText?: string;
  product?: Product;
}

export default function CTABlock({
  text,
  bgColor,
  textColor,
  buttonText,
  cartButtonText,
  product,
}: CTABlockProps) {
  const pathname = usePathname();
  const { addItem } = useCart();
  const segments = pathname.split("/").filter(Boolean);
  const productSlug = product?.slug || segments[1];
  const href = productSlug ? `/upsell/${productSlug}` : "/checkout";
  const resolvedBgColor = bgColor || "#0f172a";
  const resolvedTextColor = textColor || "#ffffff";
  const resolvedButtonText = buttonText || "Commander maintenant";
  const resolvedCartButtonText = cartButtonText || "Ajouter au panier";

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        wpId: product.wpId,
        name: product.name,
        price: product.price,
        thumbnail: product.thumbnail,
        slug: product.slug,
        crossSells: product.crossSells,
      });
    }
  };

  return (
    <section
      id="checkout"
      className="py-16 sm:py-24"
      style={{ backgroundColor: resolvedBgColor }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl shadow-xl p-8 sm:p-12 text-center"
          style={{ color: resolvedTextColor }}
        >
          {text ? (
            <p className="text-xl sm:text-2xl font-semibold mb-8">{text}</p>
          ) : null}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={href}
              className="inline-flex items-center space-x-3 bg-accent-red text-neutral-dark px-8 py-4 rounded-full font-bold text-lg hover:bg-accent-red/90 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <span>{resolvedButtonText}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            {product && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="inline-flex items-center space-x-3 bg-white text-primary border-2 border-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-neutral-light transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{resolvedCartButtonText}</span>
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
