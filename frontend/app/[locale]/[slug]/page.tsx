import { Suspense } from "react";
import { locales } from "@/i18n";
import { wpFetch } from "@/lib/wp-client";
import DynamicContent from "@/components/ui/DynamicContent";

export const dynamicParams = false;
export async function generateStaticParams() {
  const reserved = new Set(["account", "checkout", "boutique", "category", "contact", "faq", "ventes-flash", "pages", "merci", "upsell", "a-propos"]);
  const slugs = new Set(["conditions-generales", "politique-de-confidentialite", "mentions-legales"]);
  try {
    for (let page = 1; ; page++) {
      const pages = await wpFetch<Array<{ slug: string }>>(`/wp-json/wp/v2/pages?per_page=100&page=${page}&_fields=slug`);
      for (const item of pages) if (!reserved.has(item.slug)) slugs.add(item.slug);
      if (pages.length < 100) break;
    }
  } catch { /* Pages remain accessible at /pages/?slug=... if the API is unavailable at build time. */ }
  return locales.flatMap(locale => Array.from(slugs, slug => ({ locale, slug })));
}
export default async function CMSPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Suspense fallback={<p>Chargement…</p>}><DynamicContent kind="cms" pageSlug={slug} /></Suspense>;
}
