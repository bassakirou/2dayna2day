"use client";

import Image from "next/image";
import { Link } from "@/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  MessageCircle,
  Minimize2,
  Plus,
  Search,
  Send,
  Tag,
  X,
} from "lucide-react";
import { formatPrice, type Product } from "@/lib/data";
import { getProducts } from "@/lib/wp-products";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useRouter } from "next/navigation";

interface NegotiationChatPanelProps {
  onClose?: () => void;
  onExpand?: () => void;
  onReduce?: () => void;
  embedded?: boolean;
  variant?: "compact" | "expanded";
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getRelativeDayLabel(timestamp: number) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const targetStart = new Date(
    new Date(timestamp).setHours(0, 0, 0, 0),
  ).getTime();
  const diffDays = Math.round(
    (todayStart - targetStart) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "Aujourd’hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} j`;
}

export default function NegotiationChatPanel({
  onClose,
  onExpand,
  onReduce,
  embedded = false,
  variant,
}: NegotiationChatPanelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    activeMessages,
    activeTyping,
    isLoadingActiveMessages,
    setActiveConversation,
    addProductToActiveConversation,
    sendTextMessage,
    setTyping,
    proposePrice,
    startGenericConversation,
    getMessagesByConversation,
    getOfferById,
    markConversationRead,
  } = useChat();
  const [text, setText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [compactView, setCompactView] = useState<"list" | "conversation">(
    "list",
  );
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const productPickerRef = useRef<HTMLDivElement | null>(null);

  const resolvedVariant: "compact" | "expanded" = useMemo(() => {
    if (variant) return variant;
    return embedded ? "expanded" : "compact";
  }, [embedded, variant]);

  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    getProducts()
      .then((data) => {
        if (mounted) setProductsList(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const isCompact = resolvedVariant === "compact";
  const lastVisibleMessageId = activeMessages[activeMessages.length - 1]?.id;
  useEffect(() => {
    if (!activeConversation || !lastVisibleMessageId || isLoadingActiveMessages || (isCompact && compactView === "list")) return;
    const mark = () => { if (document.visibilityState === "visible") void markConversationRead(activeConversation.id, lastVisibleMessageId); };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [activeConversation, lastVisibleMessageId, isLoadingActiveMessages, isCompact, compactView, markConversationRead]);

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    const base = query
      ? productsList.filter((product) =>
          product.name.toLowerCase().includes(query),
        )
      : productsList;
    return base.slice(0, 8);
  }, [productQuery, productsList]);

  useEffect(() => {
    if (resolvedVariant !== "expanded") return;
    if (!activeConversation && conversations[0]) {
      setActiveConversation(conversations[0].id);
    }
  }, [
    activeConversation,
    conversations,
    resolvedVariant,
    setActiveConversation,
  ]);

  useEffect(() => {
    if (!isCompact) return;
    if (activeConversation) {
      setCompactView("conversation");
    } else {
      setCompactView("list");
    }
  }, [activeConversation, isCompact]);

  useEffect(() => {
    if (!isProductPickerOpen) return;

    const handler = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (productPickerRef.current && productPickerRef.current.contains(target))
        return;
      setIsProductPickerOpen(false);
    };

    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [isProductPickerOpen]);

  const conversationPreviews = useMemo(
    () =>
      conversations.map((conversation) => {
        const lastMessage = getMessagesByConversation(conversation.id).slice(
          -1,
        )[0];
        return {
          ...conversation,
          preview:
            lastMessage?.type === "text"
              ? lastMessage.text
              : lastMessage?.type === "offer"
                ? "Offre privée envoyée"
                : lastMessage?.type === "order"
                  ? "Nouvelle commande"
                  : lastMessage?.type === "product_suggestions"
                    ? "Suggestions de produits"
                    : conversation.previewText || "",
          previewTime: lastMessage?.createdAt
            ? formatTime(lastMessage.createdAt)
            : conversation.previewCreatedAt
              ? formatTime(conversation.previewCreatedAt)
              : "",
        };
      }),
    [conversations, getMessagesByConversation],
  );

  const activeProduct = activeConversation?.productId || activeConversation?.productSlug
    ? productsList.find(
        (product) =>
          product.id === activeConversation.productId ||
          product.slug === activeConversation.productSlug,
      )
    : undefined;

  const typingTimerRef = useRef<number | null>(null);
  const typingOffTimerRef = useRef<number | null>(null);

  const reportTyping = (value: string) => {
    const shouldType = value.trim().length > 0;

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingOffTimerRef.current) {
      window.clearTimeout(typingOffTimerRef.current);
      typingOffTimerRef.current = null;
    }

    if (!shouldType) {
      setTyping(false);
      return;
    }

    typingTimerRef.current = window.setTimeout(() => {
      setTyping(true);
    }, 120);

    typingOffTimerRef.current = window.setTimeout(() => {
      setTyping(false);
    }, 1200);
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-body mb-2">
          Connectez-vous pour discuter
        </h3>
        <p className="text-sm text-gray-600 mb-5">
          Ouvrez le modal de connexion pour négocier les prix et échanger avec
          le vendeur.
        </p>
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("open-auth-modal", { detail: { tab: "login" } }),
            )
          }
          className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const handleSend = () => {
    if (!text.trim()) return;
    setSendError(null);
    setIsSending(true);
    setPendingText(text.trim());
    void (async () => {
      try {
        setTyping(false);
        await sendTextMessage(text);
      } catch (err) {
        setSendError(
          err instanceof Error
            ? err.message
            : "Impossible d’envoyer le message.",
        );
      } finally {
        setIsSending(false);
        setPendingText(null);
      }
    })();
    setText("");
  };

  const handlePriceProposal = () => {
    const numericValue = Number(priceInput.replace(/[^\d]/g, ""));
    if (!numericValue) return;
    void proposePrice(numericValue);
    setPriceInput("");
  };

  const openOrderCheckout = (order: {
    id: string;
    number: string;
    total: string;
    currency: string;
  }) => {
    const params = new URLSearchParams();
    params.set("orderId", order.id);
    if (order.number) params.set("orderNumber", order.number);
    if (order.total) params.set("amount", order.total);
    if (order.currency) params.set("currency", order.currency);
    router.push(`/checkout?${params.toString()}`);
    onClose?.();
  };

  return (
    <div className={`flex flex-col ${embedded ? "min-h-[70vh]" : "h-full"}`}>
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b bg-white">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-body leading-tight">
            Négociation & chat vendeur
          </h2>
          <p className="text-sm text-gray-600 leading-snug">
            Discutez des prix, posez vos questions et recevez des offres
            privées.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {resolvedVariant === "compact" && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
              aria-label="Agrandir"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
          {resolvedVariant === "expanded" && onReduce && (
            <button
              type="button"
              onClick={onReduce}
              className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
              aria-label="Réduire"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {resolvedVariant === "expanded" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] flex-1 min-h-0">
          <aside className="border-b lg:border-b-0 lg:border-r bg-neutral-light/60">
            <div className="p-4">
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const conversationId = await startGenericConversation();
                    if (conversationId) setActiveConversation(conversationId);
                  })();
                }}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Nouvelle conversation
              </button>
            </div>
            <div className="px-3 pb-3 space-y-2 max-h-[240px] lg:max-h-none overflow-auto">
              {conversationPreviews.map((conversation) => {
                const active = activeConversation?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversation(conversation.id)}
                    className={`w-full text-left rounded-2xl p-4 border transition-colors ${
                      active
                        ? "bg-white border-primary"
                        : "bg-white/80 border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-body line-clamp-1">
                        {conversation.title}
                      </p>
                      <span className="text-xs text-gray-400">
                        {conversation.previewTime}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {conversation.preview}
                      {!!conversation.unreadCount && <span aria-label={`${conversation.unreadCount} messages non lus`} className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-accent-red px-1 text-xs font-semibold text-white">{conversation.unreadCount}</span>}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex flex-col min-h-0">
            {activeConversation ? (
              <>
                <div className="px-5 py-4 border-b bg-white">
                  <p className="font-semibold text-body">
                    {activeConversation.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activeProduct
                      ? `Produit concerné: ${activeProduct.name}`
                      : "Discussion générale avec le vendeur"}
                  </p>
                </div>

                <div
                  className="flex-1 overflow-auto p-5 space-y-4 bg-white"
                  style={{ overscrollBehavior: "contain" }}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {isLoadingActiveMessages ? (
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                        >
                          <div className="w-[68%] max-w-[520px] rounded-2xl px-4 py-3 bg-neutral-light border border-gray-100 animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/3 mt-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    activeMessages.map((message) => {
                      if (message.type === "text") {
                        return (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                message.sender === "user"
                                  ? "bg-primary text-white"
                                  : "bg-neutral-light text-body border border-gray-100"
                              }`}
                            >
                              {message.text}
                            </div>
                          </div>
                        );
                      }

                      if (message.type === "product_suggestions") {
                        const suggestedProducts =
                          message.products && message.products.length > 0
                            ? message.products
                            : [];

                        return (
                          <div key={message.id} className="space-y-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Suggestions du vendeur
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {suggestedProducts.map((product) => {
                                if (!product) return null;
                                return (
                                  <Link
                                    key={product.id}
                                    href={
                                      "slug" in product && product.slug
                                        ? `/boutique/${product.slug}`
                                        : "#"
                                    }
                                    className="rounded-2xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow"
                                  >
                                    <div className="relative aspect-[4/3] bg-gray-50">
                                      {product.thumbnail ? (
                                        <Image
                                          src={product.thumbnail}
                                          alt={product.name}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 640px) 100vw, 220px"
                                        />
                                      ) : null}
                                    </div>
                                    <div className="p-3">
                                      <p className="font-semibold text-body line-clamp-2">
                                        {product.name}
                                      </p>
                                      {"price" in product &&
                                      typeof product.price === "number" ? (
                                        <p className="text-primary font-bold mt-1">
                                          {formatPrice(product.price)}
                                        </p>
                                      ) : null}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (message.type === "order") {
                        const order = message.order;
                        if (!order) return null;
                        const product = order.product;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className="max-w-[85%] rounded-2xl border border-gray-100 bg-white p-4">
                              <p className="font-bold text-body">
                                Nouvelle commande
                              </p>
                              <button
                                type="button"
                                onClick={() => openOrderCheckout(order)}
                                className="mt-3 block w-full text-left"
                              >
                                <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-neutral-light hover:bg-white transition-colors">
                                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                    {product?.thumbnail ? (
                                      <Image
                                        src={product.thumbnail}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                      />
                                    ) : null}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-body line-clamp-1">
                                      {product?.name || "Produit"}
                                    </p>
                                    <p className="text-sm font-bold text-primary">
                                      {order.total} {order.currency}
                                    </p>
                                  </div>
                                </div>
                              </button>
                              <p className="text-sm text-gray-600 mt-3">
                                Commande : #{order.number || order.id}
                              </p>
                              <p className="text-sm font-semibold text-primary mt-1">
                                Cliquez pour payer
                              </p>
                            </div>
                          </div>
                        );
                      }

                      const offer =
                        message.offer ||
                        (message.offerId
                          ? getOfferById(message.offerId)
                          : undefined);
                      if (!offer) return null;

                      return (
                        <div
                          key={message.id}
                          className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white flex-shrink-0">
                              {offer.productThumbnail ? (
                                <Image
                                  src={offer.productThumbnail}
                                  alt={offer.productName}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-body">
                                  {offer.productName}
                                </p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    offer.status === "ordered"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-white text-primary border border-primary/20"
                                  }`}
                                >
                                  {offer.status === "ordered"
                                    ? "Commandée"
                                    : "Offre privée"}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(offer.originalPrice)}
                                </span>
                                <span className="text-xl font-bold text-primary">
                                  {formatPrice(offer.negotiatedPrice)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                Ce prix est réservé à votre conversation
                                actuelle.
                              </p>
                              <Link
                                href={`/checkout/offre?offer=${offer.id}`}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                              >
                                <Tag className="w-4 h-4" />
                                Commander à ce prix
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {activeTyping?.sellerTyping &&
                  !isLoadingActiveMessages &&
                  !pendingText &&
                  !isSending ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] w-[72%] rounded-2xl px-4 py-3 bg-white border border-gray-100">
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/3 mt-2 animate-pulse" />
                      </div>
                    </div>
                  ) : null}

                  {pendingText ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-primary text-white">
                        <p className="leading-relaxed">{pendingText}</p>
                        <p className="text-xs text-white/80 mt-2">Envoi…</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  ref={productPickerRef}
                  className="border-t bg-white p-0 relative"
                >
                  {sendError ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                      {sendError}
                    </div>
                  ) : null}
                  {activeTyping?.sellerTyping ? (
                    <div className="px-4 pt-3 text-xs text-gray-600">
                      Le vendeur est en train d’écrire…
                    </div>
                  ) : null}
                  {isProductPickerOpen && (
                    <div className="absolute left-4 right-4 bottom-[92px] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                      <div className="p-3 border-b">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-light">
                          <Search className="w-4 h-4 text-gray-500" />
                          <input
                            value={productQuery}
                            onChange={(e) => setProductQuery(e.target.value)}
                            placeholder="Rechercher un produit…"
                            className="w-full bg-transparent outline-none text-sm text-body"
                          />
                        </div>
                      </div>
                      <div className="max-h-72 overflow-auto">
                        {filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              void addProductToActiveConversation(product);
                              setIsProductPickerOpen(false);
                              setProductQuery("");
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-neutral-light transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-body line-clamp-1">
                                {product.name}
                              </p>
                              <p className="text-sm font-bold text-primary whitespace-nowrap">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Ajouter à la négociation
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeProduct && (
                    <div className="rounded-2xl border border-gray-100 bg-neutral-light p-2">
                      <p className="text-sm font-medium text-body mb-2">
                        Proposer votre prix
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          min={0}
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          placeholder={`Ex: ${activeProduct.price - 25000}`}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={handlePriceProposal}
                          className="px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                        >
                          Envoyer mon prix
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setIsProductPickerOpen((prev) => !prev)}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-neutral-light transition-colors"
                      aria-label="Ajouter un produit"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <textarea
                      value={text}
                      onChange={(e) => {
                        const value = e.target.value;
                        setText(value);
                        reportTyping(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={2}
                      placeholder="Écrivez votre message au vendeur…"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!text.trim() || isSending}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                      aria-label="Envoyer"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="text-center max-w-sm">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-body mb-2">
                    Aucune conversation active
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">
                    Lancez une discussion avec le vendeur pour parler d’un
                    produit ou négocier un prix.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const conversationId = await startGenericConversation();
                        if (conversationId)
                          setActiveConversation(conversationId);
                      })();
                    }}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    Démarrer un chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-white">
          {compactView === "list" ? (
            <div className="flex flex-col h-full">
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const conversationId = await startGenericConversation();
                      if (conversationId) {
                        setActiveConversation(conversationId);
                        setCompactView("conversation");
                      }
                    })();
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-3 rounded-full bg-black text-white font-semibold hover:bg-black/90 transition-colors"
                >
                  Nouvelle conversation
                </button>
              </div>

              <div className="flex-1 overflow-auto border-t">
                {conversationPreviews.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-600">
                      Aucune conversation pour le moment. Lancez une nouvelle
                      discussion pour négocier.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversationPreviews.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setActiveConversation(conversation.id);
                          setCompactView("conversation");
                        }}
                        className="w-full text-left px-4 py-4 hover:bg-neutral-light transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-semibold text-body line-clamp-2">
                            {conversation.preview || conversation.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5">
                            {conversation.previewTime}
                            {!!conversation.unreadCount && <span aria-label={`${conversation.unreadCount} messages non lus`} className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-accent-red px-1 text-xs font-semibold text-white">{conversation.unreadCount}</span>}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCompactView("list")}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-light transition-colors"
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-body line-clamp-1">
                    {activeConversation?.title || "Conversation"}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {activeProduct
                      ? `Produit: ${activeProduct.name}`
                      : "Discussion générale avec le vendeur"}
                  </p>
                </div>
              </div>

              <div
                className="flex-1 overflow-auto bg-gray-100 p-4 space-y-3"
                style={{ overscrollBehavior: "contain" }}
                onWheel={(e) => e.stopPropagation()}
              >
                {isLoadingActiveMessages ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                      >
                        <div className="w-[72%] max-w-[360px] rounded-2xl px-4 py-3 bg-white border border-gray-100 animate-pulse">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                          <div className="h-3 bg-gray-200 rounded w-1/3 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeMessages.length === 0 ? (
                  <p className="text-sm text-gray-600">Aucun message.</p>
                ) : (
                  (() => {
                    let lastDayKey = "";
                    return activeMessages.map((message) => {
                      const dayKey = getDayKey(message.createdAt);
                      const showDay = dayKey !== lastDayKey;
                      lastDayKey = dayKey;

                      const content =
                        message.type === "text" ? (
                          <div
                            className={`flex ${message.sender === "user" ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                                message.sender === "user"
                                  ? "bg-rose-200/70 text-body"
                                  : "bg-white text-body border border-gray-100"
                              }`}
                            >
                              <p className="leading-relaxed">{message.text}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ) : message.type === "offer" ? (
                          (() => {
                            const offer =
                              message.offer ||
                              (message.offerId
                                ? getOfferById(message.offerId)
                                : undefined);
                            if (!offer) return null;
                            return (
                              <div className="rounded-2xl border border-primary/20 bg-white p-4">
                                <div className="flex items-start gap-3">
                                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                    {offer.productThumbnail ? (
                                      <Image
                                        src={offer.productThumbnail}
                                        alt={offer.productName}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    ) : null}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm font-semibold text-body line-clamp-2">
                                        {offer.productName}
                                      </p>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                          offer.status === "ordered"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-primary/10 text-primary"
                                        }`}
                                      >
                                        {offer.status === "ordered"
                                          ? "Commandée"
                                          : "Offre"}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="text-xs text-gray-400 line-through">
                                        {formatPrice(offer.originalPrice)}
                                      </span>
                                      <span className="text-lg font-bold text-primary">
                                        {formatPrice(offer.negotiatedPrice)}
                                      </span>
                                    </div>
                                    <Link
                                      href={`/checkout/offre?offer=${offer.id}`}
                                      className="mt-3 inline-flex items-center justify-center w-full px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                      Commander à ce prix
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : message.type === "order" ? (
                          (() => {
                            const order = message.order;
                            if (!order) return null;
                            const product = order.product;

                            const card = (
                              <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white">
                                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                  {product?.thumbnail ? (
                                    <Image
                                      src={product.thumbnail}
                                      alt={product.name}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-body line-clamp-1">
                                    {product?.name || "Produit"}
                                  </p>
                                  <p className="text-sm font-bold text-primary">
                                    {order.total} {order.currency}
                                  </p>
                                </div>
                              </div>
                            );

                            return (
                              <div
                                className={`flex ${message.sender === "user" ? "justify-start" : "justify-end"}`}
                              >
                                <div className="max-w-[88%] rounded-2xl px-4 py-4 text-sm bg-white text-body border border-gray-100">
                                  <p className="font-bold text-body">
                                    Nouvelle commande
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => openOrderCheckout(order)}
                                    className="block w-full text-left mt-3"
                                  >
                                    {card}
                                  </button>
                                  <p className="text-xs text-gray-600 mt-3">
                                    Commande : #{order.number || order.id}
                                  </p>
                                  <p className="text-xs font-semibold text-primary mt-1">
                                    Cliquez pour payer
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()
                        ) : message.type === "product_suggestions" ? (
                          <div className="rounded-2xl border border-gray-100 bg-white p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Suggestions du vendeur
                            </p>
                            <div className="mt-3 space-y-2">
                              {(message.products && message.products.length > 0
                                ? message.products
                                : []
                              ).map((product) => {
                                if (!product) return null;
                                return (
                                  <Link
                                    key={product.id}
                                    href={
                                      "slug" in product && product.slug
                                        ? `/boutique/${product.slug}`
                                        : "#"
                                    }
                                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-gray-100 hover:bg-neutral-light transition-colors"
                                  >
                                    <span className="text-sm font-medium text-body line-clamp-1">
                                      {product.name}
                                    </span>
                                    {"price" in product &&
                                    typeof product.price === "number" ? (
                                      <span className="text-sm font-bold text-primary whitespace-nowrap">
                                        {formatPrice(product.price)}
                                      </span>
                                    ) : null}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ) : null;

                      return (
                        <div key={message.id} className="space-y-3">
                          {showDay && (
                            <div className="flex items-center gap-3 py-2">
                              <div className="h-px bg-gray-200 flex-1" />
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {getRelativeDayLabel(message.createdAt)}
                              </span>
                              <div className="h-px bg-gray-200 flex-1" />
                            </div>
                          )}
                          {content}
                        </div>
                      );
                    });
                  })()
                )}

                {activeTyping?.sellerTyping &&
                !isLoadingActiveMessages &&
                !pendingText &&
                !isSending ? (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] w-[78%] rounded-2xl px-4 py-3 bg-white border border-gray-100">
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/3 mt-2 animate-pulse" />
                    </div>
                  </div>
                ) : null}

                {pendingText ? (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm bg-rose-200/70 text-body">
                      <p className="leading-relaxed">{pendingText}</p>
                      <p className="text-xs text-gray-600 mt-2">Envoi…</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                ref={productPickerRef}
                className="border-t bg-white relative"
              >
                {sendError ? (
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                    {sendError}
                  </div>
                ) : null}
                {activeTyping?.sellerTyping ? (
                  <div className="px-4 pt-3 text-xs text-gray-600">
                    Le vendeur est en train d’écrire…
                  </div>
                ) : null}
                {isProductPickerOpen && (
                  <div className="absolute left-4 right-4 bottom-[92px] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                    <div className="p-3 border-b">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-light">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Rechercher un produit…"
                          className="w-full bg-transparent outline-none text-sm text-body"
                        />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            void addProductToActiveConversation(product);
                            setIsProductPickerOpen(false);
                            setProductQuery("");
                            setCompactView("conversation");
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-neutral-light transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-body line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-sm font-bold text-primary whitespace-nowrap">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Ajouter à la négociation
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeProduct && (
                  <div className="rounded-2xl border border-gray-100 bg-neutral-light p-2">
                    <p className="text-sm font-medium text-body mb-2">
                      Proposer votre prix
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder={`Ex: ${activeProduct.price - 25000}`}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handlePriceProposal}
                        className="px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setIsProductPickerOpen((prev) => !prev)}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 bg-white hover:bg-neutral-light transition-colors"
                    aria-label="Ajouter un produit"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <textarea
                    value={text}
                    onChange={(e) => {
                      const value = e.target.value;
                      setText(value);
                      reportTyping(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Écrivez votre message au vendeur…"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[44px] max-h-28"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!text.trim() || isSending}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-black text-white hover:bg-black/90 transition-colors disabled:opacity-50"
                    aria-label="Envoyer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
