"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import NegotiationChatPanel from "@/components/ui/NegotiationChatPanel";

type OpenChatEventDetail = {
  productId?: string;
  productSlug?: string;
  conversationId?: string;
};

export default function ChatFloatingHost() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, openChat, closeChat } = useChat();
  const [isExpanded, setIsExpanded] = useState(false);
  const isAccountRoute = pathname.startsWith("/account") || pathname.startsWith("/checkout");

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isAccountRoute) return;
    if (isOpen) closeChat();
  }, [closeChat, isAccountRoute, isOpen]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<OpenChatEventDetail>;
      setIsExpanded(false);
      openChat(custom.detail);
    };

    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, [openChat]);

  if (isAccountRoute) return null;

  const segments = pathname.split("/").filter(Boolean);
  const isProductPage = segments[0] === "boutique" && segments.length >= 2;

  const handleOpen = () => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { tab: "login" } }),
      );
      return;
    }

    setIsExpanded(false);
    openChat(isProductPage ? { productSlug: segments[1] } : undefined);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`fixed bottom-5 right-5 z-[55] inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-3 shadow-lg hover:bg-primary/90 transition-colors ${
          isProductPage ? "hidden md:inline-flex" : ""
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Discuter le prix</span>
      </button>

      {isOpen && (
        <>
          {isExpanded ? (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <button
                type="button"
                onClick={closeChat}
                className="absolute inset-0 bg-black/40"
                aria-label="Fermer"
              />
              <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0">
                <NegotiationChatPanel
                  variant="expanded"
                  onReduce={() => setIsExpanded(false)}
                  onClose={closeChat}
                />
              </div>
            </div>
          ) : (
            <div className="fixed z-[70] bottom-24 right-5 left-5 sm:left-auto sm:w-[420px] max-w-[calc(100vw-2.5rem)] h-[640px] max-h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <NegotiationChatPanel
                variant="compact"
                onExpand={() => setIsExpanded(true)}
                onClose={closeChat}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
