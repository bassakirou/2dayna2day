'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getProductBySlugFromWp } from '@/lib/wp-products';
import type { Product } from '@/lib/data';

export interface CartItem {
  specialPromotion?: Product['specialPromotion'];
  regularPrice?: number;
  id: string;
  wpId?: string;
  variationId?: number;
  stock?: number;
  name: string;
  price: number;
  quantity: number;
  thumbnail: string;
  slug: string;
  crossSells?: {
    wpId: number;
    id: string;
    slug: string;
    name: string;
    price: number;
    priceOld: number | null;
    thumbnail: string;
    badge: string | null;
  }[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, openDrawer?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('2day-cart') || '[]'); if (Array.isArray(saved)) setItems(saved.filter(i => i && typeof i.id === 'string' && typeof i.name === 'string' && typeof i.slug === 'string' && typeof i.thumbnail === 'string' && Number.isFinite(i.price) && i.price >= 0 && Number.isInteger(i.quantity) && i.quantity > 0)); } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) { try { localStorage.setItem('2day-cart', JSON.stringify(items)); } catch {} } }, [items, hydrated]);
  const [isOpen, setIsOpen] = useState(false);
  const pricingKeys = items.map(item => `${item.id}:${item.slug}:${item.variationId || 0}`).join('|');
  useEffect(() => {
    if (!hydrated || !pricingKeys) return;
    let active = true;
    const refresh = async () => {
      const products = await Promise.all(items.map(item => getProductBySlugFromWp(item.slug).catch(() => null)));
      if (!active) return;
      setItems(current => current.map(item => {
        const product = products.find(product => product?.slug === item.slug);
        if (!product) return item;
        const variation = item.variationId ? product.variations?.find(variation => variation.id === item.variationId) : null;
        const price = variation?.price ?? product.price;
        if (!Number.isFinite(price)) return item;
        const specialPromotion = variation ? variation.specialPromotion : product.specialPromotion;
        return {...item, price, specialPromotion, regularPrice: specialPromotion?.regularPrice ?? price};
      }));
    };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => {active = false; window.clearInterval(timer);};
    // The key tracks products, not price updates, to avoid a refresh loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, pricingKeys]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>, openDrawer = true) => {
    if (!Number.isFinite(newItem.price) || newItem.price < 0 || newItem.stock === 0) return;
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
    setIsOpen(openDrawer);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
}
