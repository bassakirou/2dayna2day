"use client";
import { useEffect, useState } from "react";
import { Award, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRewards, type Rewards } from "@/lib/wp-account";
import AccountSkeleton from "@/components/ui/skeletons/AccountSkeleton";
export default function Page() {
  const { token } = useAuth();
  const [data, setData] = useState<Rewards | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setError("");
    getRewards(token)
      .then((r) => {
        if (active) setData(r);
      })
      .catch(() => {
        if (active) setError("Impossible de charger vos récompenses.");
      });
    return () => {
      active = false;
    };
  }, [token, retry]);
  if (error)
    return (
      <div role="alert">
        {error}{" "}
        <button className="underline" onClick={() => setRetry((n) => n + 1)}>
          Réessayer
        </button>
      </div>
    );
  if (!data) return <AccountSkeleton />;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mes récompenses</h1>
        <p className="text-gray-600 mt-1">
          {data.paidOrders} commande{data.paidOrders > 1 ? "s" : ""} entièrement
          payée{data.paidOrders > 1 ? "s" : ""} ·{" "}
          {data.badges.filter((b) => b.earned).length} badge
          {data.badges.filter((b) => b.earned).length > 1 ? "s" : ""} gagné
          {data.badges.filter((b) => b.earned).length > 1 ? "s" : ""}
        </p>
      </header>
      {!data.badges.length ? (
        <div className="bg-white border rounded-2xl p-8 text-center">
          <Award className="mx-auto text-amber-600 mb-3" size={40} />
          <p>Les récompenses seront bientôt disponibles.</p>
          <p className="text-sm text-gray-600 mt-2">
            Retrouvez ici vos badges et vos avantages fidélité.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {data.badges.map((b) => (
            <article
              key={b.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex gap-3 items-center">
                {b.earned ? (
                  <Award className="text-amber-600" size={36} />
                ) : (
                  <Lock className="text-gray-400" size={30} />
                )}
                <div>
                  <h2 className="font-bold text-lg">{b.name}</h2>
                  <p className="text-sm text-gray-600">
                    {b.earned
                      ? "Badge gagné"
                      : `${b.progress} / ${b.orders} commandes payées`}
                  </p>
                </div>
              </div>
              {!b.earned && (
                <progress
                  className="w-full accent-accent-red"
                  max={b.orders}
                  value={b.progress}
                  aria-label={`Progression vers ${b.name}`}
                />
              )}
              {b.percent > 0 && (
                <p>
                  {b.percent}% de réduction{" "}
                  {b.scope === "next"
                    ? "sur votre prochaine commande"
                    : "sur vos prochaines commandes"}
                  {b.days > 0
                    ? ` pendant ${b.days} jours après attribution`
                    : ""}
                  .
                </p>
              )}
              {b.earnedAt && (
                <p className="text-sm text-gray-500">
                  Gagné le {new Date(b.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              )}
              {b.coupon && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">
                    {b.usable
                      ? "Code à saisir au paiement"
                      : "Avantage utilisé ou expiré"}
                  </p>
                  <code className="text-sm break-all">{b.coupon}</code>
                  {b.expiresAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Valable jusqu’au{" "}
                      {new Date(b.expiresAt).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
