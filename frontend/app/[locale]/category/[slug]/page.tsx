import { Link } from "@/navigation";
import { ArrowLeft } from "lucide-react";
import { getCategories } from "@/lib/wp-categories";
import { getProducts } from "@/lib/wp-products";
import ProductCard from "@/components/ui/ProductCard";

// Generate static params for all categories
import { locales } from "@/i18n";

export async function generateStaticParams() {
  const categories = await getCategories();
  return locales.flatMap((locale) => categories.map((c) => ({ locale, slug: c.slug })));
}

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, locale } = await params;
  const categories = await getCategories(locale);
  const category = categories.find((c) => c.slug === slug);
  const products = await getProducts({ category: slug, locale });
  const categoryProducts = products.filter(
    (p) => p.category === slug || p.category === category?.id,
  );

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-body mb-4">
            Catégorie non trouvée
          </h1>
          <p className="text-gray-600 mb-6">
            La catégorie que vous recherchez n&apos;existe pas.
          </p>
          <Link
            href="/category"
            className="inline-flex items-center space-x-2 text-primary hover:text-accent-blue transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voir toutes les catégories</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 mb-4">
            <Link
              href="/category"
              className="text-white/70 hover:text-white transition-colors"
            >
              Catégories
            </Link>
            <span className="text-white/50">/</span>
            <span>{category.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            {category.name}
          </h1>
          <p className="text-white/80 max-w-2xl">{category.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {categoryProducts.length} produit
            {categoryProducts.length !== 1 ? "s" : ""} dans cette catégorie
          </p>
        </div>

        {/* Products Grid */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">
              Aucun produit dans cette catégorie
            </p>
            <p className="text-gray-400">
              Revenez bientôt, de nouveaux produits arrivent !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
