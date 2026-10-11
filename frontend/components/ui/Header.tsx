"use client";

import { Link } from "@/navigation";
import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Menu, X, Phone, User as UserIcon, Heart, MessageCircle, Package, Mail, LogOut, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import HeaderSearch from "./HeaderSearch";
import NotificationDropdown from "./NotificationDropdown";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { user, logout } = useAuth();
  const t = useTranslations("common");
  const tExtracted = useTranslations("extracted");

  const openAuthModal = () => {
    window.dispatchEvent(
      new CustomEvent("open-auth-modal", { detail: { tab: "login" } }),
    );
  };

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/boutique", label: t("shop") },
    { href: "/a-propos", label: t("about") },
    { href: "/contact", label: t("contact") },
    { href: "/ventes-flash", label: "Ventes flash" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/2day-na-2day-logo-final.png"
              alt="Produits tech 2dayna2day"
              width={200}
              height={50}
              className="w-32 h-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/90 hover:text-accent-yellow transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {/* WhatsApp CTA - Desktop */}
            <a
              href="https://wa.me/237690123456"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>

            {/* Global Search */}
            <HeaderSearch />

            {user && <NotificationDropdown />}

            {/* Cart Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-white hover:text-accent-yellow transition-colors"
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-red text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="hidden md:flex items-center space-x-2 relative group">
                <button
                  className="flex items-center space-x-1 p-2 text-white hover:text-accent-yellow transition-colors focus:outline-none"
                  aria-label="Mon compte"
                >
                  <UserIcon className="w-6 h-6" />
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  {/* User info header (Black background) */}
                  <div className="bg-body text-white p-4 rounded-t-xl">
                    <p className="font-bold truncate">
                      {user.profile.firstName} {user.profile.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {user.profile.email}
                    </p>
                  </div>
                  
                  {/* Links */}
                  <div className="p-2 space-y-1">
                    <Link
                      href="/account/profil"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-neutral-light rounded-lg transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{tExtracted("string_50")}</span>
                    </Link>
                    <Link
                      href="/account/conversations"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-neutral-light rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{tExtracted("string_346")}</span>
                    </Link>
                    <Link
                      href="/account/commandes"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-neutral-light rounded-lg transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>{tExtracted("string_30")}</span>
                    </Link>
                    <Link
                      href="/account/favoris"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-neutral-light rounded-lg transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{tExtracted("string_40")}</span>
                    </Link>
                    <Link
                      href="/account/notifications"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-body hover:bg-neutral-light rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{tExtracted("string_27")}</span>
                    </Link>
                    
                    <div className="h-px bg-gray-100 my-2"></div>
                    
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-accent-red hover:bg-red-50 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{tExtracted("string_347")}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 transition-colors text-sm font-medium"
              >
                {tExtracted("string_319")}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary border-t border-white/10">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-white/90 hover:text-accent-yellow transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://wa.me/237690123456"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 py-2 text-green-400"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 py-2 text-white/90 hover:text-accent-yellow transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{t("account")}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-white/90 hover:text-accent-yellow transition-colors"
                >
                  {tExtracted("string_347")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openAuthModal();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left py-2 text-white/90 hover:text-accent-yellow transition-colors"
              >
                {tExtracted("string_319")}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
