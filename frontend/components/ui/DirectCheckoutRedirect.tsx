"use client";
import { useEffect, useRef, useState } from "react";
import { Product } from "@/lib/data";
import { getProductBySlugFromWp } from "@/lib/wp-products";
import { useCart } from "@/context/CartContext";
import { Link, useRouter } from "@/navigation";
import { ArrowLeft } from 'lucide-react';
export default function DirectCheckoutRedirect({ product }: { product: Product }) {
  const { addItem, setIsOpen } = useCart();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setIsOpen(false);
    getProductBySlugFromWp(product.slug).then(current => {
      if (!current) throw new Error("Produit introuvable.");
      const params = new URLSearchParams(window.location.search);
      const variation = current.variations?.find(v => v.id === Number(params.get("variationId")));
      if (current.type === "variable" && (!variation || !variation.inStock)) { router.replace(`/boutique/${current.slug}`); return; }
      if (current.type !== "variable" && current.stock <= 0) throw new Error("Ce produit est épuisé.");
      addItem({ id: variation ? `${current.id}-${variation.id}` : current.id, wpId: current.wpId, variationId: variation?.id, name: current.name, price: variation?.price ?? current.price, thumbnail: variation?.image || current.thumbnail, slug: current.slug, crossSells: current.crossSells }, false);
      const upsell = current.twodayUpsell?.products.find(p => p.slug === params.get("upsell"));
      if (upsell) addItem({id: upsell.slug, wpId: String(upsell.wpId), name: upsell.name, price: upsell.price, thumbnail: upsell.thumbnail, slug: upsell.slug}, false);
      router.replace("/checkout");
    }).catch(err => setError(err.message));
  }, [product.slug, addItem, setIsOpen, router]);
  return <div className="max-w-xl mx-auto px-4 py-12"><p role={error ? "alert" : "status"}>{error || "Préparation de votre commande…"}</p>{error && <Link href={`/boutique/${product.slug}`} className="inline-flex items-center gap-2 underline"><ArrowLeft size={18} aria-hidden="true" />Retour au produit</Link>}</div>;
}
