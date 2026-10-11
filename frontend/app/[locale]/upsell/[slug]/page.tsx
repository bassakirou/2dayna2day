import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { getProductBySlugConnected, getProductSlugs } from '@/lib/wp-products';
import UpsellClient from './UpsellClient';
import { Link } from '@/navigation';

import { locales } from "@/i18n";

// Generate static params for all products
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

interface UpsellPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function UpsellPage({ params }: UpsellPageProps) {
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
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <UpsellClient product={product} />
    </Suspense>
  );
}
