'use client';

import Script from 'next/script';

const GA_ID = process.env['NEXT_PUBLIC_GA_ID'];

export function GA4Provider() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { send_page_view: true });
      `}</Script>
    </>
  );
}

export function trackViewItem(product: { id: string; title: string; price: number; type: string }) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'view_item', {
    currency: 'TRY',
    value: product.price / 100,
    items: [{ item_id: product.id, item_name: product.title, price: product.price / 100, item_category: product.type }],
  });
}

export function trackAddToCart(product: { id: string; title: string; price: number; type: string }) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'add_to_cart', {
    currency: 'TRY',
    value: product.price / 100,
    items: [{ item_id: product.id, item_name: product.title, price: product.price / 100, item_category: product.type }],
  });
}

export function trackPurchase(orderId: string, total: number, items: Array<{ id: string; title: string; price: number; quantity: number }>) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    currency: 'TRY',
    value: total / 100,
    items: items.map(i => ({ item_id: i.id, item_name: i.title, price: i.price / 100, quantity: i.quantity })),
  });
}

// TypeScript global augmentation
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
