import { wpFetch } from "@/lib/wp-client";

export type TaraMoneySettings = {
  provider?: "taramoney" | "campay" | "";
  discountPercent: number;
  enablePartialPayment: boolean;
  partialPaymentPercent: number;
};

/**
 * Fetch TaraMoney gateway settings (discount percent and partial payment).
 * Falls back to defaults if the endpoint is unreachable.
 */
export async function fetchTaraMoneySettings(): Promise<TaraMoneySettings> {
  try {
    const data = await wpFetch<{ provider?: string; discountPercent?: number; enablePartialPayment?: boolean; partialPaymentPercent?: number }>(
      "/wp-json/2day/v1/taramoney/settings",
      { cache: "no-store" },
    );
    const pct = typeof data?.discountPercent === "number" && Number.isFinite(data.discountPercent) ? data.discountPercent : 0;
    return {
      provider: data?.provider === "campay" ? "campay" : data?.provider === "taramoney" ? "taramoney" : "",
      discountPercent: Math.max(0, Math.min(100, pct)),
      enablePartialPayment: data?.enablePartialPayment === true,
      partialPaymentPercent: typeof data?.partialPaymentPercent === "number" && Number.isFinite(data.partialPaymentPercent) ? Math.max(1, Math.min(99, data.partialPaymentPercent)) : 60,
    };
  } catch {
    return { discountPercent: 0, enablePartialPayment: false, partialPaymentPercent: 60 };
  }
}

export type OrderStatusResponse = {
  provider?: string;
  debug?: unknown[];
  paymentStatus?: string;
  status: string;
  paid: boolean;
};

/**
 * Poll the status of an order.
 * Used by PaymentModal to detect when TaraMoney webhook has confirmed payment.
 */
export async function pollOrderStatus(
  orderId: string,
  orderKey: string,
  token?: string | null,
): Promise<OrderStatusResponse> {
  const qs = orderKey
    ? `?orderKey=${encodeURIComponent(orderKey)}`
    : "";
  const data = await wpFetch<OrderStatusResponse>(
    `/wp-json/2day/v1/orders/${encodeURIComponent(orderId)}/status${qs}`,
    { token },
  );
  console.debug("[Mobile Money] Vérification serveur", {orderId, provider: data?.provider, status: data?.status, paymentStatus: data?.paymentStatus, paid: data?.paid, debug: data?.debug});
  return {
    provider: data?.provider,
    debug: data?.debug,
    status: data?.status ?? "pending",
    paid: data?.paid ?? false,
    paymentStatus: data?.paymentStatus,
  };
}
