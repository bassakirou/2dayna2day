import { getProductBySlugConnected, getProductSlugs } from "@/lib/wp-products";
import ProductRenderSwitch from "@/components/ui/ProductRenderSwitch";
import { Link } from "@/navigation";
import { ArrowLeft, List, Star } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductFavoriteButton from "@/components/ui/ProductFavoriteButton";
import ProductMobileNav from "@/components/ui/ProductMobileNav";
import SuggestedProductsBlock from "@/components/blocks/SuggestedProductsBlock";

import { locales } from "@/i18n";

// Generate static params for all products
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, locale } = await params;
  const product = await getProductBySlugConnected(slug, locale);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-body mb-4">
            Produit non trouvé
          </h1>
          <p className="text-gray-600 mb-6">
            Le produit que vous recherchez n&apos;existe pas.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 text-primary hover:text-accent-blue transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à la boutique</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Boutique", href: "/boutique" },
          { label: product.name },
        ]}
      />

      <Link
        href={`/boutique/${product.slug}/caracteristiques`}
        className="fixed bottom-20 right-5 z-50 hidden md:inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-3 shadow-lg hover:bg-primary/90 transition-colors"
      >
        <List className="w-5 h-5" />
        <span className="font-medium">Voir les caractéristiques</span>
      </Link>

      <Link
        href={`/boutique/${product.slug}/avis`}
        className="fixed bottom-36 right-5 z-50 hidden md:inline-flex items-center gap-2 rounded-full bg-body text-white px-4 py-3 shadow-lg hover:bg-body/90 transition-colors"
      >
        <Star className="w-5 h-5" />
        <span className="font-medium">Avis clients</span>
      </Link>

      <ProductFavoriteButton
        productId={product.id}
        className="fixed bottom-5 left-5 z-50 hidden md:inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-3 shadow-lg hover:bg-primary/90 transition-colors"
      />

      <ProductRenderSwitch product={product} />

      {product.suggestedProducts && product.suggestedProducts.length > 0 && (
        <SuggestedProductsBlock products={product.suggestedProducts} />
      )}

      <ProductMobileNav productId={product.id} productSlug={product.slug} />
    </div>
  );
}
