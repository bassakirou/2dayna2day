/**
 * lib/data.ts
 *
 * Types centralisés et configuration du site.
 * Toutes les données produits/catégories viennent exclusivement de WordPress.
 */

// Types pour les données
export interface ProductSpecificationItem {
  label: string;
  value: string;
}

export interface ProductSpecificationSection {
  title: string;
  items: ProductSpecificationItem[];
}

export interface ProductSpecifications {
  sections: ProductSpecificationSection[];
}

export interface ProductVariation {
  specialPromotion?: Product['specialPromotion'];
  id: number;
  attributes: Record<string, string>;
  price: number;
  priceOld: number | null;
  image: string | null;
  inStock: boolean;
  stock?: number | null;
}

export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface Product {
  specialPromotion?: {price: number; regularPrice: number; percent: number; endsAt: string; type: string; value: number} | null;
  type?: "simple" | "variable";
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  id: string;
  wpId?: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  priceOld: number | null;
  currency: string;
  stock: number;
  badge: string | null;
  thumbnail: string;
  images?: string[];
  upsellId?: string | null;
  twodayUpsell?: {
    products: {
      wpId: number;
      slug: string;
      name: string;
      price: number;
      priceOld: number | null;
      thumbnail: string;
      description: string;
    }[];
    avantages: string[];
  } | null;
  suggestedProducts?: {
    wpId: number;
    id: string;
    slug: string;
    name: string;
    price: number;
    priceOld: number | null;
    thumbnail: string;
    badge: string | null;
  }[];
  crossSells?: {
    wpId: number;
    id: string;
    slug: string;
    name: string;
    price: number;
    priceOld: number | null;
    thumbnail: string;
    badge: string | null;
  }[];
  checkoutType?: "direct" | "classic";
  description: string;
  fullDescription?: string;
  specifications?: ProductSpecifications;
  blocks: Block[];
  reviewCriteria?: string[];
  builderEnabled?: boolean;
}

export interface Block {
  type: string;
  [key: string]: unknown;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  count?: number;
}

export interface Upsell {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  priceOld: number;
  currency: string;
  thumbnail: string;
  badge: string;
  savings: string;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  product: string;
  avatar: string;
}

export interface PaymentMethod {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  number: string;
}

export interface PaymentPlan {
  id: string;
  label: string;
  discount: number;
  description: string;
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  paymentMethods: PaymentMethod[];
  paymentPlans: PaymentPlan[];
  deliveryZones: string[];
  whatsapp: string;
  instagram: string;
  email: string;
}

// ============================================
// Configuration du site (inlinée)
// ============================================
export const siteConfig: SiteConfig = {
  siteName: "2dayna2day",
  tagline: "Tech reconditionnée testée, garantie et livrée au Cameroun",
  currency: "XAF",
  currencySymbol: "FCFA",
  paymentMethods: [
    {
      id: "orange_money",
      label: "Orange Money",
      shortLabel: "OM",
      color: "#FF6600",
      number: "+237 690 123 456",
    },
    {
      id: "mtn_momo",
      label: "MTN Mobile Money",
      shortLabel: "MoMo",
      color: "#FFCC00",
      number: "+237 680 987 654",
    },
    {
      id: "card",
      label: "Carte bancaire",
      shortLabel: "Carte",
      color: "#111827",
      number: "Paiement en ligne",
    },
    {
      id: "paypal",
      label: "PayPal",
      shortLabel: "PayPal",
      color: "#003087",
      number: "contact@2dayna2day.cm",
    },
  ],
  paymentPlans: [
    {
      id: "full",
      label: "100% maintenant",
      discount: 5,
      description: "Paiement total avant livraison (-5%)",
    },
    {
      id: "split",
      label: "60% maintenant / 40% à la livraison",
      discount: 0,
      description: "Paiement en deux fois",
    },
  ],
  deliveryZones: ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Bamenda"],
  whatsapp: "+237 690 123 456",
  instagram: "@2dayna2day",
  email: "contact@2dayna2day.cm",
};

// Fonctions utilitaires

/**
 * Formate un prix en FCFA
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR").replace(/\s/g, " ") + " FCFA";
}

/**
 * Calcule le prix avec réduction
 */
export function calculateDiscountedPrice(
  price: number,
  discountPercent: number,
): number {
  return Math.round(price * (1 - discountPercent / 100));
}

/**
 * Génère un numéro de commande unique
 */
export function generateOrderNumber(): string {
  const prefix = "2DAY";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
