import type { Order } from "@/context/AuthContext";

export function orderStatusLabel(order: Pick<Order, "status" | "tracking">) {
  return order.tracking?.statusLabel || order.status;
}
export function orderKind(order: Pick<Order, "status" | "tracking">) {
  return order.tracking?.kind ?? "active";
}
