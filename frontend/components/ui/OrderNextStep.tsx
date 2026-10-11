"use client";
import { useEffect, useState } from "react";
import { Check, Package } from "lucide-react";
import { useAuth, type OrderTracking } from "@/context/AuthContext";
import { wpFetch } from "@/lib/wp-client";

export default function OrderNextStep({
  orderId,
  orderKey,
}: {
  orderId?: string | null;
  orderKey?: string | null;
}) {
  const { token } = useAuth();
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const refresh = async () => {
      try {
        const query = orderKey
          ? `?orderKey=${encodeURIComponent(orderKey)}`
          : "";
        const response = await wpFetch<{ tracking?: OrderTracking }>(
          `/wp-json/2day/v1/orders/${encodeURIComponent(orderId)}/status${query}`,
          { token, cache: "no-store" },
        );
        if (!response.tracking) throw new Error("Suivi indisponible.");
        if (active) {
          setTracking(response.tracking);
          setError("");
        }
      } catch {
        if (active)
          setError(
            "Impossible de charger la prochaine étape de votre commande.",
          );
      }
    };
    setTracking(null);
    setError("");
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [orderId, orderKey, token, retry]);
  return (
    <section
      className="bg-neutral-light p-6 rounded-xl text-left max-w-lg mx-auto mb-8"
      aria-label="Prochaines étapes de la commande"
    >
      <h2 className="font-bold text-lg mb-5 text-center">
        Que se passe-t-il maintenant ?
      </h2>
      {!orderId ? (
        <p className="text-sm text-gray-600">
          Consultez votre commande dans votre compte pour retrouver son suivi.
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setRetry((n) => n + 1)}
          >
            Réessayer
          </button>
        </p>
      ) : !tracking ? (
        <div role="status" className="space-y-3 motion-safe:animate-pulse">
          <span className="sr-only">Chargement du suivi…</span>
          <div className="h-5 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-white border p-4">
            <Check
              size={20}
              aria-hidden="true"
              className="shrink-0 text-emerald-700 mt-1"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1">État actuel</p>
              <h3 className="font-bold">{tracking.statusLabel}</h3>
              {tracking.description && (
                <p className="mt-2 text-sm text-gray-600">
                  {tracking.description}
                </p>
              )}
            </div>
          </div>
          {tracking.nextStep && (
            <div className="flex items-start gap-3 rounded-xl bg-white border p-4">
              <Package
                size={20}
                aria-hidden="true"
                className="shrink-0 text-gray-500 mt-1"
              />
              <div>
                <p className="text-xs text-gray-500 mb-1">Prochaine étape</p>
                <h3 className="font-bold">{tracking.nextStep.label}</h3>
                {tracking.nextStep.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {tracking.nextStep.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
