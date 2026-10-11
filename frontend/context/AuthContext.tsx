"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  wpLogin,
  wpMe,
  wpPasswordResetConfirm,
  wpPasswordResetRequest,
  wpRegisterVerify,
  wpUpdateMe,
  getNotifications,
  markNotificationsAsRead,
  Notification,
  wpRegisterRequest,
} from "@/lib/wp-auth";
import { wpListMyOrders } from "@/lib/wp-account-orders";
import toast from "react-hot-toast";

export type AuthNotice = {
  email: string;
  createdAt: number;
  kind: "register_code" | "register_done" | "reset_code" | "reset_done";
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
};

export type User = {
  id: string;
  profile: UserProfile;
};

export type OrderStatus = string;
export type OrderTracking = {
  statusLabel: string;
  description?: string;
  kind: "active" | "completed" | "stopped" | "hidden";
  currentIndex: number | null;
  nextStep: { id: string; label: string; description?: string } | null;
  steps: { id: string; label: string; description?: string; date: number | null; state: "current" | "visited" | "upcoming" | "unrecorded" }[];
};

export type Order = {
  items?: { id: string; name: string; quantity: number; total: number; thumbnail: string }[];
  history?: { status: string; label?: string; date: number }[];
  tracking?: OrderTracking;
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  productName: string;
  productThumbnail: string;
  amount: number;
  currency: string;
  city: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  paymentPlan?: "full" | "split";
  discountAmount?: number;
  partialPaymentPercent?: number;
  balanceRemaining?: number;
  datePaid?: number | null;
  address?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  notice: AuthNotice | null;
};

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  user: User | null;
  notice: AuthNotice | null;
  dismissNotice: () => void;

  requestRegistrationCode: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<{
    challengeId: string;
    email: string;
    expiresAt?: number;
    debugCode?: string;
  }>;
  confirmRegistrationCode: (input: {
    challengeId: string;
    code: string;
  }) => Promise<User>;

  requestPasswordResetCode: (email: string) => Promise<{
    challengeId: string;
    email: string;
    expiresAt?: number;
    debugCode?: string;
  }>;
  confirmPasswordResetCode: (input: {
    challengeId: string;
    code: string;
    newPassword: string;
  }) => Promise<void>;

  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;

  favorites: string[];
  toggleFavorite: (productId: string) => void;

  orders: Order[];
  refreshOrders: () => Promise<void>;

  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: string;
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id?: string) => Promise<void>;
};

