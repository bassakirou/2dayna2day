import { wpGraphqlFetch } from "@/lib/wp-graphql";
import { wpFetch } from "@/lib/wp-client";

export type TwoDayAddressInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  city?: string;
  address1?: string;
  address2?: string;
  state?: string;
  country?: string;
  company?: string;
};

export type TwoDayOrderLineInput = {
  productId: string;
  quantity: number;
  variationId?: string;
};

export type TwoDayCreateOrderDraftInput = {
  lines: TwoDayOrderLineInput[];
  billing: Required<
    Pick<TwoDayAddressInput, "firstName" | "lastName" | "email">
  > &
    Omit<TwoDayAddressInput, "email">;
  shipping?: TwoDayAddressInput;
  customerNote?: string;
  paymentMethod?: string;
  shippingMethodId?: string;
  paymentPlan?: string;
  rewardCode?: string;
};

export type TwoDayOrderDraft = {
  orderId: string;
  orderKey: string;
  orderNumber: string;
  status: string;
  total: string;
  currency: string;
};

export async function wpCreateOrderDraft(
  input: TwoDayCreateOrderDraftInput,
  token?: string | null,
) {
  const query = `
    mutation TwoDayCreateOrderDraft($input: TwoDayCreateOrderDraftInput!) {
      twoDayCreateOrderDraft(input: $input) {
        orderId
        orderKey
        orderNumber
        status
        total
        currency
      }
    }
  `;

  const data = await wpGraphqlFetch<
    { twoDayCreateOrderDraft: TwoDayOrderDraft },
    { input: TwoDayCreateOrderDraftInput }
  >(query, { input }, { token });

  return data.twoDayCreateOrderDraft;
}

export type TwoDayConfirmOrderPaymentInput = {
  orderId: string;
  orderKey?: string;
  transactionId?: string;
};

export async function wpConfirmOrderPayment(
  input: TwoDayConfirmOrderPaymentInput,
  token?: string | null,
) {
  const query = `
    mutation TwoDayConfirmOrderPayment($input: TwoDayConfirmOrderPaymentInput!) {
      twoDayConfirmOrderPayment(input: $input) {
        orderId
        status
        total
        currency
      }
    }
  `;

  const data = await wpGraphqlFetch<
    {
      twoDayConfirmOrderPayment: {
        orderId: string;
        status: string;
        total: string;
        currency: string;
      };
    },
    { input: TwoDayConfirmOrderPaymentInput }
  >(query, { input }, { token });

  return data.twoDayConfirmOrderPayment;
}

export type TwoDayTaraMoneyLinks = {
  paymentStatus?: string;
  ussdCode?: string;
  vendor?: string;
  orderId: string;
  orderKey?: string;
  status?: string;
  total?: string;
  currency?: string;
  generalLink?: string;
  whatsappLink?: string;
  telegramLink?: string;
  cardLink?: string;
};

export async function wpCreateTaraMoneyPaymentLink(
  input: { orderId: string; orderKey?: string; phoneNumber?: string; network?: string },
  token?: string | null,
) {
  const query = `
    mutation TwoDayCreateTaraMoneyPaymentLink($input: TwoDayCreateTaraMoneyPaymentLinkInput!) {
      twoDayCreateTaraMoneyPaymentLink(input: $input) {
        orderId
        orderKey
        status
        total
        currency
        generalLink
        whatsappLink
        telegramLink
        cardLink
        paymentStatus
        ussdCode
        vendor
      }
    }
  `;

  const data = await wpGraphqlFetch<
    { twoDayCreateTaraMoneyPaymentLink: TwoDayTaraMoneyLinks },
    { input: { orderId: string; orderKey?: string; phoneNumber?: string; network?: string } }
  >(query, { input }, { token });

  return data.twoDayCreateTaraMoneyPaymentLink;
}

export async function wpCancelOrder(
  input: { orderId: string; orderKey?: string },
  token?: string | null,
) {
  const orderId = String(input.orderId || "").trim();
  if (!orderId) {
    throw new Error("OrderId invalide.");
  }

  return wpFetch<{ ok: boolean; order?: unknown }>(
    `/wp-json/2day/v1/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      token,
      body: input.orderKey ? { orderKey: input.orderKey } : {},
    },
  );
}
