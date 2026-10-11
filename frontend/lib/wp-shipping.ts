import { wpFetch } from "./wp-client";

export interface ShippingMethod {
  id: string;
  instance_id: number;
  title: string;
  description: string;
  cost: string;
  tax_status: string;
}

export interface ShippingMethodsResponse {
  methods: ShippingMethod[];
  zone: string;
}

export async function getShippingMethods(city: string, country: string = 'CM', cartItems: Array<{productId: string, quantity: number, variationId?: number}> = []): Promise<ShippingMethodsResponse> {
  try {
    const res = await wpFetch<ShippingMethodsResponse>(`/wp-json/2day/v1/shipping-methods`, {
      method: "POST",
      body: {
        city,
        country,
        cartItems
      }
    });
    return res || { methods: [], zone: '' };
  } catch (error) {
    console.error("Erreur getShippingMethods:", error);
    throw error;
  }
}
