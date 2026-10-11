import { Link } from "@/navigation";
import { ArrowRight } from "lucide-react";
import { getCategories } from "@/lib/wp-categories";
import { getProducts } from "@/lib/wp-products";

export default async function CategoriesPage() {
  const categories = await getCategories();
  const products = await getProducts();
  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            Nos Catégories
          </h1>
          <p className="text-white/80 max-w-2xl">
            Explorez nos différentes catégories de produits tech reconditionnés
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const productCount =
              typeof category.count === "number"
                ? category.count
                : products.filter((p) => p.category === category.id).length;

            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <h2 className="text-xl font-bold text-body mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                      {category.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {productCount} produit{productCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
