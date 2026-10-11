"use client";

import { X, Smartphone, Loader2 } from "lucide-react";
import { siteConfig, formatPrice } from "@/lib/data";
import { useState, useEffect, useRef } from "react";
import { pollOrderStatus } from "@/lib/wp-taramoney";
import PhoneNumber from "@/components/ui/PhoneNumber";
import { getPayments, type SavedPayment } from '@/lib/wp-account';

import { wpCreateTaraMoneyPaymentLink } from "@/lib/wp-orders";

interface PaymentModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onPaymentDone: () => void;
  paymentMethod: string;
  amount: number;
  orderNumber: string;
  paymentPlan: "full" | "split";
  partialPaymentPercent?: number;
  isBalancePayment?: boolean;
  onCancelOrder?: () => Promise<void> | void;
  wpOrderId?: string;
  wpOrderKey?: string;
  token?: string;
  userPhone?: string;
}

export default function PaymentModal({
  isOpen,
  onDismiss,
  onPaymentDone,
  paymentMethod,
  amount,
  orderNumber,
  paymentPlan,
  partialPaymentPercent = 60,
  isBalancePayment = false,
  onCancelOrder,
  wpOrderId,
  wpOrderKey,
  token,
  userPhone,
}: PaymentModalProps) {
  const method = siteConfig.paymentMethods.find((m) => m.id === paymentMethod);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [ussdCode, setUssdCode] = useState("");
  useEffect(() => {
    setIsPolling(false);
    setPaymentRequested(false);
    setInitiateError(null);
    setUssdCode("");
  }, [wpOrderId, isOpen]);
  
  // Extract and clean phone number (only keep digits)
  const initialPhone = (userPhone || "").replace(/\D/g, "");
  // If it's a 9 digit number starting with 6, or 12 digits starting with 2376, extract the 9 digits
  const defaultPhone = initialPhone.length === 12 && initialPhone.startsWith("2376")
    ? initialPhone.slice(3)
    : initialPhone.length === 9 && initialPhone.startsWith("6")
    ? initialPhone
    : "";

  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [savedPayments, setSavedPayments] = useState<SavedPayment[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');
  useEffect(() => {
    setSavedPayments([]); setSavedError('');
    if (!token || !isOpen) return;
    let active = true; setSavedLoading(true);
    getPayments(token).then(r => { if (active) setSavedPayments(r.items.filter(p => p.provider === paymentMethod)); }).catch(() => { if (active) setSavedError('Vos numéros enregistrés sont indisponibles. Vous pouvez saisir un numéro.'); }).finally(() => { if (active) setSavedLoading(false); });
    return () => { active = false; };
  }, [token, isOpen, paymentMethod]);
  
  // Update state if userPhone prop changes while modal is closed
  useEffect(() => {
    if (!isOpen) {
      const clean = (userPhone || "").replace(/\D/g, "");
      if (clean.length === 12 && clean.startsWith("2376")) {
        setPhoneNumber(clean.slice(3));
      } else if (clean.length === 9 && clean.startsWith("6")) {
        setPhoneNumber(clean);
      }
    }
  }, [userPhone, isOpen]);

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initiatingRef = useRef(false);
  const paymentDoneRef = useRef(onPaymentDone);
  const pollDeadlineRef = useRef(0);
  useEffect(() => { paymentDoneRef.current = onPaymentDone; }, [onPaymentDone]);

  const isValidPhone = /^[6][0-9]{8}$/.test(phoneNumber);

  const isMobileMoney =
    paymentMethod === "orange_money" || paymentMethod === "mtn_momo";
  const network = paymentMethod === "orange_money" ? "orange" : "mtn";

  const handleInitiateMobilePayment = async () => {
    if (!wpOrderId || !isValidPhone || initiatingRef.current) return;
    initiatingRef.current = true;
    setIsInitiating(true);
    setInitiateError(null);
    try {
      const response = await wpCreateTaraMoneyPaymentLink(
        { 
          orderId: wpOrderId, 
          orderKey: wpOrderKey,
          phoneNumber,
          network
        },
        token
      );
      if (response?.paymentStatus?.toUpperCase() !== "SUCCESS") throw new Error("Le prestataire n’a pas confirmé l’envoi de la demande.");
      setUssdCode(response.ussdCode || "");
      setPaymentRequested(true);
      pollDeadlineRef.current = Date.now() + 180000;
      setIsInitiating(false);
      setIsPolling(true);
    } catch (err) {
      setIsInitiating(false);
      setInitiateError(err instanceof Error ? err.message : "Erreur lors de l'initiation du paiement.");
    } finally {
      initiatingRef.current = false;
    }
  };

  // Poll order status for mobile money payments
  useEffect(() => {
    if (!isOpen || !isMobileMoney || !wpOrderId || !isPolling) return;

    let active = true;
    const deadline = pollDeadlineRef.current;

    const poll = async () => {
      try {
        const result = await pollOrderStatus(
          wpOrderId,
          wpOrderKey ?? "",
          token,
        );
        if (!active) return;
        if (
          result.paid ||
          result.status === "processing" ||
          result.status === "completed" || (!isBalancePayment && (result.status === "partial-paid" || result.status === "wc-partial-paid"))
        ) {
          // Payment confirmed by webhook — auto-redirect
          active = false;
          if (pollingRef.current) clearTimeout(pollingRef.current);
          setIsPolling(false);
          paymentDoneRef.current();
          return;
        }
        if (["FAILURE", "FAILED"].includes(result.paymentStatus || "") || ["failed", "cancelled"].includes(result.status)) {
          console.groupCollapsed(`[Mobile Money] Échec du paiement — commande ${wpOrderId}`);
          console.info("Statut vérifié", {status: result.status, paymentStatus: result.paymentStatus, paid: result.paid});
          console.info("Diagnostic serveur (données masquées)", result.debug || []);
          console.groupEnd();
          setInitiateError("Le paiement a été refusé ou annulé. Aucun paiement confirmé pour cette demande.");
          setIsPolling(false);
          setPaymentRequested(false);
          return;
        }
      } catch (pollErr) {
        if (!active) return;
        setInitiateError(pollErr instanceof Error ? pollErr.message : "Impossible de vérifier le paiement.");
      }
      if (!active) return;
      if (Date.now() >= deadline) {
        setIsPolling(false);
        setInitiateError("Le paiement n’a pas encore été confirmé. Vérifiez à nouveau avant de lancer une nouvelle demande.");
        return;
      }
      pollingRef.current = setTimeout(poll, 5000);
    };

    // Poll immediately, then every 5 seconds
    poll();

    return () => {
      active = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, isMobileMoney, wpOrderId, wpOrderKey, token, isPolling, isBalancePayment]);

  if (!isOpen || !method) return null;

  const isFirstPayment = paymentPlan === "split" && !isBalancePayment;
  const firstPaymentAmount = Math.round(amount * partialPaymentPercent / 100);
  const secondPaymentAmount = amount - firstPaymentAmount;
  const amountToPay = isFirstPayment ? firstPaymentAmount : amount;

  const headerTextColor = (() => {
    const hex = method.color.replace("#", "").trim();
    if (hex.length !== 6) return "white";
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.6 ? "#111827" : "white";
  })();

  // For mobile money, clicking outside the modal does NOT close it
  const handleBackdropClick = isMobileMoney ? undefined : onDismiss;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleBackdropClick} />

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-label="Paiement de la commande" className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="p-6 rounded-t-2xl"
          style={{ backgroundColor: method.color, color: headerTextColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">{method.label}</h3>
                <p className="text-sm opacity-90">
                  {isMobileMoney && isPolling
                    ? "En attente de validation…"
                    : "Instructions de paiement"}
                </p>
              </div>
            </div>
            {/* Only show close button for non-mobile-money methods */}
            {!isMobileMoney && (
              <button
                onClick={onDismiss}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {initiateError && <p role="alert" className="text-red-700 text-sm">{initiateError}</p>}
          {isMobileMoney && paymentRequested && ussdCode && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4" role="status">
              <p className="font-semibold">Validez sur votre téléphone</p>
              <p className="mt-2 text-sm">Si aucune fenêtre ne s’affiche, composez <strong className="text-lg">{ussdCode}</strong> depuis le numéro Mobile Money saisi pour valider la demande.</p>
            </div>
          )}
          {/* Polling indicator for mobile money */}
          {isMobileMoney && isPolling && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm font-medium text-primary">
                Vérification du paiement en cours…
              </p>
            </div>
          )}

          {/* Amount */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-1">Montant à payer</p>
            <p className="text-3xl font-bold text-primary">
              {formatPrice(amountToPay)}
            </p>
            {paymentPlan === "split" && (
              <p className="text-sm text-gray-500 mt-2">
                Premier versement ({partialPaymentPercent}%) — Reste à payer à la livraison:{" "}
                {formatPrice(secondPaymentAmount)}
              </p>
            )}
          </div>

          {/* Instructions & Phone input */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            {isMobileMoney ? (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border text-sm text-gray-700">
                  Le paiement se fait directement sur votre téléphone via une notification (push USSD).
                </div>
                {!paymentRequested && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro Mobile Money ({method.label}) *
                    </label>
                    {savedLoading && <div role="status" className="h-10 bg-gray-100 rounded mb-3 motion-safe:animate-pulse"><span className="sr-only">Chargement des numéros…</span></div>}
                    {savedError && <p className="text-sm text-gray-600 mb-3">{savedError}</p>}
                    {savedPayments.length > 0 && <label className="block text-sm mb-3">Choisir un numéro enregistré<select aria-label="Numéro enregistré" className="block w-full border rounded-lg p-2 mt-2" value={savedPayments.find(p => p.phone === phoneNumber)?.id || ''} onChange={e => { const p = savedPayments.find(p => p.id === e.target.value); setPhoneNumber(p?.phone || ''); }}><option value="">Saisir un autre numéro</option>{savedPayments.map(p => <option key={p.id} value={p.id}>{p.label || method.label} · +237 {p.phone}</option>)}</select></label>}
                    <PhoneNumber
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      error={phoneNumber.length > 0 && !isValidPhone}
                      className="mb-3"
                    />
                    {phoneNumber.length > 0 && !isValidPhone && (
                      <p className="text-red-500 text-xs mb-3">
                        Le numéro doit contenir exactement 9 chiffres et commencer par 6.
                      </p>
                    )}
                    <button
                      onClick={handleInitiateMobilePayment}
                      disabled={!isValidPhone || isInitiating}
                      className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                      {isInitiating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Valider le paiement sur mon téléphone"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium text-body mb-2">Détails</p>
                <div className="bg-white p-3 rounded-lg border text-sm text-gray-700 space-y-1">
                  {paymentMethod === "paypal" ? (
                    <>
                      <p>
                        PayPal:{" "}
                        <span className="font-semibold">{method.number}</span>
                      </p>
                      <p>
                        Envoyez la référence de commande dans le message PayPal.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Paiement par carte bancaire (simulation).</p>
                      <p>
                        Un lien de paiement vous sera communiqué via WhatsApp
                        après validation.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <p className="font-medium text-body">Comment payer:</p>
            {isMobileMoney ? (
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Entrez votre numéro ci-dessus et validez.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    Validez le paiement sur votre téléphone (une fenêtre apparaîtra).
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Si vous ne recevez pas la demande, tapez{" "}
                    <strong>
                      {ussdCode || (paymentMethod === "orange_money"
                        ? "#150*50#"
                        : "*126*6#")}
                    </strong>{" "}
                    sur votre téléphone.
                  </span>
                </li>
              </ol>
            ) : paymentMethod === "paypal" ? (
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    Ouvrez PayPal et envoyez le paiement à{" "}
                    <strong>{method.number}</strong>
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    Entrez le montant:{" "}
                    <strong>{formatPrice(amountToPay)}</strong>
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Ajoutez la référence: <strong>{orderNumber}</strong>
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Confirmez la commande.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    Nous vous envoyons un lien de paiement carte par WhatsApp.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Effectuez le paiement et partagez la confirmation.
                  </span>
                </li>
              </ol>
            )}
          </div>

          {/* Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Une fois le paiement effectué,
              envoyez-nous une capture d&apos;écran par WhatsApp au{" "}
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                className="underline font-medium"
              >
                {siteConfig.whatsapp}
              </a>
            </p>
          </div>

          {onCancelOrder ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              {cancelError ? (
                <p className="text-sm text-red-700 mb-3">{cancelError}</p>
              ) : (
                <p className="text-sm text-red-700 mb-3">
                  Si la validation sur téléphone prend trop de temps, vous
                  pouvez annuler la commande.
                </p>
              )}
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  void (async () => {
                    try {
                      setCancelError(null);
                      setIsCancelling(true);
                      await onCancelOrder();
                      onDismiss();
                    } catch (err) {
                      setCancelError(
                        err instanceof Error
                          ? err.message
                          : "Impossible d'annuler la commande.",
                      );
                    } finally {
                      setIsCancelling(false);
                    }
                  })();
                }}
                className="w-full rounded-full border border-red-300 bg-white py-3 font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                {isCancelling ? "Annulation…" : "Annuler la commande"}
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            type="button"
            onClick={async () => {
                if (!wpOrderId) return;
                try { const status = await pollOrderStatus(wpOrderId, wpOrderKey || "", token); if (status.paid || ["processing", "completed", ...(!isBalancePayment ? ["partial-paid", "wc-partial-paid"] : [])].includes(status.status)) onPaymentDone(); else setInitiateError("Le paiement n’a pas encore été confirmé. Réessayez dans quelques instants."); } catch { setInitiateError("Impossible de vérifier le paiement. Réessayez."); }
              }}
            className="w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            J&apos;ai effectué le paiement
          </button>
        </div>
      </div>
    </div>
  );
}
