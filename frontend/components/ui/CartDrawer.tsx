'use client';

import { useAuth } from '@/context/AuthContext';
import { Link } from '@/navigation';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/data';

export default function CartDrawer() {
  const { user } = useAuth();
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-body">Votre Panier</h2>
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Votre panier est vide</p>
              <p className="text-gray-400 text-sm mb-6">Découvrez nos produits !</p>
              <Link
                href="/boutique"
                onClick={() => setIsOpen(false)}
                className="bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Explorer la boutique
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/boutique/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="font-medium text-body hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-primary font-bold mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Diminuer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Augmenter"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">Sous-total</span>
              <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/checkout"
                  onClick={(e) => {
                    setIsOpen(false);
                    if (!user) {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login", redirectUrl: "/checkout" } }));
                    }
                  }}
                className="flex items-center justify-center space-x-2 w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                <span>Passer la commande</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={clearCart}
                className="w-full text-gray-500 text-sm hover:text-red-500 transition-colors"
              >
                Vider le panier
              </button>
            </div>

            {/* Payment Info */}
            <p className="text-xs text-gray-500 text-center">
              Paiement sécurisé par Orange Money ou MTN MoMo
            </p>
          </div>
        )}
      </div>
    </>
  );
}
