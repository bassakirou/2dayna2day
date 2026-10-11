"use client";
import OrderNextStep from "@/components/ui/OrderNextStep";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/navigation";
import Image from "next/image";
import { Link } from "@/navigation";
import {
  Trash2,
  Plus,
  Minus,
  MapPin,
  User,
  Phone,
  CreditCard,
  Check,
  ArrowRight,
  Truck,
  ChevronLeft,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { siteConfig, formatPrice } from "@/lib/data";
import { PaymentMethodSelector } from "@/components/ui/PaymentBadge";
import PaymentModal from "@/components/ui/PaymentModal";
import { CheckoutProgress } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthContext";
import AccountCreatedBanner from "@/components/ui/AccountCreatedBanner";
import SuggestedProductsBlock from "@/components/blocks/SuggestedProductsBlock";
import {
  wpCancelOrder,
  wpCreateOrderDraft,
} from "@/lib/wp-orders";
import { Address, getAddresses, saveAddress } from "@/lib/wp-addresses";
import { ShippingMethod, getShippingMethods } from "@/lib/wp-shipping";
import { fetchTaraMoneySettings, TaraMoneySettings } from "@/lib/wp-taramoney";
import { getRewards, type Badge } from '@/lib/wp-account';

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user, token, orders, refreshOrders, isReady } = useAuth();
  const [rewardBadges, setRewardBadges] = useState<Badge[]>([]);
  const [rewardCode, setRewardCode] = useState('');
  useEffect(() => { setRewardBadges([]); setRewardCode(''); if (!token) return; let active = true; getRewards(token).then(r => { if (active) setRewardBadges((r.badges || []).filter(b => b.usable)); }).catch(() => {}); return () => { active = false; }; }, [token]);

  const openAuthModal = () => {
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login", redirectUrl: "/checkout" } }));
  };

  useEffect(() => {
    if (isReady && !user) {
      openAuthModal();
    }
  }, [isReady, user]);

  // Wizard State
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // --- Step 1: Address State ---
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
  });

  // --- Step 2: Shipping State ---
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // --- Step 3: Payment State ---
  const [taramoneySettings, setTaramoneySettings] = useState<TaraMoneySettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("orange_money");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "split">("full");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wpOrderId, setWpOrderId] = useState<string | null>(null);
  const [draftTotal, setDraftTotal] = useState<number | null>(null);
  const [wpOrderKey, setWpOrderKey] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Existing order flow handling
  const existingOrderId = searchParams.get("orderId");
  const isExistingOrderFlow = Boolean(existingOrderId);
  const existingOrderNumberParam = searchParams.get("orderNumber") || "";
  const existingAmountParam = searchParams.get("amount") || "";
  const existingCurrencyParam = searchParams.get("currency") || "XAF";
  const existingOrder = useMemo(() => {
    if (!existingOrderId) return null;
    return orders.find((o) => String(o.id) === String(existingOrderId)) || null;
  }, [existingOrderId, orders]);

  const allCrossSells = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      if (item.crossSells) {
        item.crossSells.forEach((cs) => {
          if (!map.has(cs.wpId)) map.set(cs.wpId, cs);
        });
      }
    });
    items.forEach((item) => {
      map.delete(item.wpId);
      map.delete(Number(item.wpId));
      map.delete(String(item.wpId));
    });
    return Array.from(map.values());
  }, [items]);

  const [loadingExistingOrder, setLoadingExistingOrder] = useState(true);
  useEffect(() => {
    if (!token || !isExistingOrderFlow) return;
    let active = true; setLoadingExistingOrder(true);
    refreshOrders().catch(error => { if (active) setSubmitError(error.message); }).finally(() => { if (active) setLoadingExistingOrder(false); });
    return () => { active = false; };
  }, [token, isExistingOrderFlow, existingOrderId, refreshOrders]);

  // Initial Data Fetch
  useEffect(() => {
    if (!token) return;
    if (isExistingOrderFlow) return;
    let active = true;
    // Fetch Addresses
    getAddresses(token).then((res) => {
      if (!active) return;
      setAddresses(res);
      const def = res.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
      else if (res.length > 0) setSelectedAddressId(res[0].id);
      else {
        setIsAddingAddress(true);
        if (user) {
          setFormData(prev => ({
            ...prev,
            firstName: user.profile?.firstName || "",
            lastName: user.profile?.lastName || "",
            email: user.profile?.email || "",
          }));
        }
      }
    }).catch((error) => { if (active) { setSubmitError(error.message); setIsAddingAddress(true); } });
    return () => { active = false; };
  }, [isExistingOrderFlow, token, user]);

  useEffect(() => { fetchTaraMoneySettings().then(setTaramoneySettings); }, []);

  const activeCity = !isAddingAddress && selectedAddressId ? addresses.find(a => a.id === selectedAddressId)?.city || "" : formData.city;
  const [shippingRetry, setShippingRetry] = useState(0);
  const shippingEnabled = step >= 2;
  useEffect(() => {
    if (!shippingEnabled || !activeCity) return;
    let active = true;
    setIsLoadingShipping(true); setSelectedShippingMethodId(""); setShippingMethods([]); setSubmitError(null);
    getShippingMethods(activeCity, "CM", items.map(i => ({productId: String(i.wpId || i.id), quantity: i.quantity, variationId: i.variationId}))).then(result => {
      if (!active) return;
      setShippingMethods(result.methods);
      setSelectedShippingMethodId(result.methods[0]?.id || "");
    }).catch(error => { if (active) setSubmitError(error.message); }).finally(() => { if (active) setIsLoadingShipping(false); });
    return () => { active = false; };
  }, [activeCity, items, shippingRetry, shippingEnabled]);

  // Helper to get active city
  const getSelectedCity = () => {
    if (user && selectedAddressId && !isAddingAddress) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      return addr?.city || "";
    }
    return formData.city;
  };

  const getSelectedShippingCost = () => {
    const method = shippingMethods.find((m) => m.id === selectedShippingMethodId);
    return method ? parseFloat(method.cost || "0") : 0;
  };

  // Calculate totals
  const shippingCost = getSelectedShippingCost();
  const baseTotal = totalPrice + shippingCost;
  const hasSpecialPromotion = items.some(item => !!item.specialPromotion);
  const specialDiscountAmount = items.reduce((total, item) => total + (item.specialPromotion ? Math.round(((item.regularPrice ?? item.specialPromotion.regularPrice) - item.price) * item.quantity) : 0), 0);
  const specialPercent = items.find(item => item.specialPromotion)?.specialPromotion?.percent ?? 0;
  const discountPercent = !hasSpecialPromotion && paymentPlan === "full" ? (taramoneySettings?.discountPercent ?? 0) : 0;
  const discountAmount = Math.round((totalPrice * discountPercent) / 100);
  const rewardPercent = rewardBadges.find(b => b.coupon === rewardCode)?.percent || 0;
  const rewardAmount = Math.round(totalPrice * rewardPercent / 100);
  const finalTotal = Math.max(shippingCost, baseTotal - discountAmount - rewardAmount);
  
  const splitPercent = taramoneySettings?.partialPaymentPercent ?? 60;
  const firstPayment = Math.round((finalTotal * splitPercent) / 100);

  const availablePaymentMethods = siteConfig.paymentMethods.filter((m) =>
    ["orange_money", "mtn_momo"].includes(m.id),
  );

  useEffect(() => {
    if (taramoneySettings && (!taramoneySettings.enablePartialPayment || hasSpecialPromotion) && paymentPlan === "split") {
      setPaymentPlan("full");
    }
  }, [taramoneySettings, paymentPlan, hasSpecialPromotion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    if (step === 1) {
      if (user && isAddingAddress) {
        // Save address
        setIsSubmitting(true);
        try {
          const res = await saveAddress(token!, {
            name: user.profile.firstName + " " + user.profile.lastName,
            phone: formData.phone || user.profile.phone,
            city: formData.city,
            address: formData.address,
          });
          setAddresses(res);
          const newAddr = res[res.length - 1];
          if (newAddr) setSelectedAddressId(newAddr.id);
          setIsAddingAddress(false);
        } catch (e) {
          setSubmitError(e instanceof Error ? e.message : "Impossible de sauvegarder l’adresse.");
          return;
        } finally { setIsSubmitting(false); }
      }
      setStep(2);
    } else if (step === 2 && isShippingValid) {
      setStep(3);
    }
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0 || isSubmitting || !token || !shippingMethods.some(m => m.id === selectedShippingMethodId)) return;
    if (wpOrderId) { setShowPaymentModal(true); return; }

    setIsSubmitting(true);
    setSubmitError(null);
    setWpOrderId(null);
    setWpOrderKey(null);

    try {
      const lines = items
        .map((it) => ({
          productId: it.wpId ? String(it.wpId) : "",
          quantity: it.quantity,
          variationId: it.variationId ? String(it.variationId) : undefined,
        }))
        .filter((l) => l.productId && l.quantity > 0);

      if (lines.length !== items.length) {
        setIsSubmitting(false);
        setSubmitError("Aucun produit WordPress dans le panier.");
        return;
      }

      const paymentGateway =
        paymentMethod === "orange_money" || paymentMethod === "mtn_momo"
          ? (taramoneySettings?.provider === "campay" ? "2day_campay" : "2day_taramoney")
          : "2day_headless"; // Simulate external via headless

      let billingDetails = {
        firstName: formData.firstName || user?.profile.firstName || "",
        lastName: formData.lastName || user?.profile.lastName || "",
        email: formData.email || user?.profile.email || "",
        phone: formData.phone || user?.profile.phone || "",
        country: "CM",
        city: formData.city,
        address1: formData.address,
      };

      if (user && selectedAddressId && !isAddingAddress) {
        const addr = addresses.find((a) => a.id === selectedAddressId);
        if (addr) {
          billingDetails = {
            ...billingDetails,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.profile.email,
            phone: addr.phone,
            city: addr.city,
            address1: addr.address,
          };
        }
      }

      const draft = await wpCreateOrderDraft(
        {
          lines,
          billing: billingDetails,
          shipping: { ...billingDetails },
          paymentMethod: paymentGateway,
          shippingMethodId: selectedShippingMethodId,
          paymentPlan: paymentPlan,
          rewardCode: rewardCode || undefined,
          customerNote: "",
        },
        token,
      );

      setDraftTotal(Number(draft.total));
      setOrderNumber(draft.orderNumber);
      setWpOrderId(draft.orderId);
      setWpOrderKey(draft.orderKey);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : "Impossible de créer la commande.");
      return;
    }

    setIsSubmitting(false);
    setShowPaymentModal(true);
  };

  const handlePaymentDone = async () => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    if (wpOrderId && (wpOrderKey || isExistingOrderFlow)) {
      try {
        // Payment status is confirmed by the gateway webhook; never mark it paid from the browser.
      } catch {}
    }
    await refreshOrders().catch(() => {});
    if (!isExistingOrderFlow) {
      clearCart();
    }
    setStep(4); // Move to confirmation
  };

  // --- Views ---

  if (isExistingOrderFlow) {
    if (!token) {
      return (
        <div className="min-h-screen bg-neutral-light flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4">
            <h1 className="text-2xl font-bold text-body mb-4">Connexion requise</h1>
            <p className="text-gray-600">Connectez-vous pour payer cette commande.</p>
          </div>
        </div>
      );
    }

    if (!existingOrder) {
      return (
        <div className="min-h-screen bg-neutral-light flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4">
            <p className="text-gray-600">{loadingExistingOrder ? "Chargement de la commande…" : submitError || "Commande introuvable."}</p>
          </div>
        </div>
      );
    }

    const orderRef = `#${existingOrder?.orderNumber || existingOrderNumberParam || existingOrderId}`;
    const parsedAmount = Number(existingAmountParam.replace(/[^\d.]/g, ""));
    const amount = existingOrder?.paymentPlan === "split" && ["partial-paid", "wc-partial-paid"].includes(existingOrder.status) ? existingOrder.balanceRemaining ?? 0 : existingOrder?.amount ?? 0;

    return (
      <div className="min-h-screen bg-neutral-light py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-body">Paiement</h1>
            <p className="text-gray-600 mt-1">Commande : {orderRef}</p>

            <div className="mt-6 bg-neutral-light rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Montant</p>
                <p className="text-xl font-bold text-body">{formatPrice(amount)}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold text-body mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-primary" /> Mode de paiement
              </h2>
              <PaymentMethodSelector
                methods={availablePaymentMethods.filter((m) => ["orange_money", "mtn_momo"].includes(m.id))}
                selectedMethod={paymentMethod}
                onSelect={(id) => {
                  setPaymentMethod(id);
                  setOrderNumber(orderRef);
                  setWpOrderId(existingOrderId);
                  setWpOrderKey(null);
                  setShowPaymentModal(true);
                }}
              />
            </div>
          </div>

          <PaymentModal
            isOpen={showPaymentModal}
            onDismiss={() => setShowPaymentModal(false)}
            onPaymentDone={() => router.push("/account/commandes")}
            onCancelOrder={
              wpOrderId
                ? async () => {
                    await wpCancelOrder({ orderId: wpOrderId }, token);
                    setSubmitError("Commande annulée.");
                    setOrderNumber("");
                    setWpOrderId(null);
                    setWpOrderKey(null);
                    await refreshOrders().catch(() => {});
                    setShowPaymentModal(false);
                  }
                : undefined
            }
            paymentMethod={paymentMethod}
            amount={amount}
            orderNumber={orderRef}
            paymentPlan={existingOrder?.status === "pending" && existingOrder?.paymentPlan === "split" ? "split" : "full"}
            partialPaymentPercent={existingOrder?.partialPaymentPercent || splitPercent}
            isBalancePayment={existingOrder?.paymentPlan === "split" && ["partial-paid", "wc-partial-paid"].includes(existingOrder.status)}
          />
        </div>
      </div>
    );
  }

  if (items.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-body mb-4">Votre panier est vide</h1>
          <p className="text-gray-600 mb-6">Ajoutez des produits avant de passer commande</p>
          <Link
            href="/boutique"
            className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            <span>Continuer vos achats</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const isAddressValid = user
    ? (!isAddingAddress && selectedAddressId) || (isAddingAddress && formData.phone && formData.city && formData.address)
    : (formData.firstName && formData.lastName && formData.email && formData.phone && formData.city && formData.address);

  const isShippingValid = !isLoadingShipping && shippingMethods.some(m => m.id === selectedShippingMethodId);

  const selectedAddress = user && selectedAddressId && !isAddingAddress
    ? addresses.find((a) => a.id === selectedAddressId)
    : null;
  const contactName = selectedAddress?.name || (user ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() : `${formData.firstName} ${formData.lastName}`.trim()) || "Client";
  const contactPhone = selectedAddress?.phone || formData.phone || (user?.profile?.phone ?? "");
  const contactAddress = selectedAddress
    ? `${selectedAddress.address}, ${selectedAddress.city}`
    : (formData.address && formData.city ? `${formData.address}, ${formData.city}` : getSelectedCity());
  const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedShippingMethodId);
  const selectedPaymentMethodObj = availablePaymentMethods.find((m) => m.id === paymentMethod);

  return (
    <div className="min-h-screen bg-neutral-light py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {!paymentCompleted && (
          <div className="mb-8">
            <CheckoutProgress currentStep={step} />
          </div>
        )}

        {submitError && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
            {submitError}
          </div>
        )}

        <AccountCreatedBanner className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className={paymentCompleted ? "lg:col-span-3 max-w-2xl mx-auto w-full" : "lg:col-span-2"}>
            
            {/* STEP 1: Address */}
            {step === 1 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6 animate-fade-in">
                <h2 className="text-xl font-bold text-body mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary" />
                  Adresse de livraison
                </h2>

                {user ? (
                  <div className="space-y-4">
                    {addresses.length > 0 && !isAddingAddress && (
                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                              selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="addressId"
                              value={addr.id}
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 mr-3"
                            />
                            <div>
                              <p className="font-semibold text-body">{addr.name}</p>
                              <p className="text-sm text-gray-600">{addr.address}, {addr.city}</p>
                              <p className="text-sm text-gray-600">{addr.phone}</p>
                            </div>
                          </label>
                        ))}
                        <button
                          onClick={() => setIsAddingAddress(true)}
                          className="flex items-center text-primary font-medium hover:underline text-sm mt-4"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Ajouter une nouvelle adresse
                        </button>
                      </div>
                    )}

                    {(isAddingAddress || addresses.length === 0) && (
                      <div className="bg-neutral-light p-4 rounded-xl">
                        <h3 className="font-medium mb-4">Nouvelle adresse</h3>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="checkout-phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                            <input
                              type="tel"
                              id="checkout-phone" name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label htmlFor="checkout-city" className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                            <select
                              id="checkout-city" name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Sélectionnez une ville</option>
                              {siteConfig.deliveryZones.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="checkout-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
                            <input
                              type="text"
                              id="checkout-address" name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          {addresses.length > 0 && (
                            <button
                              onClick={() => setIsAddingAddress(false)}
                              className="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkout-firstName" className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                        <input
                          type="text" id="checkout-firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-lastName" className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                          type="text" id="checkout-lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email" id="checkout-email" name="email" value={formData.email} onChange={handleInputChange} required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                      <input
                        type="tel" id="checkout-phone" name="phone" value={formData.phone} onChange={handleInputChange} required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-city" className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                      <select
                        id="checkout-city" name="city" value={formData.city} onChange={handleInputChange} required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Sélectionnez une ville</option>
                        {siteConfig.deliveryZones.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="checkout-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
                      <input
                        type="text" id="checkout-address" name="address" value={formData.address} onChange={handleInputChange} required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </form>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    disabled={!isAddressValid || isSubmitting}
                    className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
                  >
                    Suivant <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Shipping */}
            {step === 2 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6 animate-fade-in">
                <h2 className="text-xl font-bold text-body mb-6 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-primary" />
                  Mode de livraison
                </h2>

                {isLoadingShipping ? (
                  <div className="py-8 text-center text-gray-500">Chargement des options de livraison...</div>
                ) : shippingMethods.length > 0 ? (
                  <div className="space-y-4">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedShippingMethodId === method.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethodId"
                          value={method.id}
                          checked={selectedShippingMethodId === method.id}
                          onChange={() => setSelectedShippingMethodId(method.id)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1 flex justify-between">
                          <div>
                            <p className="font-semibold text-body">{method.title}</p>
                            <p className="text-sm text-gray-600">{method.description.replace(/<[^>]*>/g, "")}</p>
                          </div>
                          <span className="font-bold text-primary">
                            {parseFloat(method.cost) > 0 ? formatPrice(parseFloat(method.cost)) : "Gratuit"}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">Aucune option de livraison trouvée pour cette ville. <button className="underline" onClick={() => setShippingRetry(n => n + 1)}>Réessayer</button></div>
                )}

                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-gray-800 flex items-center font-medium"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" aria-hidden="true" /> Retour
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!isShippingValid || isLoadingShipping}
                    className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
                  >
                    Suivant <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment */}
            {step === 3 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6 animate-fade-in">
                <h2 className="text-xl font-bold text-body mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary" />
                  Mode de paiement
                </h2>

                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onSelect={setPaymentMethod}
                  methods={availablePaymentMethods}
                />

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-body mb-4">Options de paiement</h3>
                  <div className="space-y-3">
                    <label
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        paymentPlan === "full" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentPlan"
                        value="full"
                        checked={paymentPlan === "full"}
                        onChange={() => setPaymentPlan("full")}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">100% maintenant</span>
                          <span className={hasSpecialPromotion ? "bg-orange-500 text-white px-2 py-1 rounded text-sm font-semibold" : "bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold"}>{hasSpecialPromotion ? `Spécial -${specialPercent}%` : `-${discountPercent}%`}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Payez la totalité maintenant et économisez.</p>
                      </div>
                    </label>

                    {taramoneySettings?.enablePartialPayment && !hasSpecialPromotion && (
                      <label
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          paymentPlan === "split" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentPlan"
                          value="split"
                          checked={paymentPlan === "split"}
                          onChange={() => setPaymentPlan("split")}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{taramoneySettings.partialPaymentPercent}% maintenant / {100 - taramoneySettings.partialPaymentPercent}% à la livraison</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">Flexible</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Payez {formatPrice(firstPayment)} maintenant et le solde à la livraison.</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="text-gray-500 hover:text-gray-800 flex items-center font-medium"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" aria-hidden="true" /> Retour
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={isSubmitting}
                    className="bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
                  >
                    Vérifier ma commande <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Confirmation Preview */}
            {step === 4 && !paymentCompleted && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6 animate-fade-in space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-body flex items-center">
                    <Check className="w-5 h-5 mr-2 text-primary" />
                    Récapitulatif et confirmation
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Vérifiez attentivement les informations ci-dessous avant de procéder au paiement.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Adresse */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-neutral-light/50 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-body text-sm">Adresse de livraison</p>
                        <p className="text-sm font-medium text-gray-800 mt-1">{contactName}</p>
                        <p className="text-sm text-gray-600">{contactAddress}</p>
                        {contactPhone && <p className="text-sm text-gray-600">{contactPhone}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Livraison */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-neutral-light/50 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-body text-sm">Mode de livraison</p>
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {selectedShippingMethod?.title || "Livraison standard"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Destination : {getSelectedCity()} · {shippingCost > 0 ? formatPrice(shippingCost) : "Gratuit"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Mode de paiement */}
                  <div className="p-4 rounded-xl border border-gray-100 bg-neutral-light/50 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-body text-sm">Mode de paiement</p>
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {selectedPaymentMethodObj?.label || (paymentMethod === "orange_money" ? "Orange Money" : "MTN Mobile Money")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Option : {paymentPlan === "split"
                            ? `${splitPercent}% maintenant / ${100 - splitPercent}% à la livraison`
                            : hasSpecialPromotion ? '100% maintenant — promotion spéciale' : `100% maintenant (-${discountPercent}%)`}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          À payer maintenant : {formatPrice(paymentPlan === "split" ? firstPayment : finalTotal)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                    >
                      Modifier
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isSubmitting}
                    className="text-gray-500 hover:text-gray-800 flex items-center font-medium transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" aria-hidden="true" /> Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || !isShippingValid || !token}
                    className="bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center shadow-md hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <span>Création de la commande…</span>
                    ) : (
                      <>
                        <span>Confirmer et payer</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            {step === 4 && paymentCompleted && (
              <div className="bg-white rounded-xl p-8 shadow-sm mb-6 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-body mb-4">{paymentPlan === "split" ? "Acompte reçu !" : "Commande confirmée !"}</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Merci pour votre achat. Votre numéro de commande est le <span className="font-bold text-primary">{orderNumber}</span>.
                </p>

                <OrderNextStep orderId={wpOrderId} orderKey={wpOrderKey} />

                <Link
                  href={user ? `/account/orders?id=${wpOrderId}` : `/merci?order=${orderNumber}`}
                  className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors"
                >
                  <span>Suivre ma commande</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          {!paymentCompleted && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-body mb-6">Récapitulatif de commande</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image src={item.thumbnail} alt={item.name} fill className="object-cover rounded-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        <p className="text-primary font-semibold">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  {rewardBadges.length > 0 && <label className="block text-sm pb-3">Votre récompense fidélité<select aria-label="Récompense fidélité" className="block w-full border rounded-lg p-2 mt-2" value={rewardCode} onChange={e => setRewardCode(e.target.value)}><option value="">Aucune récompense</option>{rewardBadges.map(b => <option key={b.id} value={b.coupon}>{b.name} · {b.percent}% de réduction</option>)}</select></label>}
                  {rewardAmount > 0 && <div className="flex justify-between text-green-700"><span>Récompense fidélité ({rewardPercent}%)</span><span>-{formatPrice(rewardAmount)}</span></div>}
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatPrice(totalPrice + specialDiscountAmount)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Livraison</span>
                      <span>{formatPrice(shippingCost)}</span>
                    </div>
                  )}
                  {hasSpecialPromotion && specialDiscountAmount > 0 && <div className="flex justify-between items-center gap-2"><span className="bg-orange-500 text-white px-2 py-1 rounded text-sm font-semibold">Réduction spéciale ({specialPercent}%)</span><span className="text-orange-600">-{formatPrice(specialDiscountAmount)}</span></div>}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction ({discountPercent}%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total {paymentPlan === "split" ? "(à payer maintenant)" : ""}</span>
                    <span className="text-primary">{formatPrice(paymentPlan === "split" ? firstPayment : finalTotal)}</span>
                  </div>
                  {paymentPlan === "split" && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
                      <p className="flex justify-between font-bold mb-1">
                        <span>À payer maintenant :</span>
                        <span>{formatPrice(firstPayment)}</span>
                      </p>
                      <p className="flex justify-between opacity-80">
                        <span>Reste à la livraison :</span>
                        <span>{formatPrice(finalTotal - firstPayment)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onDismiss={() => setShowPaymentModal(false)}
        onPaymentDone={handlePaymentDone}
        onCancelOrder={
          wpOrderId
            ? async () => {
                await wpCancelOrder({ orderId: wpOrderId, orderKey: wpOrderKey ?? undefined }, token);
                setSubmitError("Commande annulée.");
                setOrderNumber("");
                setWpOrderId(null);
                setWpOrderKey(null);
                setShowPaymentModal(false);
                await refreshOrders().catch(() => {});
              }
            : undefined
        }
        paymentMethod={paymentMethod}
        amount={draftTotal ?? finalTotal}
        orderNumber={orderNumber}
        paymentPlan={paymentPlan}
        partialPaymentPercent={splitPercent}
        wpOrderId={wpOrderId ?? undefined}
        wpOrderKey={wpOrderKey ?? undefined}
        token={token ?? undefined}
        userPhone={formData.phone || user?.profile.phone}
      />

      {allCrossSells.length > 0 && !isExistingOrderFlow && step < 4 && (
        <div className="mt-8 border-t border-gray-200">
          <SuggestedProductsBlock products={allCrossSells} title="Ventes croisées suggérées pour vous" />
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-light" />}>
      <CheckoutPageInner />
    </Suspense>
  );
}
