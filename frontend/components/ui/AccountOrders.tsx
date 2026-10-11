"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Package } from "lucide-react";
import { Link } from "@/navigation";
import { useAuth, type Order } from "@/context/AuthContext";
import { formatPrice } from "@/lib/data";
import { orderKind, orderStatusLabel } from "@/lib/order-status";
import AccountSkeleton from "./skeletons/AccountSkeleton";
export function OrderImage({
  order,
}: {
  order: Pick<Order, "productThumbnail" | "productName">;
}) {
  return (
    <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
      {order.productThumbnail ? (
        <Image
          src={order.productThumbnail}
          alt={order.productName}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <Package className="text-gray-400" size={30} />
      )}
    </div>
  );
}
export function useAccountOrders() {
  const { token, orders, refreshOrders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    refreshOrders()
      .catch(() => {
        if (active) setError("Impossible de charger vos commandes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const update = () => {
      if (document.visibilityState !== "visible") return;
      void refreshOrders()
        .then(() => {
          if (active) setError("");
        })
        .catch(() => {
          if (active)
            setError("Impossible d’actualiser vos commandes. Réessayez.");
        });
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      active = false;
    };
  }, [token, refreshOrders, retry]);
  return { token, orders, loading, error, retry: () => setRetry((n) => n + 1) };
}
export default function AccountOrders({
  tracking = false,
}: {
  tracking?: boolean;
}) {
  const { orders, loading, error, retry } = useAccountOrders();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = orders
    .filter((o) =>
      tracking
        ? !["completed", "stopped"].includes(orderKind(o))
        : filter === "all" ||
          (filter === "active"
            ? !["completed", "stopped"].includes(orderKind(o))
            : filter === "completed"
              ? orderKind(o) === "completed"
              : orderKind(o) === "stopped"),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  const pages = Math.ceil(filtered.length / 8);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          {tracking ? "Suivi de mes colis" : "Mes commandes"}
        </h1>
        <p className="text-gray-600 mt-1">
          {tracking
            ? "Retrouvez les commandes en cours et leurs étapes de livraison."
            : "Consultez l’historique et le statut de vos commandes."}
        </p>
      </header>
      {!tracking && (
        <label className="flex items-center gap-3 text-sm">
          Afficher
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 p-2 bg-white"
          >
            <option value="all">Toutes les commandes</option>
            <option value="active">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées / remboursées</option>
          </select>
        </label>
      )}
      {loading ? (
        <AccountSkeleton rows={2} />
      ) : error ? (
        <div role="alert" className="p-6 bg-white rounded-2xl border">
          {error}
          <button onClick={retry} className="ml-3 underline">
            Réessayer
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={36} />
          <p>Aucune commande à afficher.</p>
          <Link
            href="/boutique"
            className="inline-block mt-4 text-accent-red font-medium"
          >
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <>
          <div className="grid xl:grid-cols-2 gap-5">
            {filtered.slice((page - 1) * 8, page * 8).map((o) => (
              <article
                key={o.id}
                className="bg-white border border-gray-200 rounded-2xl p-5"
              >
                <div className="flex gap-4">
                  <OrderImage order={o} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-bold">
                        {o.orderNumber.replace(/^##/, "#")}
                      </h2>
                      <span className="text-accent-red text-sm font-semibold tabular-nums">
                        {formatPrice(o.amount)}
                      </span>
                    </div>
                    <p className="mt-2 truncate" title={o.productName}>
                      {o.productName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 mt-4">
                  <span className="text-sm text-gray-600">
                    {orderStatusLabel(o)}
                  </span>
                  <Link
                    href={`/account/orders?id=${encodeURIComponent(o.id)}`}
                    className="inline-flex gap-2 items-center font-semibold text-sm text-accent-red hover:underline"
                  >
                    {tracking ? "Suivre" : "Détails"}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {pages > 1 && (
            <nav
              aria-label="Pagination des commandes"
              className="flex gap-4 items-center justify-center"
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border rounded-lg px-4 py-2 disabled:opacity-40"
              >
                Précédent
              </button>
              <span>
                {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="border rounded-lg px-4 py-2 disabled:opacity-40"
              >
                Suivant
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
