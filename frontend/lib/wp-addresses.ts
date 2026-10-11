import { wpFetch } from "./wp-client";

export interface Address {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  type?: string;
  isDefault?: boolean;
}

export async function getAddresses(token: string): Promise<Address[]> {
  try {
    const res = await wpFetch<{ addresses: Address[] }>("/wp-json/2day/v1/user/addresses", {
      token,
      method: "GET",
    });
    return res.addresses || [];
  } catch (error) {
    console.error("Erreur getAddresses:", error);
    throw error;
  }
}

export async function saveAddress(token: string, addressData: Partial<Address>): Promise<Address[]> {
  try {
    const res = await wpFetch<{ addresses: Address[] }>("/wp-json/2day/v1/user/addresses", {
      token,
      method: "POST",
      body: addressData,
    });
    return res.addresses || [];
  } catch (error) {
    console.error("Erreur saveAddress:", error);
    throw error;
  }
}

export async function deleteAddress(token: string, addressId: string): Promise<Address[]> {
  try {
    const res = await wpFetch<{ addresses: Address[] }>(`/wp-json/2day/v1/user/addresses/${encodeURIComponent(addressId)}`, {
      token,
      method: "DELETE",
    });
    return res.addresses || [];
  } catch (error) {
    console.error("Erreur deleteAddress:", error);
    throw error;
  }
}
