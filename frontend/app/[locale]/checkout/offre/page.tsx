"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, ShoppingBag } from "lucide-react";
import { formatPrice, siteConfig } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { PaymentMethodSelector } from "@/components/ui/PaymentBadge";
import PaymentModal from "@/components/ui/PaymentModal";
import { fetchTaraMoneySettings, TaraMoneySettings } from "@/lib/wp-taramoney";
import { OfferSkeleton } from "@/components/ui/skeletons/OfferSkeleton";
import {
  wpGetNegotiationOffer,
  wpMarkNegotiationOfferAsOrdered,
  type WpNegotiationOffer,
} from "@/lib/wp-negotiations";
import {
  wpCancelOrder,
  wpCreateOrderDraft,
} from "@/lib/wp-orders";

function NegotiatedOfferCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, refreshOrders } = useAuth();
  const offerId = searchParams.get("offer");
  const [offer, setOffer] = useState<WpNegotiationOffer | null>(null);
  const [isLoadingOffer, setIsLoadingOffer] = useState(true);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState(user?.profile.city || "");
  const [paymentMethod, setPaymentMethod] = useState<string>("orange_money");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "split">("full");
  const [settings, setSettings] = useState<TaraMoneySettings | null>(null);
  useEffect(() => { fetchTaraMoneySettings().then(setSettings); }, []);
  const [payForLovedOne, setPayForLovedOne] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [wpOrderId, setWpOrderId] = useState<string | null>(null);
  const [wpOrderKey, setWpOrderKey] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!offerId || !token || !user) {
      setOffer(null);
      setIsLoadingOffer(false);
      return;
    }

    let active = true;
    setIsLoadingOffer(true);

    wpGetNegotiationOffer(token, offerId)
      .then((nextOffer) => {
        if (!active) return;
        if (String(nextOffer.userId) !== String(user.id)) {
          setOffer(null);
          return;
        }
        setOffer(nextOffer);
      })
      .catch(() => {
        if (!active) return;
        setOffer(null);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingOffer(false);
      });

    return () => {
      active = false;
    };
  }, [offerId, token, user]);

  const availablePaymentMethods = siteConfig.paymentMethods.filter((method) =>
    payForLovedOne
      ? ["orange_money", "mtn_momo", "card", "paypal"].includes(method.id)
      : ["orange_money", "mtn_momo"].includes(method.id),
  );

  useEffect(() => {
    if (
      !payForLovedOne &&
      (paymentMethod === "card" || paymentMethod === "paypal")
    ) {
      setPaymentMethod("orange_money");
    }
  }, [payForLovedOne, paymentMethod]);

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md text-center">
          <h1 className="text-2xl font-bold text-body mb-3">
            Connectez-vous pour continuer
          </h1>
          <p className="text-gray-600 mb-5">
            Cette offre négociée est privée. Connectez-vous à votre compte pour
            y accéder.
          </p>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-auth-modal", {
                  detail: { tab: "login" },
                }),
              )
            }
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingOffer) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-12 px-4">
        <OfferSkeleton />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md text-center">
          <h1 className="text-2xl font-bold text-body mb-3">
            Offre indisponible
          </h1>
          <p className="text-gray-600 mb-5">
            Cette commande négociée n&apos;est pas disponible pour votre session
            actuelle.
          </p>
          <Link
            href="/account/conversations"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Voir mes conversations
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setWpOrderId(null);
    setWpOrderKey(null);

    if (!token || !user) {
      setIsSubmitting(false);
      setSubmitError("Connectez-vous pour continuer.");
      return;
    }

    try {
      const paymentGateway =
        paymentMethod === "orange_money" || paymentMethod === "mtn_momo"
          ? "2day_taramoney"
          : "2day_headless";

      const draft = await wpCreateOrderDraft(
        {
          lines: [{ productId: String(offer.productId), quantity: 1 }],
          billing: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            phone: user.profile.phone,
            city,
            address1: address,
          },
          shipping: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            city,
            address1: address,
          },
          paymentMethod: paymentGateway,
          paymentPlan,
          customerNote: payForLovedOne ? "Paiement pour un proche." : "",
        },
        token,
      );

      setOrderNumber(draft.orderNumber);
      setWpOrderId(draft.orderId);
      setWpOrderKey(draft.orderKey);
      await refreshOrders().catch(() => {});
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(
        err instanceof Error ? err.message : "Impossible de créer la commande.",
      );
      return;
    }

    setIsSubmitting(false);
    setShowPaymentModal(true);
  };

  const handlePaymentDone = async () => {
    setShowPaymentModal(false);
    if (token && offer && wpOrderId) {
      const asNumber = parseInt(wpOrderId, 10);
      try {
        await wpMarkNegotiationOfferAsOrdered(token, String(offer.id), {
          orderId: Number.isFinite(asNumber) ? asNumber : undefined,
        });
        setOffer((prev) => (prev ? { ...prev, status: "ordered" } : prev));
      } catch {}
    }
    await refreshOrders().catch(() => {});
    router.push("/merci?order=" + orderNumber);
  };

  return (
    <div className="min-h-screen bg-neutral-light py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account/conversations"
          className="inline-flex items-center gap-2 text-primary hover:text-accent-blue transition-colors font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux conversations
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            {submitError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
                {submitError}
              </div>
            ) : null}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image
                    src={offer.productThumbnail}
                    alt={offer.productName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary mb-2">
                    Offre négociée privée
                  </p>
                  <h1 className="text-xl font-bold text-body">
                    {offer.productName}
                  </h1>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(offer.originalPrice)}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(offer.negotiatedPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-body">
                  Vos informations
                </h2>
                <div className="mt-4 bg-neutral-light rounded-xl p-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-600">Nom</p>
                    <p className="font-semibold text-body">
                      {user.profile.firstName} {user.profile.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-body">
                      {user.profile.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Téléphone</p>
                    <p className="font-semibold text-body">
                      {user.profile.phone || "À compléter dans le profil"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ville</p>
                    <p className="font-semibold text-body">
                      {city || "À sélectionner ci-dessous"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionnez une ville</option>
                    {siteConfig.deliveryZones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse de livraison *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Quartier, rue, point de repère"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-body">
                    Mode de paiement
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentPlan("full")}
                    className={`rounded-xl border-2 p-4 text-left ${
                      paymentPlan === "full"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <p className="font-semibold text-body">En une fois</p>
                    <p className="text-sm text-gray-600">Paiement immédiat</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPlan("split")}
                    disabled={!settings?.enablePartialPayment}
                    className={`rounded-xl border-2 p-4 text-left ${
                      paymentPlan === "split"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <p className="font-semibold text-body">En deux fois</p>
                    <p className="text-sm text-gray-600">
                      {settings?.enablePartialPayment ? `${settings.partialPaymentPercent}% maintenant, ${100 - settings.partialPaymentPercent}% à la livraison` : "Paiement partiel indisponible"}
                    </p>
                  </button>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-neutral-light mb-4">
                  <input
                    type="checkbox"
                    checked={payForLovedOne}
                    onChange={(e) => setPayForLovedOne(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-body">
                      Payer pour un proche au pays
                    </p>
                    <p className="text-gray-600">
                      Carte bancaire et PayPal deviennent disponibles.
                    </p>
                  </div>
                </label>

                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onSelect={setPaymentMethod}
                  methods={availablePaymentMethods}
                />
              </div>

              <button
                type="submit"
                disabled={!city || !address || isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <ShoppingBag className="w-5 h-5" />
                {isSubmitting
                  ? "Préparation..."
                  : "Confirmer cette commande privée"}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-body mb-4">
                Récapitulatif
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Prix public</span>
                  <span className="line-through text-gray-400">
                    {formatPrice(offer.originalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Prix négocié</span>
                  <span className="font-semibold text-primary">
                    {formatPrice(offer.negotiatedPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span>Selon ville</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onDismiss={() => setShowPaymentModal(false)}
        onPaymentDone={handlePaymentDone}
        onCancelOrder={
          wpOrderId
            ? async () => {
                await wpCancelOrder(
                  { orderId: wpOrderId, orderKey: wpOrderKey ?? undefined },
                  token,
                );
                setOrderNumber("");
                setWpOrderId(null);
                setWpOrderKey(null);
                await refreshOrders().catch(() => {});
                router.push("/account/conversations");
              }
            : undefined
        }
        paymentMethod={paymentMethod}
        amount={offer.negotiatedPrice}
        orderNumber={orderNumber}
        paymentPlan={paymentPlan}
        partialPaymentPercent={settings?.partialPaymentPercent}
      />
    </div>
  );
}

export default function NegotiatedOfferCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Chargement de l&apos;offre...
        </div>
      }
    >
      <NegotiatedOfferCheckoutContent />
    </Suspense>
  );
}
