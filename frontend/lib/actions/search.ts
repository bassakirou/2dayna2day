import { getProducts } from "@/lib/wp-products";
import type { Product } from "@/lib/data";

export interface SearchSuggestion {
  query: string;
  count: number;
}

export interface SearchResult {
  products: Product[];
  suggestions: SearchSuggestion[];
  total: number;
}

export async function searchProductsAction(
  query: string,
  locale: string,
): Promise<SearchResult> {
  if (!query || query.trim() === "") {
    return { products: [], suggestions: [], total: 0 };
  }

  // Fetch products matching the query
  const allProducts = await getProducts({ search: query, locale });

  // Get top 4 products for the right side
  const products = allProducts.slice(0, 4);

  // Generate suggestions (since WP doesn't have an autocomplete endpoint, we simulate it)
  // We can just use product names or categories from the results that start with the query
  const suggestionsMap = new Map<string, number>();

  allProducts.forEach((p) => {
    // Basic simulation: if the product name starts with the query, add it as a suggestion
    // Or if the product has categories, add the category name + query
    const lowerName = p.name.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerName.includes(lowerQuery)) {
      // Create a simplified suggestion term (e.g. first 3-4 words)
      const words = lowerName.split(" ");
      const matchIndex = words.findIndex((w) => w.includes(lowerQuery));
      
      if (matchIndex !== -1) {
        // Take the matched word and a couple of words after it
        const suggestionText = words.slice(0, Math.min(words.length, matchIndex + 3)).join(" ");
        if (suggestionText.length > query.length) {
          suggestionsMap.set(
            suggestionText,
            (suggestionsMap.get(suggestionText) || 0) + 1,
          );
        }
      }
    }
  });

  // If no suggestions generated, just use the product names as suggestions
  if (suggestionsMap.size === 0) {
    products.forEach((p) => {
      suggestionsMap.set(p.name.toLowerCase(), 1);
    });
  }

  const suggestions: SearchSuggestion[] = Array.from(suggestionsMap.entries())
    .map(([q, count]) => ({ query: q, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    products,
    suggestions,
    total: allProducts.length,
  };
}
