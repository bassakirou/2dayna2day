import type { Product } from "@/lib/data";
import { wpFetch } from "@/lib/wp-client";

type WpProduct = {
  specialPromotion?: Product['specialPromotion'];
  type?: Product["type"];
  attributes?: Product["attributes"];
  variations?: Product["variations"];
  crossSells?: Product["crossSells"];
  suggestedProducts?: Product["suggestedProducts"];
  wpId: number;
  id: string;
  slug: string;
  name: string;
  category: string;
  categories?: string[];
  price: number;
  priceOld: number | null;
  currency: string;
  stock: number;
  badge: string | null;
  thumbnail: string;
  images?: string[];
  upsellId: string | null;
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
  checkoutType: "direct" | "classic";
  description: string;
  fullDescription?: string;
  specifications?: unknown;
  blocks: unknown[];
  reviewCriteria?: string[];
  meta?: Record<string, unknown>;
};

function mapWpProduct(input: WpProduct): Product {
  return {
    id: input.slug,
    type: input.type ?? "simple",
    attributes: input.attributes ?? [],
    variations: input.variations ?? [],
    crossSells: input.crossSells ?? [],
    suggestedProducts: input.suggestedProducts ?? [],
    images: input.images,
    specifications: input.specifications as Product["specifications"],
    wpId: String(input.wpId),
    slug: input.slug,
    name: input.name,
    category: input.category,
    price: input.price,
    specialPromotion: input.specialPromotion ?? null,
    priceOld: input.priceOld ?? null,
    currency: input.currency,
    stock: input.stock,
    badge: input.badge ?? null,
    thumbnail: input.thumbnail,
    upsellId: input.upsellId ?? null,
    twodayUpsell: input.twodayUpsell ?? null,
    checkoutType: input.checkoutType,
    description: input.description,
    fullDescription: input.fullDescription,
    blocks: (Array.isArray(input.blocks) ? input.blocks.filter(block => (block as {type?: string})?.type !== 'pricing') : []) as Product["blocks"],
    reviewCriteria: Array.isArray(input.reviewCriteria) ? input.reviewCriteria : [],
    builderEnabled: input.meta && typeof input.meta['_2day_product_builder_enabled'] === 'boolean' 
      ? input.meta['_2day_product_builder_enabled'] 
      : true,
  };
}

export async function getProductsFromWp(input?: {
  search?: string;
  category?: string;
  locale?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (input?.search) params.set("search", input.search);
  if (input?.category) params.set("category", input.category);
  if (input?.locale) params.set("lang", input.locale);

  const qs = params.toString();
  const res = await wpFetch<{ items: WpProduct[] }>(
    `/wp-json/2day/v1/products${qs ? `?${qs}` : ""}`,
    {
      cache: process.env.NODE_ENV === "production" ? undefined : "no-store",
    }
  );
  const items = Array.isArray(res.items) ? res.items : [];
  return items.map(mapWpProduct);
}

export async function getProducts(input?: {
  search?: string;
  category?: string;
  locale?: string;
}): Promise<Product[]> {
  const items = await getProductsFromWp(input);
  return items;
}

export async function getProductBySlugFromWp(slug: string, locale?: string): Promise<Product | null> {
  const qs = locale ? `?lang=${locale}` : "";
  const res = await wpFetch<WpProduct>(
    `/wp-json/2day/v1/products/${encodeURIComponent(slug)}${qs}`,
    {
      cache: process.env.NODE_ENV === "production" ? undefined : "no-store",
    }
  );
  return mapWpProduct(res);
}

export async function getProductBySlugConnected(slug: string, locale?: string): Promise<Product | null> {
  return await getProductBySlugFromWp(slug, locale);
}

export async function getProductSlugs(): Promise<string[]> {
  const list = await getProducts();
  return list.map((p) => p.slug);
}
