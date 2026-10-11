import { wpFetch } from "@/lib/wp-client";

export type WpUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
};

export type WpAuthSession = {
  token: string;
  user: WpUser;
};

export type WpEmailChallenge = {
  challengeId: string;
  email: string;
  expiresAt?: number;
  debugCode?: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  date: string;
};

export async function wpLogin(input: { email: string; password: string }) {
  return wpFetch<WpAuthSession>("/wp-json/2day/v1/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function wpMe(token: string) {
  return wpFetch<WpUser>("/wp-json/2day/v1/me", {
    method: "GET",
    token,
  });
}

export async function wpUpdateMe(
  token: string,
  patch: Partial<
    Pick<WpUser, "firstName" | "lastName" | "email" | "phone" | "city">
  >,
) {
  return wpFetch<WpUser>("/wp-json/2day/v1/me", {
    method: "PATCH",
    token,
    body: patch,
  });
}

export async function wpRegisterRequest(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return wpFetch<WpEmailChallenge>("/wp-json/2day/v1/auth/register/request", {
    method: "POST",
    body: input,
  });
}

export async function wpRegisterVerify(input: {
  challengeId: string;
  code: string;
}) {
  return wpFetch<WpAuthSession>("/wp-json/2day/v1/auth/register/verify", {
    method: "POST",
    body: input,
  });
}

export async function wpPasswordResetRequest(input: { email: string }) {
  return wpFetch<WpEmailChallenge>("/wp-json/2day/v1/auth/password/request", {
    method: "POST",
    body: input,
  });
}

export async function wpPasswordResetConfirm(input: {
  challengeId: string;
  code: string;
  newPassword: string;
}) {
  return wpFetch<{ ok: true }>("/wp-json/2day/v1/auth/password/confirm", {
    method: "POST",
    body: input,
  });
}

export async function getNotifications(token: string) {
  return wpFetch<{ success: boolean; notifications: Notification[] }>("/wp-json/2day/v1/notifications", {
    method: "GET",
    token,
  });
}

export async function markNotificationsAsRead(token: string, id?: string) {
  return wpFetch<{ success: boolean; notifications: Notification[] }>("/wp-json/2day/v1/notifications/read", {
    method: "POST",
    token,
    body: { id },
  });
}
