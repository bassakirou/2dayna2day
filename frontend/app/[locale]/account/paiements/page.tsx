"use client";
import { useEffect, useState } from "react";
import { CreditCard, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPayments, savePayments, type SavedPayment } from "@/lib/wp-account";
import AccountSkeleton from "@/components/ui/skeletons/AccountSkeleton";
export default function Page() {
  const { token } = useAuth();
  const [items, setItems] = useState<SavedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [provider, setProvider] =
    useState<SavedPayment["provider"]>("orange_money");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    getPayments(token)
      .then((r) => {
        if (active) setItems(r.items);
      })
      .catch(() => {
        if (active) setError("Impossible de charger vos moyens de paiement.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, retry]);
  async function save(next: SavedPayment[]) {
    if (!token) return false;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const r = await savePayments(token, next);
      setItems(r.items);
      setMessage("Moyens de paiement enregistrés.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      return false;
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <AccountSkeleton />;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mes moyens de paiement</h1>
        <p className="text-gray-600 mt-1">
          Enregistrez vos numéros Orange Money et MTN MoMo pour vos prochains
          paiements.
        </p>
      </header>
      {error && (
        <div role="alert" className="text-red-700">
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)} className="underline">
            Recharger
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="text-green-700">
          {message}
        </p>
      )}
      <div className="space-y-3">
        {!items.length && (
          <p className="p-6 bg-white border rounded-2xl text-gray-600">
            Aucun numéro enregistré.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5"
          >
            <CreditCard
              className={
                item.provider === "orange_money"
                  ? "text-orange-600"
                  : "text-amber-600"
              }
            />
            <div className="flex-1">
              <p className="font-semibold">
                {item.label ||
                  (item.provider === "orange_money"
                    ? "Orange Money"
                    : "MTN MoMo")}
              </p>
              <p className="text-sm text-gray-600">
                {item.provider === "orange_money" ? "Orange Money" : "MTN MoMo"}{" "}
                · +237 {item.phone}
              </p>
            </div>
            <button
              disabled={saving}
              aria-label={`Supprimer ${item.phone}`}
              onClick={() => void save(items.filter((i) => i.id !== item.id))}
              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg disabled:opacity-40"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
      <form
        className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const normalized = phone.replace(/\D/g, "").replace(/^237/, "");
          if (
            await save([
              ...items,
              { id: crypto.randomUUID(), label, phone: normalized, provider },
            ])
          ) {
            setPhone("");
            setLabel("");
          }
        }}
      >
        <h2 className="text-lg font-bold">Ajouter un numéro</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm space-y-2">
            <span className="block">Opérateur</span>
            <select
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as SavedPayment["provider"])
              }
              className="w-full border rounded-lg p-3"
            >
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
            </select>
          </label>
          <label className="text-sm space-y-2">
            <span className="block">Numéro de téléphone</span>
            <input
              required
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="6XX XXX XXX"
              className="w-full border rounded-lg p-3"
            />
          </label>
        </div>
        <label className="block text-sm space-y-2">
          <span className="block">Libellé (facultatif)</span>
          <input
            value={label}
            maxLength={60}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Mon numéro personnel"
            className="w-full border rounded-lg p-3"
          />
        </label>
        <button
          disabled={saving || items.length >= 10}
          className="bg-accent-red text-white rounded-xl px-5 py-3 font-semibold disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer ce numéro"}
        </button>
      </form>
    </div>
  );
}
