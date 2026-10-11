"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  MessageCircle,
  Phone,
  ShoppingBag,
  Instagram,
} from "lucide-react";
import { siteConfig } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import OrderNextStep from "@/components/ui/OrderNextStep";

export default function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "N/A";
  const upsellAdded = searchParams.get("upsell") === "added";
  const { refreshOrders, orders } = useAuth();

  // Refresh orders on mount so the user's order list is up to date
  useEffect(() => {
    refreshOrders().catch(() => {});
  }, [refreshOrders]);

  const partial = orders.find(
    (o) =>
      o.orderNumber === orderNumber &&
      ["partial-paid", "wc-partial-paid"].includes(o.status),
  );
  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Simple Header */}
      <header className="bg-primary py-4">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-2xl font-bold text-white font-heading">
            2dayna<span className="text-accent-yellow">2day</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-body mb-4">
            Merci pour votre commande !
          </h1>

          <p className="text-gray-600 mb-6">
            Votre commande a été reçue avec succès. Retrouvez les étapes de
            votre commande ci-dessous et dans votre compte.
          </p>

          {partial && (
            <p className="bg-blue-50 text-blue-900 rounded-xl p-4 mb-6">
              Votre acompte a été reçu. Le solde restant est de{" "}
              {partial.balanceRemaining?.toLocaleString("fr-FR")} FCFA.
            </p>
          )}
          {/* Order Number */}
          <div className="bg-primary/5 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Numéro de commande</p>
            <p className="text-2xl font-bold text-primary font-mono">
              {orderNumber}
            </p>
          </div>

          {/* Upsell Confirmation */}
          {upsellAdded && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-700 font-medium">
                ✓ Article complémentaire ajouté à votre commande
              </p>
            </div>
          )}

          <OrderNextStep
            orderId={
              orders.find(
                (o) =>
                  o.orderNumber.replace(/^#+/, "") ===
                  orderNumber.replace(/^#+/, ""),
              )?.id
            }
          />

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}?text=Bonjour, j'ai passé la commande ${orderNumber} et je voudrais confirmer le paiement.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center space-x-2 w-full bg-green-500 text-white py-4 rounded-full font-bold hover:bg-green-600 transition-colors mb-4"
          >
            <MessageCircle className="w-6 h-6" />
            <span>Confirmer sur WhatsApp</span>
          </a>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/boutique"
              className="flex-1 inline-flex items-center justify-center space-x-2 bg-primary text-white py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Continuer vos achats</span>
            </Link>
            <a
              href={`tel:${siteConfig.whatsapp}`}
              className="flex-1 inline-flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Nous appeler</span>
            </a>
          </div>

          {/* Social */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">
              Suivez-nous sur Instagram
            </p>
            <a
              href={`https://instagram.com/${siteConfig.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-pink-500 hover:text-pink-600 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-medium">{siteConfig.instagram}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
