"use client";

import { Link } from "@/navigation";
import Image from "next/image";
import { Phone, Mail, Instagram, MapPin, CreditCard } from "lucide-react";
import { siteConfig } from "@/lib/data";
import { useTranslations } from "next-intl";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("common");
  const tExtracted = useTranslations("extracted");
  const tHome = useTranslations("home");

  return (
    <footer className="bg-neutral-dark text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold font-heading">
                2dayna<span className="text-accent-yellow">2day</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm">
              {siteConfig.tagline}{tHome("footer_desc")}
            </p>
            <div className="flex items-center space-x-4">
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-500 transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href={`https://instagram.com/${siteConfig.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-gray-400 hover:text-accent-blue transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{tExtracted("string_336")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/boutique"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("shop")}
                </Link>
              </li>
              <li>
                <Link
                  href="/a-propos"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{tExtracted("string_135")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/category/ordinateurs"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {tExtracted("string_337")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/montres"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {tExtracted("string_338")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/casques"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {tExtracted("string_339")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/stockage"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {tExtracted("string_340")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/accessoires"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {tExtracted("string_341")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{tExtracted("string_342")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">{siteConfig.whatsapp}</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">{siteConfig.email}</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  {tHome("delivery")} {siteConfig.deliveryZones.join(", ")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-start space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400 text-sm">
                {tExtracted("string_343")}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/paiement/Orange Money.png"
                  alt="Orange Money"
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
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
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>&copy; {currentYear} 2dayna2day. {tHome("all_rights")}</p>
            <p className="mt-2 md:mt-0">{tExtracted("string_344")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
