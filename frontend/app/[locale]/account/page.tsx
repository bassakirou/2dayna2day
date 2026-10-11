"use client";
import { Package, PiggyBank, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/navigation";
import { formatPrice, siteConfig } from "@/lib/data";
import { orderKind, orderStatusLabel } from "@/lib/order-status";
import { useAccountOrders, OrderImage } from "@/components/ui/AccountOrders";
import AccountSkeleton from "@/components/ui/skeletons/AccountSkeleton";
export default function Dashboard() {
  const { user } = useAuth();
  const { orders, loading, error, retry } = useAccountOrders();
  const active = orders.filter(
    (o) =>
      !["completed", "stopped"].includes(orderKind(o)),
  );
  const spent = orders
    .filter(
      (o) =>
        o.datePaid ||
        [
          "completed",
          "livree",
          "processing",
          "partial-paid",
          "wc-partial-paid",
        ].includes(o.status),
    )
    .reduce(
      (total, o) =>
        total +
        Math.max(
          0,
          o.amount -
            (o.paymentPlan === "split" ? (o.balanceRemaining ?? 0) : 0),
        ),
      0,
    );
  const savings = orders
    .filter((o) => orderKind(o) !== "stopped")
    .reduce((total, o) => total + (o.discountAmount ?? 0), 0);
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
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">
          Bonjour {user?.profile.firstName}
        </h1>
        <p className="text-gray-600 mt-2">
          Bienvenue sur votre tableau de bord {siteConfig.siteName}
        </p>
      </header>
      <dl className="grid sm:grid-cols-3 gap-5">
        {[
          { label: "Commandes", value: orders.length, icon: Package },
          { label: "Dépensé", value: formatPrice(spent), icon: TrendingUp },
          { label: "Économisé", value: formatPrice(savings), icon: PiggyBank },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex justify-between items-center gap-3"
          >
            <div>
              <dt className="text-gray-500 text-sm">{s.label}</dt>
              <dd
                className={`text-2xl font-bold mt-2 tabular-nums ${s.label === "Économisé" ? "text-green-700" : ""}`}
              >
                {s.value}
              </dd>
            </div>
            <s.icon size={26} className="text-accent-red shrink-0" />
          </div>
        ))}
      </dl>
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">En cours ({active.length})</h2>
          <Link
            href="/account/commandes"
            className="flex items-center gap-2 text-accent-red text-sm"
          >
            Tout voir <ArrowRight size={16} />
          </Link>
        </div>
        {!active.length ? (
          <p className="bg-white border rounded-2xl p-8 text-gray-600">
            Vous n’avez aucune commande en cours.
          </p>
        ) : (
          <ul className="space-y-4">
            {active.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap sm:flex-nowrap items-center gap-4"
              >
                <OrderImage order={o} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{o.productName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {o.orderNumber} · {formatPrice(o.amount)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {orderStatusLabel(o)}
                  </p>
                </div>
                <Link
                  href={`/account/orders?id=${encodeURIComponent(o.id)}`}
                  className="bg-accent-red text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Suivre
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
