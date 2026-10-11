import { getProductSlugs } from "@/lib/wp-products";
import { locales } from "@/i18n";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default function AvisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
