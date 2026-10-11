import BoutiqueClient from "./BoutiqueClient";
import { Suspense } from "react";
import { getCategories } from "@/lib/wp-categories";
import { getProducts } from "@/lib/wp-products";

interface BoutiquePageProps {
  params: Promise<{ locale: string }>;
}

export default async function BoutiquePage({ params }: BoutiquePageProps) {
  const { locale } = await params;
  
  const categories = await getCategories(locale);
  const products = await getProducts({ locale });
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BoutiqueClient categories={categories} products={products} />
    </Suspense>
  );
}
