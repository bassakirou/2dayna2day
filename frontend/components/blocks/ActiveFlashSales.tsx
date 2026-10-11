"use client";
import { useEffect, useState } from "react";
import { getActiveFlashSale, FlashSale } from "@/lib/flash-sales";
import FlashSalesBlock from "@/components/blocks/FlashSalesBlock";
export default function ActiveFlashSales() {
  const [sale, setSale] = useState<FlashSale | null>(null);
  useEffect(() => { let active = true; getActiveFlashSale().then(data => { if (active) setSale(data); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!sale) return null;
  return <div className="max-w-7xl mx-auto px-4"><FlashSalesBlock flashSale={sale} /></div>;
}
