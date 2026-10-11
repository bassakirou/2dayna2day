import { wpFetch } from "./wp-client";
import type { Review } from "./wp-reviews";
export type SavedPayment = {
  id: string;
  label: string;
  phone: string;
  provider: "orange_money" | "mtn_momo";
};
export type Badge = {
  id: string;
  name: string;
  orders: number;
  percent: number;
  scope: "next" | "all";
  days: number;
  earned: boolean;
  earnedAt: number | null;
  coupon: string;
  progress: number;
  usable: boolean;
  expiresAt: number | null;
};
export type Rewards = {
  memberSince: string;
  paidOrders: number;
  badges: Badge[];
};
export type AccountReview = Review & { productName: string; status: string };
export const getPayments = (token: string) =>
  wpFetch<{ items: SavedPayment[] }>(
    "/wp-json/2day/v1/account/payment-methods",
    { token, cache: "no-store" },
  );
export const savePayments = (token: string, items: SavedPayment[]) =>
  wpFetch<{ items: SavedPayment[] }>(
    "/wp-json/2day/v1/account/payment-methods",
    { token, method: "PUT", body: { items } },
  );
const rewardRequests = new Map<string, Promise<Rewards>>();
export const getRewards = (token: string): Promise<Rewards> => {
  const pending = rewardRequests.get(token);
  if (pending) return pending;
  const request = wpFetch<Rewards>("/wp-json/2day/v1/account/rewards", {
    token,
    cache: "no-store",
  })
    .then((data) => {
      if (!Array.isArray(data.badges))
        throw new Error("Récompenses indisponibles.");
      return data;
    })
    .finally(() => rewardRequests.delete(token));
  rewardRequests.set(token, request);
  return request;
};
export const getMyReviews = (
  token: string,
  page: number,
  rating: string,
  sort: string,
) =>
  wpFetch<{ items: AccountReview[]; total: number; pages: number }>(
    `/wp-json/2day/v1/account/reviews?page=${page}&rating=${rating}&sort=${sort}`,
    { token, cache: "no-store" },
  );
export const getMyReview = (token: string, id: string) =>
  wpFetch<AccountReview>(
    `/wp-json/2day/v1/account/reviews/${encodeURIComponent(id)}`,
    { token, cache: "no-store" },
  );
export const emailOrder = (token: string, id: string) =>
  wpFetch(`/wp-json/2day/v1/account/orders/${encodeURIComponent(id)}/email`, {
    token,
    method: "POST",
  });
