"use client";
import { useEffect, useState } from "react";
import { FlashSale } from "@/lib/flash-sales";
import { formatPrice } from "@/lib/data";
import { Link } from "@/navigation";
import { Badge } from "@/components/ui/Badge";

export default function FlashSalesBlock({ flashSale }: { flashSale: FlashSale }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(flashSale.endDate).getTime() - Date.now()));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [flashSale.endDate]);
  if (!remaining || !Number.isFinite(remaining)) return <p>Cette vente flash est terminée.</p>;
  const seconds = Math.floor(remaining / 1000);
  return <section className="py-8">
    <div className="flex flex-wrap gap-4 justify-between mb-6"><h2 className="text-2xl font-bold">{flashSale.name}</h2><p className="tabular-nums">Fin dans {Math.floor(seconds / 86400)} j {Math.floor(seconds / 3600) % 24} h {Math.floor(seconds / 60) % 60} min {seconds % 60} s</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{flashSale.products.map(item => {
      const stock = Math.max(0, item.totalAllocated - item.soldQuantity);
      const progress = item.totalAllocated > 0 ? Math.max(0, Math.min(100, item.soldQuantity / item.totalAllocated * 100)) : 0;
      return <Link key={item.product.id} href={`/boutique/${item.product.slug}`} className="bg-white border border-gray-200 rounded-xl p-4">
        <Badge type="flash" />
        {/* Remote media is served directly on the static host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.product.thumbnail || "/images/hero-products.png"} alt={item.product.name} loading="lazy" className="w-full aspect-square object-cover rounded-lg my-3" />
        <h3 className="font-semibold break-words">{item.product.name}</h3><p className="text-xl font-bold my-3">{formatPrice(item.flashPrice)}</p>
        <progress value={progress} max={100} aria-label="Stock vendu" className="w-full accent-primary" /><p className="text-sm mt-2">{stock > 0 ? `${stock} restant(s)` : "Épuisé"}</p>
      </Link>;
    })}</div>
  </section>;
}
