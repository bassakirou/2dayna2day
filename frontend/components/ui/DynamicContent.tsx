"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getFAQs, getPageBySlug, WPFAQ, WPPage } from "@/lib/wp-pages";
import { getActiveFlashSale, FlashSale } from "@/lib/flash-sales";
import { sanitizeHtml } from "@/lib/html";
import FAQAccordion from "@/components/ui/FAQAccordion";
import FlashSalesBlock from "@/components/blocks/FlashSalesBlock";

export default function DynamicContent({ kind, pageSlug }: { kind: "faq" | "flash" | "cms"; pageSlug?: string }) {
  const params = useSearchParams();
  const slug = pageSlug || params.get("slug") || "";
  const [data, setData] = useState<WPFAQ[] | FlashSale | WPPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null);
    const request = kind === "faq" ? getFAQs() : kind === "flash" ? getActiveFlashSale() : getPageBySlug(slug);
    request.then(result => { if (active) setData(result); }).catch(() => { if (active) setError("Impossible de charger le contenu. Vérifiez votre connexion puis réessayez."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, slug, retry]);
  return <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
    <h1 className="text-3xl font-bold mb-8">{kind === "faq" ? "Foire aux questions" : kind === "flash" ? "Ventes flash" : data && "title" in data ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.title.rendered) }} /> : "Page"}</h1>
    {loading ? <p role="status">Chargement…</p> : error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(n => n + 1)} className="mt-4 underline">Réessayer</button></div> : kind === "faq" ? <FAQAccordion faqs={data as WPFAQ[] ?? []} /> : kind === "flash" ? data ? <FlashSalesBlock flashSale={data as FlashSale} /> : <p>Aucune vente flash active pour le moment.</p> : data ? <article className="max-w-3xl space-y-4 break-words [&_a]:underline [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: sanitizeHtml((data as WPPage).content.rendered) }} /> : <p>Page introuvable.</p>}
  </main>;
}
