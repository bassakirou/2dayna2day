"use client";
import { useState } from "react";
import Image from "next/image";
import { Check, Mail, Package, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { formatPrice } from "@/lib/data";
import { orderStatusLabel } from "@/lib/order-status";
import { useAccountOrders } from "./AccountOrders";
import WorkflowDescription from "./WorkflowDescription";
import AccountSkeleton from "./skeletons/AccountSkeleton";
import { emailOrder } from "@/lib/wp-account";
export default function OrderDetail() {
  const params = useSearchParams();
  const { token, orders, loading, error, retry } = useAccountOrders();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  // Older hosting rewrites could prepend id=index.txt during index lookup.
  // Accept one unambiguous WooCommerce ID, still restricted to this user's orders.
  const ids = [...new Set(params.getAll("id").filter((id) => /^[1-9]\d*$/.test(id)))];
  const orderId = ids.length === 1 ? ids[0] : null;
  const order = orders.find((o) =>
    params.has("id")
      ? orderId !== null && o.id === orderId
      : o.orderNumber === params.get("order"),
  );
  if (loading) return <AccountSkeleton />;
  if (error)
    return (
      <div role="alert">
        {error}{" "}
        <button onClick={retry} className="underline">
          Réessayer
        </button>
      </div>
    );
  if (!order)
    return (
      <p>
        Commande introuvable.{" "}
        <Link href="/account/commandes" className="underline">
          Mes commandes
        </Link>
      </p>
    );
  const tracking = order.tracking;
  const terminal = tracking?.kind === "stopped";
  const steps = (tracking?.steps ?? []).filter(
    (step) => step.state !== "unrecorded",
  );
  const currentIndex = steps.findIndex((step) => step.state === "current");
  const lines = order.items || [
    {
      id: order.id,
      name: order.productName,
      quantity: 1,
      total: order.amount,
      thumbnail: order.productThumbnail,
    },
  ];
  const history = order.history || [];
  const date = (timestamp: number) =>
    new Date(timestamp).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const sendEmail = async () => {
    if (!token) return;
    setSending(true);
    setMessage("");
    try {
      await emailOrder(token, order.id);
      setMessage("Email de suivi envoyé à l’adresse de la commande.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };
  return (
    <article className="space-y-6">
      <Link
        href="/account/commandes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-accent-red"
      >
        <ArrowLeft size={16} />
        Mes commandes
      </Link>
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Commande {order.orderNumber.replace(/^##/, "#")}
          </h1>
          <p className="text-gray-600 mt-2">
            Livraison à {order.city || "l’adresse indiquée"} ·{" "}
            {lines.reduce((n, l) => n + l.quantity, 0)} article(s) ·{" "}
            {formatPrice(order.amount)}
          </p>
        </div>
        <button
          disabled={sending}
          onClick={() => void sendEmail()}
          className="self-start inline-flex items-center gap-2 bg-accent-red text-white rounded-xl px-5 py-3 font-semibold disabled:opacity-50"
        >
          <Mail size={18} />
          {sending ? "Envoi…" : "Email de suivi"}
        </button>
      </header>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <section
          className={`${terminal ? "bg-gray-700" : "bg-accent-red"} text-white p-6 sm:p-8`}
        >
          <h2 className="text-2xl font-bold">{orderStatusLabel(order)}</h2>
          <p className="mt-2">
            {terminal
              ? "Cette commande ne poursuit plus son parcours."
              : tracking?.kind === "completed"
                ? "Votre commande est terminée."
                : tracking?.nextStep
                  ? `Prochaine étape : ${tracking.nextStep.label}`
                  : "Aucune prochaine étape définie pour ce statut."}
          </p>
          {!terminal && currentIndex >= 0 && steps.length > 1 && (
            <p className="mt-7 text-sm font-semibold">
              Étape actuelle : {currentIndex + 1} / {steps.length}
            </p>
          )}
        </section>
        <div className="grid xl:grid-cols-[1fr_320px] gap-8 p-6 sm:p-8">
          <section>
            <h2 className="text-lg font-bold mb-6">Suivi détaillé</h2>
            {steps.length > 0 && (
              <ol>
                {steps.map((step, i) => {
                  const reached = step.state === "visited";
                  const current = step.state === "current";
                  const timestamp = step.date;
                  return (
                    <li
                      key={step.id}
                      className="relative flex gap-4 pb-8 last:pb-0"
                      aria-current={current ? "step" : undefined}
                    >
                      {i < steps.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
                      )}
                      <div
                        className={`z-10 w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${reached ? "bg-emerald-700 text-white" : current ? "bg-accent-red text-white" : "bg-white border border-gray-200 text-gray-400"}`}
                      >
                        {reached ? <Check size={19} /> : <Package size={19} />}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`font-semibold ${reached ? "text-body" : "text-gray-500"}`}
                        >
                          {step.label}
                          <WorkflowDescription
                            label={step.label}
                            description={step.description}
                          />
                          {current && (
                            <span className="ml-2 text-xs text-accent-red">
                              Étape actuelle
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {timestamp
                            ? date(timestamp)
                            : current
                              ? "Étape actuelle"
                              : step.state === "upcoming"
                                ? "À venir"
                                : "À venir"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {history.length > 0 && (
              <div className="mt-8 border-t pt-5">
                <h3 className="font-semibold mb-3">Historique des statuts</h3>
                <ul className="space-y-3 text-sm">
                  {history
                    .slice()
                    .reverse()
                    .map((e, i) => (
                      <li
                        key={`${e.date}-${i}`}
                        className="flex flex-wrap justify-between gap-2"
                      >
                        <span>{e.label || e.status}</span>
                        <time className="text-gray-500">{date(e.date)}</time>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-gray-600 mt-6">
              Vous recevez un email à chaque changement de statut. Les dates de
              livraison apparaîtront lorsqu’elles seront confirmées.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold">Articles de la commande</h2>
            {lines.map((line) => (
              <div
                key={line.id}
                className="flex gap-3 py-3 border-b border-gray-100"
              >
                <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                  {line.thumbnail && (
                    <Image
                      src={line.thumbnail}
                      alt={line.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-gray-500">
                    Qté : {line.quantity} · {formatPrice(line.total)}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-3 text-sm space-y-3">
              <p className="font-semibold">Adresse de livraison</p>
              <p className="text-gray-600">
                {order.address || order.city || "Non renseignée"}
              </p>
              <p>
                Total : <strong>{formatPrice(order.amount)}</strong>
              </p>
              {order.paymentPlan === "split" && (
                <p>
                  Solde restant :{" "}
                  <strong>{formatPrice(order.balanceRemaining ?? 0)}</strong>
                </p>
              )}
              {[
                "pending",
                "partial-paid",
                "wc-partial-paid",
                "failed",
              ].includes(order.status) && (
                <Link
                  href={`/checkout?orderId=${encodeURIComponent(order.id)}`}
                  className="inline-block bg-accent-red text-white rounded-xl px-5 py-3 font-semibold"
                >
                  {order.status.includes("partial-paid")
                    ? "Payer le solde"
                    : "Payer ma commande"}
                </Link>
              )}
              <Link
                href="/account/conversations"
                className="block text-accent-red hover:underline"
              >
                Contacter le service client
              </Link>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
