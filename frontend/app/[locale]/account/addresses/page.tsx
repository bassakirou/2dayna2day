"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Address, getAddresses, saveAddress, deleteAddress } from "@/lib/wp-addresses";
import AccountSkeleton from '@/components/ui/skeletons/AccountSkeleton';

const empty = { name: "", phone: "", city: "", address: "", isDefault: false };
export default function AddressesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState<Partial<Address>>(empty);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true; setLoading(true); setError("");
    getAddresses(token).then(result => { if (active) setItems(result); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, retry]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!token || busy) return;
    setBusy(true); setError("");
    try { setItems(await saveAddress(token, form)); setEditing(false); setForm(empty); } catch (err) { setError(err instanceof Error ? err.message : "Impossible de sauvegarder l’adresse."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!token || busy) return; setBusy(true); setError("");
    try { setItems(await deleteAddress(token, id)); } catch (err) { setError(err instanceof Error ? err.message : "Impossible de supprimer l’adresse."); } finally { setBusy(false); }
  }
  return <div>
    <h2 className="text-xl font-bold mb-6">Carnet d’adresses</h2>
    {error && <div role="alert" className="text-red-700 mb-4">{error} <button onClick={() => setRetry(n => n + 1)} className="underline">Réessayer</button></div>}
    {loading ? <AccountSkeleton rows={2} /> : <>
      <button className="bg-primary text-white rounded-xl px-4 py-3 mb-6" onClick={() => { setForm(empty); setEditing(true); }}>Ajouter une adresse</button>
      {editing && <form onSubmit={save} className="space-y-4 max-w-lg mb-8">
        {([['name', 'Nom complet'], ['phone', 'Téléphone'], ['city', 'Ville'], ['address', 'Adresse complète']] as const).map(([key, label]) => <label key={key} className="block">{label}<input required maxLength={250} type={key === 'phone' ? 'tel' : 'text'} value={form[key] ?? ''} onChange={e => setForm({...form, [key]: e.target.value})} className="block w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" /></label>)}
        <label className="flex gap-2"><input type="checkbox" checked={!!form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />Adresse par défaut</label>
        <div className="flex gap-4"><button disabled={busy} className="bg-primary text-white px-4 py-3 rounded-xl">{busy ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" disabled={busy} onClick={() => setEditing(false)}>Annuler</button></div>
      </form>}
      {!items.length && <p>Aucune adresse enregistrée.</p>}
      <div className="space-y-4">{items.map(item => <article key={item.id} className="border border-gray-200 rounded-xl p-4 break-words"><h3 className="font-bold">{item.name} {item.isDefault && '(Par défaut)'}</h3><p>{item.address}, {item.city}</p><p>{item.phone}</p><div className="flex gap-4 mt-3"><button disabled={busy} onClick={() => { setForm(item); setEditing(true); }} className="underline">Modifier</button><button disabled={busy} onClick={() => remove(item.id)} className="text-red-700 underline">Supprimer</button></div></article>)}</div>
    </>}
  </div>;
}
