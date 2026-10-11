import Image from "next/image";
import { Link } from "@/navigation";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { formatPrice } from "@/lib/data";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NegotiateButton from "@/components/ui/NegotiateButton";
import ProductFavoriteButton from "@/components/ui/ProductFavoriteButton";
import ProductMobileNav from "@/components/ui/ProductMobileNav";
import { getProductBySlugConnected, getProductSlugs } from "@/lib/wp-products";

import { locales } from "@/i18n";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

interface ProductSpecsPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProductSpecsPage({
  params,
}: ProductSpecsPageProps) {
  const { slug } = await params;
  const product = await getProductBySlugConnected(slug);

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

  const ctaHref = (
    product.blocks.find((b) => b.type === "cta") as
      | { cta?: { href?: string } }
      | undefined
  )?.cta?.href;
  const orderHref =
    (ctaHref && ctaHref.startsWith("/checkout") ? ctaHref : undefined) ||
    (product.checkoutType === "direct"
      ? `/upsell/${product.slug}`
      : "/checkout");

  const sections = product.specifications?.sections?.length
    ? product.specifications.sections
    : [
        {
          title: "Caractéristiques",
          items: [
            { label: "Description", value: product.description },
            ...product.blocks
              .filter((b) => b.type === "features")
              .flatMap(
                (b) =>
                  (b as { items?: Array<{ title: string; text: string }> })
                    .items || [],
              )
              .map((item) => ({ label: item.title, value: item.text })),
          ],
        },
      ];

  const discountPercent = product.priceOld
    ? Math.round(((product.priceOld - product.price) / product.priceOld) * 100)
    : null;

  return (
    <div className="min-h-screen bg-neutral-light">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Boutique", href: "/boutique" },
          { label: product.name, href: `/boutique/${product.slug}` },
          { label: "Caractéristiques" },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/boutique/${product.slug}`}
            className="inline-flex items-center space-x-2 text-primary hover:text-accent-blue transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à la description</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-5 flex items-start gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                className="object-cover"
                sizes="112px"
              />
              {product.badge && (
                <span className="absolute top-2 left-2 bg-accent-red text-neutral-dark text-[10px] font-bold px-2 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
              {discountPercent && (
                <span className={product.specialPromotion ? "absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full" : "absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full"}>
                  {product.specialPromotion ? `Spécial -${product.specialPromotion.percent}%` : `-${discountPercent}%`}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-body leading-snug mb-2">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                <span className="text-xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.priceOld && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.priceOld)}
                  </span>
                )}
                <span
                  className={`text-xs ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {product.stock > 0
                    ? `${product.stock} en stock`
                    : "Rupture de stock"}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <Link
                  href={orderHref}
                  className="inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Commander
                </Link>
                <NegotiateButton
                  productSlug={product.slug}
                  className="bg-white border border-primary text-primary px-4 py-2 rounded-full hover:bg-primary/5"
                  label="Négocier"
                />
              </div>
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          >
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-bold text-body">{section.title}</h2>
              <p className="text-sm text-gray-600">Détails</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-light">
                  <tr>
                    <th className="text-left font-semibold text-body px-5 py-3 w-1/3">
                      Caractéristique
                    </th>
                    <th className="text-left font-semibold text-body px-5 py-3">
                      Détail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item) => (
                    <tr key={item.label} className="border-t">
                      <td className="px-5 py-4 text-body font-medium align-top">
                        {item.label}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Link
            href={`/boutique/${product.slug}`}
            className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-gray-200 bg-white text-body font-medium hover:bg-neutral-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la description
          </Link>
          <div className="flex flex-col sm:flex-row gap-3">
            <NegotiateButton
              productSlug={product.slug}
              className="px-5 py-3 rounded-full border-2 border-primary bg-white text-primary font-bold hover:bg-primary/5"
              label="Négocier le prix"
            />
            <Link
              href={orderHref}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Commander
            </Link>
          </div>
        </div>
      </div>

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

      <ProductMobileNav productId={product.id} productSlug={product.slug} />
    </div>
  );
}
