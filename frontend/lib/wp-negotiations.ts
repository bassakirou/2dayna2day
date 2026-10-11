import { wpFetch } from "@/lib/wp-client";

export type WpNegotiationProduct = {
  id: number;
  slug: string;
  name: string;
  thumbnail?: string;
  image?: string;
  price?: number | null;
  currency?: string;
  editUrl?: string;
};

export type WpNegotiationOffer = {
  id: number;
  conversationId: number;
  userId: number;
  productId: number;
  productSlug: string;
  productName: string;
  productThumbnail: string;
  originalPrice: number;
  negotiatedPrice: number;
  currency: string;
  status: "active" | "ordered";
  orderId?: number;
  createdAt: number;
  product?: WpNegotiationProduct;
};

export type WpNegotiationOrder = {
  id: number;
  number: string;
  total: string;
  currency: string;
  payUrl: string;
  adminUrl?: string;
  items?: Array<{
    productId: number;
    name: string;
    quantity: number;
    subtotal: string;
    total: string;
    product?: WpNegotiationProduct;
  }>;
};

export type WpNegotiationMessage = {
  id: number;
  conversationId: number;
  sender: "user" | "seller";
  type: "text" | "product_suggestions" | "offer" | "order";
  text?: string;
  productIds?: number[];
  offerId?: number;
  orderId?: number;
  createdAt: number;
  author?: { id: number; name: string };
  offer?: WpNegotiationOffer;
  order?: WpNegotiationOrder;
  products?: WpNegotiationProduct[];
};

export type WpNegotiationConversation = {
  unreadCount?: number;
  id: number;
  title: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  product?: WpNegotiationProduct;
  productSlug?: string;
  createdAt: number;
  updatedAt: number;
  last?: {
    text: string;
    createdAt: number;
  };
};

export async function wpListNegotiations(
  token: string,
  search?: string,
): Promise<WpNegotiationConversation[]> {
  const res = await wpFetch<{
    items: WpNegotiationConversation[];
  }>(
    "/wp-json/2day/v1/negotiations" +
      (search ? `?search=${encodeURIComponent(search)}` : ""),
    {
      method: "GET",
      token,
    },
  );
  return res.items || [];
}

export async function wpCreateNegotiationConversation(
  token: string,
  input: { title?: string; productSlug?: string; productId?: number },
) {
  return wpFetch<{ id: number }>("/wp-json/2day/v1/negotiations", {
    method: "POST",
    token,
    body: input,
  });
}

export async function wpListNegotiationMessages(
  token: string,
  conversationId: string | number,
) {
  const res = await wpFetch<{
    items: WpNegotiationMessage[];
  }>(`/wp-json/2day/v1/negotiations/${conversationId}/messages`, {
    method: "GET",
    token,
  });
  return res.items || [];
}

export async function wpSendNegotiationMessage(
  token: string,
  conversationId: string | number,
  input: {
    text?: string;
    type?: "text" | "product_suggestions" | "offer" | "order";
    productIds?: number[];
    offerId?: number;
    orderId?: number;
  },
) {
  return wpFetch<WpNegotiationMessage>(
    `/wp-json/2day/v1/negotiations/${conversationId}/messages`,
    {
      method: "POST",
      token,
      body: input,
    },
  );
}

export async function wpGetNegotiationOffer(
  token: string,
  offerId: string | number,
) {
  return wpFetch<WpNegotiationOffer>(
    `/wp-json/2day/v1/negotiations/offers/${offerId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function wpMarkNegotiationOfferAsOrdered(
  token: string,
  offerId: string | number,
  input?: { orderId?: number },
) {
  return wpFetch<WpNegotiationOffer>(
    `/wp-json/2day/v1/negotiations/offers/${offerId}/mark-ordered`,
    {
      method: "POST",
      token,
      body: input || {},
    },
  );
}

export async function wpGetNegotiationTyping(
  token: string,
  conversationId: string | number,
) {
  return wpFetch<{
    conversationId: number;
    userTyping: boolean;
    sellerTyping: boolean;
  }>(`/wp-json/2day/v1/negotiations/${conversationId}/typing`, {
    method: "GET",
    token,
  });
}

export async function wpSetNegotiationTyping(
  token: string,
  conversationId: string | number,
  isTyping: boolean,
) {
  return wpFetch<{
    conversationId: number;
    sender: "user" | "seller";
    isTyping: boolean;
  }>(`/wp-json/2day/v1/negotiations/${conversationId}/typing`, {
    method: "POST",
    token,
    body: { isTyping },
  });
}
