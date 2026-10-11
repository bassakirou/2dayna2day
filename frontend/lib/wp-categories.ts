import type { Category } from "@/lib/data";
import { wpFetch } from "@/lib/wp-client";

export async function getCategories(locale?: string): Promise<Category[]> {
  const qs = locale ? `?lang=${locale}` : "";
  const categories = await wpFetch<Category[]>(
    `/wp-json/2day/v1/product-categories${qs}`,
    {
      cache: process.env.NODE_ENV === "production" ? undefined : "no-store",
    }
  );
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }
  return categories.filter((c: Category) => c.slug !== 'uncategorized' && c.name.toLowerCase() !== 'non classé');
}
