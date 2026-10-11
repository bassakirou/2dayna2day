"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, ArrowRight, ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { searchProductsAction, type SearchResult } from "@/lib/actions/search";
import Image from "next/image";
import { Link, useRouter } from "@/navigation";
import { formatPrice } from "@/lib/data";

export default function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const locale = useLocale();
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const res = await searchProductsAction(query, locale);
          setResults(res);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const newRecent = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));

    setIsOpen(false);
    router.push(`/boutique?q=${encodeURIComponent(searchQuery)}`);
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter((s) => s !== term);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  return (
    <div ref={searchContainerRef} className="flex items-center">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 text-white hover:text-accent-yellow transition-colors"
          aria-label="Rechercher"
        >
          <Search className="w-6 h-6" />
        </button>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-50 flex items-center px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="w-full max-w-5xl mx-auto flex flex-col relative">
            {/* Search Input Area */}
            <div className="flex items-center w-full">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-primary transition-colors mr-2 sm:hidden"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="relative flex-1 flex items-center border-2 border-primary rounded-full px-4 py-2 bg-white">
                <Search className="w-5 h-5 text-primary mr-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Rechercher un produit..."
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="p-1 text-gray-400 hover:text-gray-600 mr-2 hidden sm:block"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleSearch()}
                  className="bg-primary text-white px-6 py-1.5 rounded-full font-semibold hover:bg-red-700 transition-colors hidden sm:block"
                >
                  Chercher
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-primary transition-colors ml-4 hidden sm:block"
              >
                Fermer
              </button>
            </div>

            {/* Megamenu Dropdown */}
            {(query.trim().length >= 2 || recentSearches.length > 0) && (
              <div className="absolute top-full left-0 mt-4 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
                <div className="flex flex-col lg:flex-row">
                  {/* Left Column: Suggestions & Recent */}
                  <div className="w-full lg:w-1/3 bg-gray-50 p-6 border-r border-gray-100">
                    {query.trim().length >= 2 && results ? (
                      <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                          Suggestions
                        </h3>
                        {isLoading && !results.suggestions.length ? (
                          <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ) : results.suggestions.length > 0 ? (
                          <ul className="space-y-3">
                            {results.suggestions.map((s, i) => (
                              <li key={i}>
                                <button
                                  onClick={() => handleSearch(s.query)}
                                  className="flex items-center justify-between w-full text-left group"
                                >
                                  <div className="flex items-center text-gray-700 group-hover:text-primary transition-colors">
                                    <Search className="w-4 h-4 mr-3 text-gray-400 group-hover:text-primary" />
                                    <span className="font-medium text-sm">
                                      {/* Highlight match */}
                                      {s.query.split(new RegExp(`(${query})`, "gi")).map((part, index) =>
                                        part.toLowerCase() === query.toLowerCase() ? (
                                          <strong key={index} className="text-black font-extrabold">{part}</strong>
                                        ) : (
                                          <span key={index}>{part}</span>
                                        )
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 hidden sm:block">
                                    {s.count} produits
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune suggestion</p>
                        )}
                      </div>
                    ) : null}

                    {recentSearches.length > 0 && !query && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                          Recherches récentes
                        </h3>
                        <ul className="space-y-3">
                          {recentSearches.map((term, i) => (
                            <li key={i}>
                              <button
                                onClick={() => handleSearch(term)}
                                className="flex items-center justify-between w-full text-left group"
                              >
                                <div className="flex items-center text-gray-600 group-hover:text-primary transition-colors">
                                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                                  <span className="text-sm">{term}</span>
                                </div>
                                <div
                                  onClick={(e) => removeRecentSearch(e, term)}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Products */}
                  <div className="w-full lg:w-2/3 p-6 bg-white flex flex-col">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Produits les plus pertinents
                    </h3>

                    {query.trim().length >= 2 ? (
                      isLoading ? (
                        <div className="grid gap-4">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="flex items-center animate-pulse">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                              <div className="ml-4 flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : results && results.products.length > 0 ? (
                        <>
                          <ul className="space-y-4 flex-1">
                            {results.products.map((product) => (
                              <li key={product.id}>
                                <Link
                                  href={`/boutique/${product.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-center group p-2 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image
                                      src={product.thumbnail}
                                      alt={product.name}
                                      width={64}
                                      height={64}
                                      className="object-cover mix-blend-multiply"
                                    />
                                  </div>
                                  <div className="ml-4 flex-1">
                                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-primary line-clamp-1">
                                      {product.name}
                                    </h4>
                                    <div className="flex items-center mt-1">
                                      <span className="text-primary font-bold text-sm">
                                        {formatPrice(product.price)}
                                      </span>
                                      {product.priceOld && (
                                        <span className="text-gray-400 text-xs line-through ml-2">
                                          {formatPrice(product.priceOld)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => handleSearch()}
                            className="mt-6 w-full py-3 bg-red-50 hover:bg-red-100 text-primary font-bold rounded-lg transition-colors flex items-center justify-center text-sm"
                          >
                            Voir les {results.total} résultats <ArrowRight className="w-4 h-4 ml-2" />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 py-12">
                          Aucun produit trouvé pour &quot;{query}&quot;
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 py-12 text-sm text-center">
                        Commencez à taper pour voir les produits suggérés
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
