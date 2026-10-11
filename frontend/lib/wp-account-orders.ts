import type { Order } from "@/context/AuthContext";
import { wpFetch } from "@/lib/wp-client";

type WpOrder = Order & {
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  productName: string;
  productThumbnail: string;
  amount: number;
  currency: string;
  city: string;
  status: Order["status"];
  createdAt: number;
  updatedAt: number;
  paymentPlan?: "full" | "split";
  discountAmount?: number;
  partialPaymentPercent?: number;
  balanceRemaining?: number;
  datePaid?: number | null;
  address?: string;
};

export async function wpListMyOrders(token: string) {
  const items: WpOrder[] = [];
  let page = 1;
  let total = 0;
  do {
    const res = await wpFetch<{ items: WpOrder[]; total: number }>(`/wp-json/2day/v1/orders?page=${page}&per_page=100`, { token, cache: 'no-store' });
    const batch = Array.isArray(res.items) ? res.items : [];
    items.push(...batch);
    total = res.total;
    if (!batch.length) break;
    page++;
  } while (items.length < total);
  return items;
}

