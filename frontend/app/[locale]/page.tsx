import { Link } from "@/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  Star,
  Phone,
} from "lucide-react";
import RecentTestimonials from "@/components/ui/RecentTestimonials";
import ActiveFlashSales from "@/components/blocks/ActiveFlashSales";
import { siteConfig, formatPrice } from "@/lib/data";
import { getCategories } from "@/lib/wp-categories";
import { getProducts } from "@/lib/wp-products";
import ProductCard from "@/components/ui/ProductCard";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });
  const tExtracted = await getTranslations({ locale, namespace: "extracted" });
  const categories = await getCategories(locale);
  const products = await getProducts({ locale });
  // Get featured products (first 4 with badges or highest discount)
  const featuredProducts = products
    .filter((p) => p.badge || (p.priceOld && p.priceOld - p.price > 50000))
    .slice(0, 4);

  // Get bestseller products
  const bestsellerProducts = products
    .filter((p) => p.badge === "Bestseller" || p.badge === "Top vente")
    .slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent-red">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-accent-red rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-blue rounded-full blur-3xl" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="text-white">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-accent-red" />
                <span className="text-sm">{t("hero.subtitle")}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading leading-tight mb-6">
                {t("hero.title_part1")}{" "}
                <span className="text-accent-red">{t("hero.title_highlight")}</span>
              </h1>

              <p className="text-xl text-white/90 mb-8 max-w-lg">
                {t("hero.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/boutique"
                  className="inline-flex items-center justify-center space-x-2 bg-accent-red text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-accent-red/90 transition-colors"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{t("hero.cta_shop")}</span>
                </Link>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>{t("hero.cta_contact")}</span>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold text-accent-red">500+</p>
                  <p className="text-sm text-white/70">Clients satisfaits</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent-red">6 mois</p>
                  <p className="text-sm text-white/70">Garantie</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent-red">2-5j</p>
                  <p className="text-sm text-white/70">Livraison</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl transform rotate-3" />
                <div className="relative h-full w-full bg-white rounded-3xl shadow-2xl">
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    <Image
                      src="/images/hero-products.png"
                      alt="Produits tech 2dayna2day"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-4">
              {tExtracted("string_129")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {tExtracted("string_130")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[160px] gap-4">
            {categories.map((category, index) => {
              const productCount = products.filter(
                (p) => p.category === category.id,
              ).length;
              const layout =
                index === 0
                  ? "md:col-span-3 md:row-span-2"
                  : index === 1
                    ? "md:col-span-3 md:row-span-2"
                    : "md:col-span-2 md:row-span-2";

              const categoryImages: Record<string, string> = {
                ordinateurs: "/images/products/macbook-hero.jpg",
                montres: "/images/products/apple-watch-hero.jpg",
                casques: "/images/products/sony-hero.jpg",
                stockage: "/images/products/seagate-hero.jpg",
                accessoires: "/images/products/hub-hero.jpg",
              };
              const imageSrc =
                category.image && typeof category.image === "string" && category.image.trim() !== ""
                  ? category.image
                  : (categoryImages[category.id] || categoryImages[category.slug] || "/images/hero-products.png");

              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className={`group relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all ${layout} h-44 md:h-auto`}
                >
                  <Image
                    src={imageSrc}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/35 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg sm:text-xl leading-tight drop-shadow-lg">
                        {category.name}
                      </h3>
                      <p className="text-white/85 text-sm mt-1 max-w-[24ch] drop-shadow">
                        {category.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-black/20 backdrop-blur-sm px-3 py-2">
                      <span className="inline-flex items-center bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {productCount} {productCount > 1 ? t("products") : t("product")}
                      </span>
                      <span className="inline-flex items-center gap-2 text-white/90 text-sm font-medium">
                        {t("explore")}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 sm:py-24 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-2">
                {tExtracted("string_271")}
              </h2>
              <p className="text-gray-600">{tExtracted("string_272")}</p>
            </div>
            <Link
              href="/boutique"
              className="hidden sm:inline-flex items-center space-x-2 text-primary font-medium hover:text-accent-blue transition-colors"
            >
              <span>{tExtracted("string_273")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/boutique"
              className="inline-flex items-center space-x-2 text-primary font-medium"
            >
              <span>{tExtracted("string_273")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-4">
              {tExtracted("string_274")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {tExtracted("string_275")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Produits vérifiés",
                description:
                  "Tous nos produits passent par un contrôle qualité strict avant livraison",
              },
              {
                icon: CreditCard,
                title: "Paiement Mobile Money",
                description:
                  "Payez facilement avec Orange Money ou MTN MoMo, en une ou deux fois",
              },
              {
                icon: Truck,
                title: "Livraison rapide",
                description:
                  "Livraison en 2-5 jours ouvrables à Douala, Yaoundé et partout au Cameroun",
              },
              {
                icon: Star,
                title: "Garantie 6 mois",
                description:
                  "Tous nos produits sont garantis 6 mois avec service après-vente inclus",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-body mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-6">
                {tExtracted("string_276")}
              </h2>
              <p className="text-white/80 text-lg mb-8">
                {tExtracted("string_277")}
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="relative w-10 h-10">
                      <Image
                        src="/images/paiement/Orange Money.png"
                        alt="Orange Money"
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{tExtracted("string_278")}</p>
                    <p className="text-sm text-white/70">
                      {tExtracted("string_279")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="relative w-10 h-10">
                      <Image
                        src="/images/paiement/MTN Mobile Money.png"
                        alt="MTN Mobile Money"
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{tExtracted("string_280")}</p>
                    <p className="text-sm text-white/70">
                      {tExtracted("string_279")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-xl font-bold text-body mb-6">
                Options de paiement
              </h3>

              <div className="space-y-4">
                <div className="border-2 border-primary rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-body">
                      100% maintenant
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      -5%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Payez la totalité maintenant et économisez 5% sur votre
                    commande
                  </p>
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-body">60% / 40%</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Flexible
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Payez 60% maintenant et le solde à la livraison via Mobile
                    Money
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <ActiveFlashSales />
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-4">
              {tExtracted("string_283")}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {tExtracted("string_284")}
            </p>
          </div>

          <RecentTestimonials />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-body font-heading mb-6">
            {tExtracted("string_285")}
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {tExtracted("string_286")}
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Voir tous les produits</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