const STORAGE_KEYS = {
  auth: "2day_auth_v2",
  favoritesByUser: "2day_favorites_by_user_v1",
} as const;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "commande_recue":
      return "Commande reçue";
    case "confirmation":
      return "Confirmation";
    case "preparation":
      return "Préparation";
    case "expedition":
      return "Expédition";
    case "en_livraison":
      return "En livraison";
    case "livree":
      return "Livrée";
    default:
      return "Commande";
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    user: null,
    notice: null,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsToken, setNotificationsToken] = useState<string | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState('');
  const currentTokenRef = useRef(auth.token);
  currentTokenRef.current = auth.token;
  const notificationRequestRef = useRef(0);
  const orderRequestRef = useRef(0);

  // Refs pour timer de notifications
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [favoritesByUser, setFavoritesByUser] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    const loadedAuth = safeJsonParse<AuthState>(
      localStorage.getItem(STORAGE_KEYS.auth),
      {
        token: null,
        user: null,
        notice: null,
      },
    );
    const loadedFavorites = safeJsonParse<Record<string, string[]>>(
      localStorage.getItem(STORAGE_KEYS.favoritesByUser),
      {},
    );
    setAuth(loadedAuth);
    setFavoritesByUser(loadedFavorites);
    setOrders([]);
    setIsReady(true);

    localStorage.removeItem("2day_orders_v1");
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveJson(STORAGE_KEYS.auth, auth);
  }, [isReady, auth]);

  useEffect(() => {
    if (!isReady) return;
    saveJson(STORAGE_KEYS.favoritesByUser, favoritesByUser);
  }, [isReady, favoritesByUser]);

  const user = auth.user;
  const favorites = useMemo(
    () => (user ? favoritesByUser[user.id] || [] : []),
    [favoritesByUser, user],
  );

  const dismissNotice = useCallback(() => {
    setAuth((prev) => ({ ...prev, notice: null }));
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!auth.token) return;

    let isActive = true;
    wpMe(auth.token)
      .then((me) => {
        if (!isActive) return;
        setAuth((prev) => ({
          ...prev,
          user: {
            id: me.id,
            profile: {
              firstName: me.firstName || "",
              lastName: me.lastName || "",
              email: normalizeEmail(me.email || ""),
              phone: me.phone || "",
              city: me.city || "",
            },
          },
        }));
      })
      .catch(() => {
        if (!isActive) return;
        setAuth((prev) => ({ ...prev, token: null, user: null }));
      });

    return () => {
      isActive = false;
    };
  }, [isReady, auth.token]);

  const refreshOrders = useCallback(async () => {
    if (!auth.token || !user) {
      setOrders([]);
      return;
    }

    const request = ++orderRequestRef.current;
    const remote = await wpListMyOrders(auth.token);
    if (currentTokenRef.current === auth.token && request === orderRequestRef.current) setOrders(remote);
  }, [auth.token, user]);

  const refreshNotifications = useCallback(async () => {
    if (!auth.token) return;
    const token = auth.token;
    const request = ++notificationRequestRef.current;
    try {
      const res = await getNotifications(token);
      if (currentTokenRef.current !== token || request !== notificationRequestRef.current) return;
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setNotificationsToken(token);
        setNotificationsError('');
      } else throw new Error('Réponse de notifications invalide.');
    } catch (err) {
      if (currentTokenRef.current === token && request === notificationRequestRef.current) setNotificationsError('Impossible de charger vos messages. Réessayez.');
    } finally {
      if (currentTokenRef.current === token && request === notificationRequestRef.current) setNotificationsLoading(false);
    }
  }, [auth.token]);

  const markNotificationAsRead = useCallback(async (id?: string) => {
    if (!auth.token) return;
    const token = auth.token;
    const res = await markNotificationsAsRead(token, id);
    if (currentTokenRef.current !== token) return;
    if (!res.success || !Array.isArray(res.notifications)) throw new Error('Impossible de mettre à jour la lecture des messages.');
    ++notificationRequestRef.current;
    setNotifications(res.notifications);
    setNotificationsToken(token);
    setNotificationsLoading(false);
  }, [auth.token]);

  useEffect(() => {
    setNotifications([]); setNotificationsToken(null);
    setNotificationsLoading(!!auth.token); setNotificationsError('');
  }, [auth.token]);

  useEffect(() => {
    if (!isReady) return;
    if (user && auth.token) {
      void refreshOrders().catch(() => {});
      refreshNotifications();

      notifTimerRef.current = setInterval(() => {
        refreshNotifications();
      }, 60000);
    } else {
      setOrders([]);
      setNotifications([]);
      if (notifTimerRef.current) clearInterval(notifTimerRef.current);
    }
    
    return () => {
      if (notifTimerRef.current) clearInterval(notifTimerRef.current);
    };
  }, [user, auth.token, isReady, refreshOrders, refreshNotifications]);

  const requestRegistrationCode = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const challenge = await wpRegisterRequest({
        ...input,
        email: normalizeEmail(input.email),
      });
      setAuth((prev) => ({
        ...prev,
        notice: { email: challenge.email, createdAt: Date.now(), kind: "register_code" },
      }));
      return challenge;
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await wpLogin({ email: normalizeEmail(email), password });
      const nextUser: User = {
        id: session.user.id,
        profile: {
          firstName: session.user.firstName || "",
          lastName: session.user.lastName || "",
          email: normalizeEmail(session.user.email || ""),
          phone: session.user.phone || "",
          city: session.user.city || "",
        },
      };
      setAuth((prev) => ({ ...prev, token: session.token, user: nextUser }));
      return nextUser;
    },
    [],
  );

  const logout = useCallback(() => {
    setAuth((prev) => ({ ...prev, token: null, user: null }));
  }, []);

  const confirmRegistrationCode = useCallback(
    async (input: { challengeId: string; code: string }) => {
      const session = await wpRegisterVerify(input);
      const nextUser: User = {
        id: session.user.id,
        profile: {
          firstName: session.user.firstName || "",
          lastName: session.user.lastName || "",
          email: normalizeEmail(session.user.email || ""),
          phone: session.user.phone || "",
          city: session.user.city || "",
        },
      };
      setAuth((prev) => ({
        ...prev,
        token: session.token,
        user: nextUser,
        notice: { email: nextUser.profile.email, createdAt: Date.now(), kind: "register_done" },
      }));
      return nextUser;
    },
    [],
  );

  const requestPasswordResetCode = useCallback(async (email: string) => {
    const challenge = await wpPasswordResetRequest({
      email: normalizeEmail(email),
    });
    setAuth((prev) => ({
      ...prev,
      notice: { email: challenge.email, createdAt: Date.now(), kind: "reset_code" },
    }));
    return challenge;
  }, []);

  const confirmPasswordResetCode = useCallback(
    async (input: { challengeId: string; code: string; newPassword: string }) => {
      await wpPasswordResetConfirm(input);
      setAuth((prev) => ({
        ...prev,
        notice: { email: prev.notice?.email || "", createdAt: Date.now(), kind: "reset_done" },
      }));
    },
    [],
  );

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      if (!auth.token || !user) return;
      const nextPatch: Partial<UserProfile> = {
        ...patch,
        email: patch.email ? normalizeEmail(patch.email) : undefined,
      };

      wpUpdateMe(auth.token, {
        firstName: nextPatch.firstName,
        lastName: nextPatch.lastName,
        email: nextPatch.email,
        phone: nextPatch.phone,
        city: nextPatch.city,
      })
        .then((updated) => {
          setAuth((prev) => ({
            ...prev,
            user: {
              id: updated.id,
              profile: {
                firstName: updated.firstName || "",
                lastName: updated.lastName || "",
                email: normalizeEmail(updated.email || ""),
                phone: updated.phone || "",
                city: updated.city || "",
              },
            },
          }));
        })
        .catch(() => {});
    },
    [auth.token, user],
  );

  const toggleFavorite = useCallback(
    (productId: string) => {
      if (!user) return;
      if (!favorites.includes(productId)) toast.success("Ajouté aux favoris !");
      setFavoritesByUser((prev) => {
        const current = prev[user.id] || [];
        const isCurrentlyFavorite = current.includes(productId);
        const next = isCurrentlyFavorite
          ? current.filter((id) => id !== productId)
          : [...current, productId];

        return { ...prev, [user.id]: next };
      });
    },
    [user, favorites],
  );

  const value: AuthContextValue = {
    isReady,
    token: auth.token,
    user,
    notice: auth.notice,
    dismissNotice,

    login,
    requestRegistrationCode,
    confirmRegistrationCode,
    requestPasswordResetCode,
    confirmPasswordResetCode,
    logout,
    updateProfile,

    favorites,
    toggleFavorite,

    orders,
    refreshOrders,

    notifications: notificationsToken === auth.token ? notifications : [],
    notificationsLoading,
    notificationsError,
    unreadNotificationsCount: notificationsToken === auth.token ? notifications.filter(n => !n.read).length : 0,
    refreshNotifications,
    markNotificationAsRead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}

export function getOrderStatusSteps(): Array<{
  status: OrderStatus;
  label: string;
}> {
  const statuses: OrderStatus[] = [
    "commande_recue",
    "confirmation",
    "preparation",
    "expedition",
    "en_livraison",
    "livree",
  ];
  return statuses.map((s) => ({ status: s, label: getOrderStatusLabel(s) }));
}
