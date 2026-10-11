import { ArrowLeft } from 'lucide-react';
import { Link } from "@/navigation";
import DirectCheckoutClient from "./DirectCheckoutClient";
import { getProductBySlugConnected, getProducts } from "@/lib/wp-products";

import { locales } from "@/i18n";

// Generate static params for all products so any product can be directly checked out
export async function generateStaticParams() {
  const remote = await getProducts().catch(() => []);
  const products = remote
    .filter((p) => p && typeof p.slug === "string")
    .map((product) => String(product.slug));
  return locales.flatMap((locale) => products.map((slug) => ({ locale, slug })));
}

export const dynamicParams = false;

interface DirectCheckoutPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

import { Suspense } from 'react';

// ... other code ...

export default async function DirectCheckoutPage({
  params,
}: DirectCheckoutPageProps) {
  const { slug } = await params;
  const product = await getProductBySlugConnected(slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-body mb-4">
            Produit non trouvé
          </h1>
          <Link href="/boutique" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft size={18} aria-hidden="true" />Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-light" />}>
      <DirectCheckoutClient product={product} />
    </Suspense>
  );
}
