"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/data";
import ProductCard from "@/components/ui/ProductCard";

export default function BoutiqueClient({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [searchQuery, setSearchQuery] = useState(q);
  const [showSearch, setShowSearch] = useState(!!q);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (q) {
      setSearchQuery(q);
      setShowSearch(true);
    }
  }, [q]);

  let filteredProducts = products;

  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (p) => p.category === selectedCategory,
    );
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  switch (sortBy) {
    case "price-asc":
      filteredProducts = [...filteredProducts].sort(
        (a, b) => a.price - b.price,
      );
      break;
    case "price-desc":
      filteredProducts = [...filteredProducts].sort(
        (a, b) => b.price - a.price,
      );
      break;
    case "name":
      filteredProducts = [...filteredProducts].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      break;
    default:
      break;
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            Notre Boutique
          </h1>
          <p className="text-white/80 max-w-2xl">
            Découvrez notre sélection de produits tech reconditionnés :
            MacBooks, montres connectées, casques et accessoires.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl p-4 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex gap-3">
                <div className="flex-1 max-w-md">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  showSearch 
                    ? "bg-primary text-white border-primary" 
                    : "border-gray-200 text-gray-600 hover:text-primary bg-white"
                }`}
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            </div>
            

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {/* <SlidersHorizontal className="w-5 h-5 text-gray-400" /> */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="featured">En vedette</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="name">Nom A-Z</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-primary text-white" : "text-gray-400"}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-primary text-white" : "text-gray-400"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {showSearch && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} produit
            {filteredProducts.length !== 1 ? "s" : ""} trouvé
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
            <p className="text-gray-400">
              Essayez une autre recherche ou catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
