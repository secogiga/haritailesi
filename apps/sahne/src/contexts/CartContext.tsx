'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StoreProduct } from '@/app/magaza/page';

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  memberPrice: number | null;
  type: 'digital' | 'physical' | 'app';
  image: string | null;
  badgeLabel: string | null;
  quantity: number;
  selectedVariants: Record<string, string>;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: StoreProduct, quantity?: number, variants?: Record<string, string>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'sahne_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as CartItem[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  function addToCart(product: StoreProduct, quantity = 1, variants: Record<string, string> = {}) {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
        );
      }
      return [...prev, {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        memberPrice: product.memberPrice,
        type: product.type,
        image: product.images[0] ?? null,
        badgeLabel: product.badgeLabel,
        quantity,
        selectedVariants: variants,
      }];
    });
  }

  function removeFromCart(productId: string) {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
  }

  function clearCart() { setItems([]); }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
