import { Product } from "./data";
import { wpFetch } from "./wp-client";

export interface FlashSaleProduct {
  product: Product;
  flashPrice: number;
  totalAllocated: number;
  soldQuantity: number;
}

export interface FlashSale {
  id: string;
  name: string;
  startDate: string; // ISO String
  endDate: string; // ISO String
  banner?: string;
  themeColor?: string;
  status: "active" | "scheduled" | "ended";
  products: FlashSaleProduct[];
}

/**
 * Récupère la vente flash active depuis le backend WooCommerce via la REST API.
 * Appel côté client sans cache pour conserver les prix et stocks actuels.
 */
export async function getActiveFlashSale(): Promise<FlashSale | null> {
  try {
    const res = await wpFetch<FlashSale | null>("/wp-json/2day/v1/flash-sales/active", {
      cache: "no-store"
    });
    if (res === null) return null;
    if (!res || typeof res !== "object" || !Array.isArray(res.products) || !Number.isFinite(Date.parse(res.endDate))) throw new Error("Réponse de vente flash invalide.");
    return res;
  } catch (error) {
    console.error("Erreur lors de la récupération de la vente flash:", error);
    throw error;
  }
}
