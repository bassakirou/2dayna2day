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
import { formatPrice, type Product } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { WpApiError } from "@/lib/wp-client";
import { wpFetch } from "@/lib/wp-client";
import {
  wpCreateNegotiationConversation,
  wpGetNegotiationTyping,
  wpListNegotiationMessages,
  wpListNegotiations,
  wpMarkNegotiationOfferAsOrdered,
  wpSetNegotiationTyping,
  type WpNegotiationConversation,
  type WpNegotiationMessage,
  type WpNegotiationOrder,
  type WpNegotiationOffer,
} from "@/lib/wp-negotiations";

export type ChatSender = "user" | "seller";
export type ChatMessageType =
  | "text"
  | "product_suggestions"
  | "offer"
  | "order";

export type ChatProductSummary = {
  id: string;
  slug?: string;
  name: string;
  thumbnail: string;
  price?: number | null;
  currency?: string;
};

export type ChatConversation = {
  unreadCount?: number;
  id: string;
  userId: string;
  title: string;
  productId?: string;
  productSlug?: string;
  previewText?: string;
  previewCreatedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type NegotiatedOffer = {
  id: string;
  conversationId: string;
  userId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productThumbnail: string;
  originalPrice: number;
  negotiatedPrice: number;
  currency: string;
  status: "active" | "ordered";
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: ChatSender;
  type: ChatMessageType;
  text?: string;
  productIds?: string[];
  products?: ChatProductSummary[];
  offerId?: string;
  offer?: NegotiatedOffer;
  orderId?: string;
  order?: {
    id: string;
    number: string;
    total: string;
    currency: string;
    payUrl: string;
    product?: ChatProductSummary;
  };
  createdAt: number;
};

type OpenChatOptions = {
  conversationId?: string;
  productId?: string;
  productSlug?: string;
};

type ChatContextValue = {
  unreadMessagesCount: number;
  markConversationRead: (id: string, lastMessageId: string) => Promise<void>;
  isReady: boolean;
  isOpen: boolean;
  activeConversationId: string | null;
  conversations: ChatConversation[];
  offers: NegotiatedOffer[];
  activeConversation: ChatConversation | null;
  activeMessages: ChatMessage[];
  activeTyping: { userTyping: boolean; sellerTyping: boolean } | null;
  isLoadingActiveMessages: boolean;
  openChat: (options?: OpenChatOptions) => void;
  closeChat: () => void;
  setActiveConversation: (conversationId: string) => void;
  startConversationForProduct: (product: Product) => Promise<string>;
  startGenericConversation: () => Promise<string>;
  addProductToActiveConversation: (product: Product) => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  proposePrice: (amount: number) => Promise<void>;
  getMessagesByConversation: (conversationId: string) => ChatMessage[];
  getOfferById: (offerId: string) => NegotiatedOffer | undefined;
  markOfferAsOrdered: (offerId: string) => Promise<void>;
};

function toMillis(timestamp?: number) {
  return typeof timestamp === "number" && Number.isFinite(timestamp)
    ? timestamp * 1000
    : Date.now();
}

function mapConversation(
  conversation: WpNegotiationConversation,
): ChatConversation {
  return {
    id: String(conversation.id),
    unreadCount: Math.max(0, conversation.unreadCount || 0),
    userId: String(conversation.customer?.id || ""),
    title:
      conversation.title ||
      (conversation.product?.name
        ? `Négociation • ${conversation.product.name}`
        : "Discussion avec le vendeur"),
    productId: conversation.product?.id ? String(conversation.product.id) : undefined,
    productSlug:
      conversation.productSlug ||
      conversation.product?.slug ||
      undefined,
    previewText: conversation.last?.text || "",
    previewCreatedAt: conversation.last?.createdAt
      ? toMillis(conversation.last.createdAt)
      : undefined,
    createdAt: toMillis(conversation.createdAt),
    updatedAt: toMillis(conversation.updatedAt),
  };
}

function mapOffer(offer: WpNegotiationOffer): NegotiatedOffer {
  return {
    id: String(offer.id),
    conversationId: String(offer.conversationId),
    userId: String(offer.userId),
    productId: offer.product?.id
      ? String(offer.product.id)
      : (offer.productSlug || String(offer.productId || "")),
    productSlug: offer.productSlug || offer.product?.slug || "",
    productName: offer.productName || offer.product?.name || "Produit",
    productThumbnail:
      offer.productThumbnail ||
      offer.product?.thumbnail ||
      offer.product?.image ||
      "",
    originalPrice: offer.originalPrice,
    negotiatedPrice: offer.negotiatedPrice,
    currency: offer.currency || "FCFA",
    status: offer.status,
    createdAt: toMillis(offer.createdAt),
  };
}

function mapProductSummary(
  input: NonNullable<WpNegotiationMessage["products"]>[number],
): ChatProductSummary {
  return {
    id: String(input.id || input.slug || ""),
    slug: input.slug || undefined,
    name: input.name || "",
    thumbnail: input.thumbnail || input.image || "",
    price: typeof input.price === "number" ? input.price : null,
    currency: input.currency || undefined,
  };
}

function mapMessage(message: WpNegotiationMessage): ChatMessage {
  const normalizedProducts = (message.products || []).map(mapProductSummary);
  const normalizedOffer = message.offer ? mapOffer(message.offer) : undefined;
  const normalizedOrder: ChatMessage["order"] | undefined = message.order
    ? mapOrder(message.order)
    : undefined;

  return {
    id: String(message.id),
    conversationId: String(message.conversationId),
    sender: message.sender,
    type: message.type,
    text: message.text || "",
    productIds: normalizedProducts.map((item) => item.id),
    products: normalizedProducts,
    offerId: message.offerId ? String(message.offerId) : normalizedOffer?.id,
    offer: normalizedOffer,
    orderId: message.orderId ? String(message.orderId) : undefined,
    order: normalizedOrder,
    createdAt: toMillis(message.createdAt),
  };
}

function mapOrder(
  order: WpNegotiationOrder,
): NonNullable<ChatMessage["order"]> {
  const first = order.items && order.items.length ? order.items[0] : undefined;
  const product = first?.product ? mapProductSummary(first.product) : undefined;
  return {
    id: String(order.id),
    number: String(order.number || ""),
    total: String(order.total || ""),
    currency: String(order.currency || ""),
    payUrl: String(order.payUrl || ""),
    product,
  };
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isReady: authReady, user, token } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [loadingMessagesByConversation, setLoadingMessagesByConversation] =
    useState<Record<string, boolean>>({});
  const [hydratedByConversation, setHydratedByConversation] = useState<
    Record<string, boolean>
  >({});
  const [offersById, setOffersById] = useState<Record<string, NegotiatedOffer>>(
    {},
  );
  const [typingByConversation, setTypingByConversation] = useState<
    Record<string, { userTyping: boolean; sellerTyping: boolean }>
  >({});
  const typingAbortRef = useRef<{ active?: string }>({});

  const handleAuthError = useCallback((err: unknown) => {
    if (
      err instanceof WpApiError &&
      (err.status === 401 || err.status === 403)
    ) {
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { tab: "login" } }),
      );
    }
  }, []);

  const hydrateOffers = useCallback((items: ChatMessage[]) => {
    setOffersById((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (item.offer) {
          next[item.offer.id] = item.offer;
        }
      });
      return next;
    });
  }, []);

  const loadConversations = useCallback(async () => {
    if (!token) {
      setConversations([]);
      return [];
    }

    try {
      const remote = await wpListNegotiations(token);
      const next = remote
        .map(mapConversation)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      setConversations(next);
      return next;
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  }, [handleAuthError, token]);

  const loadConversationMessages = useCallback(
    async (conversationId: string, opts?: { silent?: boolean }) => {
      if (!token) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: [],
        }));
        return [];
      }

      const isFirstHydration = !hydratedByConversation[conversationId];
      const shouldShowLoading = isFirstHydration && !opts?.silent;

      try {
        if (shouldShowLoading) {
          setLoadingMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: true,
          }));
        }
        const remote = await wpListNegotiationMessages(token, conversationId);
        const next = remote
          .map(mapMessage)
          .sort((a, b) => a.createdAt - b.createdAt);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: next,
        }));
        setHydratedByConversation((prev) => ({
          ...prev,
          [conversationId]: true,
        }));
        hydrateOffers(next);
        return next;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        if (shouldShowLoading) {
          setLoadingMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: false,
          }));
        }
      }
    },
    [handleAuthError, hydrateOffers, hydratedByConversation, token],
  );

  useEffect(() => {
    if (!authReady) return;

    if (!user || !token) {
      setConversations([]);
      setMessagesByConversation({});
      setHydratedByConversation({});
      setOffersById({});
      setIsOpen(false);
      setActiveConversationId(null);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    loadConversations()
      .catch(() => {
        if (!cancelled) {
          setConversations([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, loadConversations, token, user]);

  useEffect(() => {
    if (!activeConversationId || !token) return;
    if (messagesByConversation[activeConversationId]) return;
    loadConversationMessages(activeConversationId).catch(() => {});
  }, [
    activeConversationId,
    loadConversationMessages,
    messagesByConversation,
    token,
  ]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) || null,
    [activeConversationId, conversations],
  );

  const activeMessages = useMemo(
    () =>
      activeConversation
        ? messagesByConversation[activeConversation.id] || []
        : [],
    [activeConversation, messagesByConversation],
  );

  const activeTyping = useMemo(() => {
    if (!activeConversation) return null;
    return (
      typingByConversation[activeConversation.id] || {
        userTyping: false,
        sellerTyping: false,
      }
    );
  }, [activeConversation, typingByConversation]);

  const isLoadingActiveMessages = useMemo(() => {
    if (!activeConversation) return false;
    return !!loadingMessagesByConversation[activeConversation.id];
  }, [activeConversation, loadingMessagesByConversation]);

  const openChat = useCallback(
    (options?: OpenChatOptions) => {
      if (!user || !token) {
        window.dispatchEvent(
          new CustomEvent("open-auth-modal", { detail: { tab: "login" } }),
        );
        return;
      }

      setIsOpen(true);

      if (options?.conversationId) {
        const conversationId = String(options.conversationId);
        setActiveConversationId(conversationId);
        loadConversationMessages(conversationId).catch(() => {});
        return;
      }

      if (options?.productId || options?.productSlug) {
        const slug = options.productSlug;
        const id = options.productId;
        void (async () => {
          const existing = conversations.find(
            (conversation) =>
              conversation.userId === user.id &&
              ((slug && conversation.productSlug === slug) ||
                (id && conversation.productId === String(id))),
          );

          if (existing) {
            setActiveConversationId(existing.id);
            await loadConversationMessages(existing.id);
            return;
          }

          const created = await wpCreateNegotiationConversation(token, {
            title: slug ? `Négociation • ${slug}` : "Négociation • Produit",
            productSlug: slug || undefined,
          });
          const conversationId = String(created.id);
          setActiveConversationId(conversationId);
          const { wpSendNegotiationMessage } =
            await import("@/lib/wp-negotiations");
          await wpSendNegotiationMessage(token, conversationId, {
            text: `Bonjour, je souhaite discuter de ce produit.`,
            type: "text",
          });
          await Promise.all([
            loadConversations(),
            loadConversationMessages(conversationId),
          ]);
        })().catch(handleAuthError);
        return;
      }

      void (async () => {
        const existing = conversations.find(
          (conversation) =>
            conversation.userId === user.id && !conversation.productSlug,
        );
        if (existing) {
          setActiveConversationId(existing.id);
          await loadConversationMessages(existing.id);
          return;
        }

        const created = await wpCreateNegotiationConversation(token, {
          title: "Discussion avec le vendeur",
        });
        const conversationId = String(created.id);
        setActiveConversationId(conversationId);
        await Promise.all([
          loadConversations(),
          loadConversationMessages(conversationId),
        ]);
      })().catch(handleAuthError);
    },
    [
      conversations,
      handleAuthError,
      loadConversationMessages,
      loadConversations,
      token,
      user,
    ],
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setActiveConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      void loadConversationMessages(conversationId);
    },
    [loadConversationMessages],
  );

  const createConversation = useCallback(
    async (input?: {
      product?: Product;
      title?: string;
      firstMessage?: string;
    }) => {
      if (!token || !user) return "";

      let result: { id: number };
      try {
        result = await wpCreateNegotiationConversation(token, {
          title: input?.title,
          productSlug: input?.product?.slug,
        });
      } catch (err) {
        handleAuthError(err);
        throw err;
      }

      const conversationId = String(result.id);
      const createdConversation: ChatConversation = {
        id: conversationId,
        userId: user.id,
        title:
          input?.title ||
          (input?.product
            ? `Négociation • ${input.product.name}`
            : "Discussion avec le vendeur"),
        productId: input?.product?.id,
        productSlug: input?.product?.slug,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setConversations((prev) => [
        createdConversation,
        ...prev.filter((item) => item.id !== conversationId),
      ]);
      setActiveConversationId(conversationId);
      setIsOpen(true);

      if (input?.firstMessage) {
        const { wpSendNegotiationMessage } =
          await import("@/lib/wp-negotiations");
        try {
          await wpSendNegotiationMessage(token, conversationId, {
            text: input.firstMessage,
            type: "text",
          });
        } catch (err) {
          handleAuthError(err);
          throw err;
        }
      }

      await Promise.all([
        loadConversations(),
        loadConversationMessages(conversationId),
      ]);
      return conversationId;
    },
    [handleAuthError, loadConversationMessages, loadConversations, token, user],
  );

  const startConversationForProductInternal = useCallback(
    async (product: Product) => {
      if (!user || !token) return "";

      const existing = conversations.find(
        (conversation) =>
          conversation.userId === user.id &&
          conversation.productSlug === product.slug,
      );

      if (existing) {
        setActiveConversationId(existing.id);
        setIsOpen(true);
        await loadConversationMessages(existing.id);
        return existing.id;
      }

      return createConversation({
        product,
        title: `Négociation • ${product.name}`,
        firstMessage: `Bonjour, je souhaite discuter de ${product.name}.`,
      });
    },
    [conversations, createConversation, loadConversationMessages, token, user],
  );

  const startGenericConversationInternal = useCallback(async () => {
    if (!user || !token) return "";

    const existing = conversations.find(
      (conversation) =>
        conversation.userId === user.id && !conversation.productSlug,
    );

    if (existing) {
      setActiveConversationId(existing.id);
      setIsOpen(true);
      await loadConversationMessages(existing.id);
      return existing.id;
    }

    return createConversation({
      title: "Discussion avec le vendeur",
    });
  }, [
    conversations,
    createConversation,
    loadConversationMessages,
    token,
    user,
  ]);

  const startConversationForProduct = useCallback(
    async (product: Product) => startConversationForProductInternal(product),
    [startConversationForProductInternal],
  );

  const startGenericConversation = useCallback(
    async () => startGenericConversationInternal(),
    [startGenericConversationInternal],
  );

  const addProductToActiveConversation = useCallback(
    async (product: Product) => {
      const conversationId = await startConversationForProductInternal(product);
      if (!conversationId) return;

      if (activeConversationId === conversationId) {
        await loadConversationMessages(conversationId);
      }
    },
    [
      activeConversationId,
      loadConversationMessages,
      startConversationForProductInternal,
    ],
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!token || !activeConversation || !text.trim()) return;

      const { wpSendNegotiationMessage } =
        await import("@/lib/wp-negotiations");
      try {
        await wpSendNegotiationMessage(token, activeConversation.id, {
          text: text.trim(),
          type: "text",
        });
      } catch (err) {
        handleAuthError(err);
        throw err;
      }
      await Promise.all([
        loadConversationMessages(activeConversation.id),
        loadConversations(),
      ]);
    },
    [
      activeConversation,
      handleAuthError,
      loadConversationMessages,
      loadConversations,
      token,
    ],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!token || !activeConversationId) return;
      typingAbortRef.current.active = activeConversationId;
      wpSetNegotiationTyping(token, activeConversationId, isTyping).catch(
        () => {},
      );
    },
    [activeConversationId, token],
  );

  const proposePrice = useCallback(
    async (amount: number) => {
      if (!activeConversation || !amount) return;

      const priceLabel = formatPrice(amount);
      const title = activeConversation.title;
      const message = title
        ? `Je propose ${priceLabel} pour ${title}.`
        : `Je propose ${priceLabel}.`;

      await sendTextMessage(message);
    },
    [activeConversation, sendTextMessage],
  );

  const getMessagesByConversation = useCallback(
    (conversationId: string) =>
      (messagesByConversation[conversationId] || [])
        .slice()
        .sort((a, b) => a.createdAt - b.createdAt),
    [messagesByConversation],
  );

  const getOfferById = useCallback(
    (offerId: string) => offersById[offerId],
    [offersById],
  );

  const markOfferAsOrdered = useCallback(
    async (offerId: string) => {
      setOffersById((prev) => {
        const current = prev[offerId];
        if (!current) return prev;
        return {
          ...prev,
          [offerId]: {
            ...current,
            status: "ordered",
          },
        };
      });

      if (!token) return;
      try {
        const updated = await wpMarkNegotiationOfferAsOrdered(token, offerId);
        setOffersById((prev) => ({
          ...prev,
          [offerId]: mapOffer(updated),
        }));
        if (activeConversationId) {
          await loadConversationMessages(activeConversationId);
        }
      } catch {
        // Keep optimistic status for the current session if the sync fails.
      }
    },
    [activeConversationId, loadConversationMessages, token],
  );

  useEffect(() => {
    if (!token) return;

    const id = window.setInterval(() => {
      loadConversations().catch(() => {});
      if (activeConversationId) {
        loadConversationMessages(activeConversationId, { silent: true }).catch(
          () => {},
        );
      }
    }, activeConversationId || isOpen ? 2000 : 10000);

    return () => window.clearInterval(id);
  }, [
    activeConversationId,
    isOpen,
    loadConversationMessages,
    loadConversations,
    token,
  ]);

  useEffect(() => {
    if (!token) return;
    if (!activeConversationId || !isOpen) return;

    const id = window.setInterval(() => {
      const conversationId = activeConversationId;
      wpGetNegotiationTyping(token, conversationId)
        .then((res) => {
          if (typingAbortRef.current.active !== conversationId) return;
          setTypingByConversation((prev) => ({
            ...prev,
            [conversationId]: {
              userTyping: !!res.userTyping,
              sellerTyping: !!res.sellerTyping,
            },
          }));
        })
        .catch(() => {});
    }, 1000);

    return () => window.clearInterval(id);
  }, [activeConversationId, isOpen, token]);

  const readRequests = useRef(new Map<string, string>());
  const markConversationRead = useCallback(async (id: string, lastMessageId: string) => {
    if (!token || !lastMessageId) return;
    const key = `${token}:${id}`;
    if (readRequests.current.get(key) === lastMessageId) return;
    readRequests.current.set(key, lastMessageId);
    try {
      const result = await wpFetch<{unreadCount: number}>(`/wp-json/2day/v1/negotiations/${encodeURIComponent(id)}/read`, {method: 'POST', token, body: {lastMessageId}});
      setConversations(previous => previous.map(conversation => conversation.id === id ? {...conversation, unreadCount: result.unreadCount} : conversation));
    } catch {
      readRequests.current.delete(key);
    }
  }, [token]);
  const value: ChatContextValue = {
    unreadMessagesCount: conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0),
    markConversationRead,
    isReady,
    isOpen,
    activeConversationId,
    conversations,
    offers: Object.values(offersById).sort((a, b) => b.createdAt - a.createdAt),
    activeConversation,
    activeMessages,
    activeTyping,
    isLoadingActiveMessages,
    openChat,
    closeChat,
    setActiveConversation,
    startConversationForProduct,
    startGenericConversation,
    addProductToActiveConversation,
    sendTextMessage,
    setTyping,
    proposePrice,
    getMessagesByConversation,
    getOfferById,
    markOfferAsOrdered,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat doit être utilisé dans un ChatProvider");
  }
  return context;
}
