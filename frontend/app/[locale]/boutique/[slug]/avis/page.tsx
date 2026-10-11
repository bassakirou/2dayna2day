import { getProductSlugs } from "@/lib/wp-products";
import { locales } from "@/i18n";
import AvisClient from "./AvisClient";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

interface AvisPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AvisPage({ params }: AvisPageProps) {
  return <AvisClient params={params} />;
}
