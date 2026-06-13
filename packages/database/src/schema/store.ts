import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  storeSellerStatusEnum,
  storeSellerTypeEnum,
  storeSellerSourceEnum,
  storeProductTypeEnum,
  storeProductOwnerEnum,
  storeProductStatusEnum,
  storePaymentStatusEnum,
  storeOrderStatusEnum,
  storeItemShippingStatusEnum,
  storeCouponTypeEnum,
  storeProductSourceEnum,
  storeSubscriptionIntervalEnum,
  storeSubscriptionStatusEnum,
  storeReturnStatusEnum,
  storePayoutStatusEnum,
  storeSellerPayoutStatusEnum,
  storeInvoiceStatusEnum,
  storeInvoiceTypeEnum,
} from './enums';
import { users } from './users';

// ─── Satıcılar ────────────────────────────────────────────────────────────────

export const storeSellers = pgTable(
  'store_sellers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    applicantName: text('applicant_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    businessType: storeSellerTypeEnum('business_type').notNull().default('bireysel'),
    businessName: text('business_name'),
    taxNumber: text('tax_number'),
    iban: text('iban'),
    productDescription: text('product_description').notNull(),
    commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }),
    iyzicоSubMerchantKey: text('iyzico_sub_merchant_key'),
    status: storeSellerStatusEnum('status').notNull().default('pending'),
    appliedFrom: storeSellerSourceEnum('applied_from').notNull().default('sahne'),
    adminNotes: text('admin_notes'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_sellers_status_idx').on(t.status),
    index('store_sellers_user_idx').on(t.userId),
  ],
);

export const storeSellersRelations = relations(storeSellers, ({ one, many }) => ({
  user: one(users, { fields: [storeSellers.userId], references: [users.id] }),
  approver: one(users, { fields: [storeSellers.approvedBy], references: [users.id] }),
  products: many(storeProducts),
  orderItems: many(storeOrderItems),
}));

// ─── Ürünler ──────────────────────────────────────────────────────────────────

export const storeProducts = pgTable(
  'store_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    ownerType: storeProductOwnerEnum('owner_type').notNull().default('vakif'),
    sellerId: uuid('seller_id').references(() => storeSellers.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description').notNull(),
    type: storeProductTypeEnum('type').notNull(),
    price: integer('price').notNull(),
    memberPrice: integer('member_price'),
    images: text('images').array().notNull().default([]),
    downloadUrl: text('download_url'),
    stock: integer('stock'),
    tags: text('tags').array().notNull().default([]),
    badgeLabel: text('badge_label'),
    badgeColor: text('badge_color'),
    variants: jsonb('variants').notNull().default([]),
    weightGrams: integer('weight_grams'),
    dimensions: jsonb('dimensions'),
    source: storeProductSourceEnum('source'),
    subscriptionInterval: storeSubscriptionIntervalEnum('subscription_interval'),
    subscriptionPrice: integer('subscription_price'),
    enabledInstallments: jsonb('enabled_installments').$type<number[]>().notNull().default([1]),
    status: storeProductStatusEnum('status').notNull().default('active'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_products_slug_idx').on(t.slug),
    index('store_products_status_idx').on(t.status),
    index('store_products_type_idx').on(t.type),
    index('store_products_seller_idx').on(t.sellerId),
  ],
);

export const storeProductsRelations = relations(storeProducts, ({ one, many }) => ({
  seller: one(storeSellers, { fields: [storeProducts.sellerId], references: [storeSellers.id] }),
  orderItems: many(storeOrderItems),
}));

// ─── Siparişler ───────────────────────────────────────────────────────────────

export const storeOrders = pgTable(
  'store_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerId: uuid('buyer_id').references(() => users.id, { onDelete: 'set null' }),
    buyerName: text('buyer_name').notNull(),
    buyerEmail: text('buyer_email').notNull(),
    shippingAddress: jsonb('shipping_address'),
    subtotal: integer('subtotal').notNull(),
    total: integer('total').notNull(),
    iyzicоConversationId: text('iyzico_conversation_id'),
    iyzicоPaymentId: text('iyzico_payment_id'),
    couponId: uuid('coupon_id'),
    discountAmount: integer('discount_amount').notNull().default(0),
    shippingCost: integer('shipping_cost').notNull().default(0),
    selectedInstallments: integer('selected_installments').notNull().default(1),
    paymentStatus: storePaymentStatusEnum('payment_status').notNull().default('pending'),
    status: storeOrderStatusEnum('status').notNull().default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_orders_buyer_idx').on(t.buyerId),
    index('store_orders_payment_status_idx').on(t.paymentStatus),
    index('store_orders_status_idx').on(t.status),
    index('store_orders_created_idx').on(t.createdAt),
  ],
);

export const storeOrdersRelations = relations(storeOrders, ({ one, many }) => ({
  buyer: one(users, { fields: [storeOrders.buyerId], references: [users.id] }),
  items: many(storeOrderItems),
}));

// ─── Sipariş Kalemleri ────────────────────────────────────────────────────────

export const storeOrderItems = pgTable(
  'store_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => storeOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => storeProducts.id, { onDelete: 'set null' }),
    productSnapshot: jsonb('product_snapshot').notNull(),
    sellerId: uuid('seller_id').references(() => storeSellers.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unit_price').notNull(),
    commissionAmount: integer('commission_amount').notNull().default(0),
    sellerAmount: integer('seller_amount').notNull().default(0),
    shippingStatus: storeItemShippingStatusEnum('shipping_status').notNull().default('pending'),
    trackingNumber: text('tracking_number'),
    trackingCompany: text('tracking_company'),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    payoutStatus: storePayoutStatusEnum('payout_status').notNull().default('held'),
    buyerConfirmedAt: timestamp('buyer_confirmed_at', { withTimezone: true }),
    autoReleaseAt: timestamp('auto_release_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_order_items_order_idx').on(t.orderId),
    index('store_order_items_seller_idx').on(t.sellerId),
    index('store_order_items_product_idx').on(t.productId),
  ],
);

export const storeOrderItemsRelations = relations(storeOrderItems, ({ one }) => ({
  order: one(storeOrders, { fields: [storeOrderItems.orderId], references: [storeOrders.id] }),
  product: one(storeProducts, { fields: [storeOrderItems.productId], references: [storeProducts.id] }),
  seller: one(storeSellers, { fields: [storeOrderItems.sellerId], references: [storeSellers.id] }),
}));

// ─── Loyalty Puanları ─────────────────────────────────────────────────────────

export const storeLoyaltyPoints = pgTable(
  'store_loyalty_points',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => storeOrders.id, { onDelete: 'set null' }),
    type: text('type').notNull().$type<'earn' | 'redeem' | 'expire' | 'adjust'>(),
    points: integer('points').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    description: text('description').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_loyalty_user_idx').on(t.userId),
    index('store_loyalty_order_idx').on(t.orderId),
    index('store_loyalty_type_idx').on(t.type),
  ],
);

export const storeLoyaltyPointsRelations = relations(storeLoyaltyPoints, ({ one }) => ({
  user: one(users, { fields: [storeLoyaltyPoints.userId], references: [users.id] }),
  order: one(storeOrders, { fields: [storeLoyaltyPoints.orderId], references: [storeOrders.id] }),
}));

// ─── Varyant Bazlı Stok ───────────────────────────────────────────────────────

export const storeVariantStocks = pgTable(
  'store_variant_stocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
    variantKey: text('variant_key').notNull(),
    stock: integer('stock').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_variant_stocks_product_variant_idx').on(t.productId, t.variantKey),
    index('store_variant_stocks_product_idx').on(t.productId),
  ],
);

export const storeVariantStocksRelations = relations(storeVariantStocks, ({ one }) => ({
  product: one(storeProducts, { fields: [storeVariantStocks.productId], references: [storeProducts.id] }),
}));

// ─── Faturalar (E-Arşiv / E-Fatura) ──────────────────────────────────────────

export const storeInvoices = pgTable(
  'store_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => storeOrders.id, { onDelete: 'cascade' }),
    invoiceNumber: text('invoice_number').notNull(),
    invoiceType: storeInvoiceTypeEnum('invoice_type').notNull().default('e_arsiv'),
    status: storeInvoiceStatusEnum('status').notNull().default('draft'),
    buyerName: text('buyer_name').notNull(),
    buyerEmail: text('buyer_email').notNull(),
    buyerTaxNumber: text('buyer_tax_number'),
    buyerAddress: text('buyer_address'),
    lines: jsonb('lines').notNull().$type<Array<{ description: string; quantity: number; unitPrice: number; vatRate: number; total: number }>>().default([]),
    subtotal: integer('subtotal').notNull(),
    vatAmount: integer('vat_amount').notNull(),
    total: integer('total').notNull(),
    providerInvoiceId: text('provider_invoice_id'),
    providerResponse: jsonb('provider_response'),
    webhookSentAt: timestamp('webhook_sent_at', { withTimezone: true }),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_invoices_number_idx').on(t.invoiceNumber),
    index('store_invoices_order_idx').on(t.orderId),
    index('store_invoices_status_idx').on(t.status),
  ],
);

export const storeInvoicesRelations = relations(storeInvoices, ({ one }) => ({
  order: one(storeOrders, { fields: [storeInvoices.orderId], references: [storeOrders.id] }),
}));

// ─── Fraud IP Engelleme ───────────────────────────────────────────────────────

export const storeFraudBlockedIps = pgTable(
  'store_fraud_blocked_ips',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ip: text('ip').notNull(),
    reason: text('reason'),
    blockedBy: uuid('blocked_by').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_fraud_blocked_ips_ip_idx').on(t.ip),
    index('store_fraud_blocked_ips_expires_idx').on(t.expiresAt),
  ],
);

// ─── Koleksiyonlar ────────────────────────────────────────────────────────────

export const storeCollections = pgTable(
  'store_collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    coverImage: text('cover_image'),
    productIds: text('product_ids').array().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_collections_slug_idx').on(t.slug),
    index('store_collections_active_idx').on(t.isActive),
  ],
);

// ─── Satıcı Ödemeleri (Escrow) ────────────────────────────────────────────────

export const storeSellerPayouts = pgTable(
  'store_seller_payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id').notNull().references(() => storeSellers.id, { onDelete: 'cascade' }),
    totalAmount: integer('total_amount').notNull(),
    status: storeSellerPayoutStatusEnum('status').notNull().default('pending'),
    itemIds: text('item_ids').array().notNull().default([]),
    adminNotes: text('admin_notes'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    paidBy: uuid('paid_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_seller_payouts_seller_idx').on(t.sellerId),
    index('store_seller_payouts_status_idx').on(t.status),
  ],
);

export const storeSellerPayoutsRelations = relations(storeSellerPayouts, ({ one }) => ({
  seller: one(storeSellers, { fields: [storeSellerPayouts.sellerId], references: [storeSellers.id] }),
  payer: one(users, { fields: [storeSellerPayouts.paidBy], references: [users.id] }),
}));

// ─── Ürün Yorumları ───────────────────────────────────────────────────────────

export const storeReviews = pgTable(
  'store_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => storeProducts.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => storeOrders.id, { onDelete: 'set null' }),
    buyerId: uuid('buyer_id').references(() => users.id, { onDelete: 'set null' }),
    buyerName: text('buyer_name').notNull(),
    buyerEmail: text('buyer_email').notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    isPublished: boolean('is_published').notNull().default(false),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_reviews_product_idx').on(t.productId),
    index('store_reviews_buyer_idx').on(t.buyerId),
  ],
);

export const storeReviewsRelations = relations(storeReviews, ({ one }) => ({
  product: one(storeProducts, { fields: [storeReviews.productId], references: [storeProducts.id] }),
  buyer: one(users, { fields: [storeReviews.buyerId], references: [users.id] }),
}));

// ─── Hediye Kartları ──────────────────────────────────────────────────────────

export const storeGiftCards = pgTable(
  'store_gift_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    originalAmount: integer('original_amount').notNull(),
    balance: integer('balance').notNull(),
    purchasedByUserId: uuid('purchased_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    purchasedByEmail: text('purchased_by_email').notNull(),
    recipientEmail: text('recipient_email').notNull(),
    recipientName: text('recipient_name').notNull(),
    message: text('message'),
    isActive: boolean('is_active').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_gift_cards_code_idx').on(t.code),
    index('store_gift_cards_recipient_idx').on(t.recipientEmail),
  ],
);

// ─── Terk Edilen Sepet ────────────────────────────────────────────────────────

export const storeAbandonedCarts = pgTable(
  'store_abandoned_carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name'),
    cartSnapshot: jsonb('cart_snapshot').notNull(),
    orderId: uuid('order_id'),
    reminderStep: integer('reminder_step').notNull().default(0),
    reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
    nextReminderAt: timestamp('next_reminder_at', { withTimezone: true }),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_abandoned_carts_email_idx').on(t.email),
    index('store_abandoned_carts_next_reminder_idx').on(t.nextReminderAt),
  ],
);

// ─── İade Talepleri ───────────────────────────────────────────────────────────

export const storeReturns = pgTable(
  'store_returns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => storeOrders.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').references(() => storeOrderItems.id, { onDelete: 'set null' }),
    buyerId: uuid('buyer_id').references(() => users.id, { onDelete: 'set null' }),
    buyerEmail: text('buyer_email').notNull(),
    reason: text('reason').notNull(),
    status: storeReturnStatusEnum('status').notNull().default('pending'),
    adminNotes: text('admin_notes'),
    refundAmount: integer('refund_amount'),
    restockItems: boolean('restock_items').notNull().default(true),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_returns_order_idx').on(t.orderId),
    index('store_returns_status_idx').on(t.status),
  ],
);

// ─── Favori Listesi ───────────────────────────────────────────────────────────

export const storeWishlist = pgTable(
  'store_wishlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_wishlist_user_idx').on(t.userId),
    index('store_wishlist_product_idx').on(t.productId),
  ],
);

// ─── Abonelikler ──────────────────────────────────────────────────────────────

export const storeSubscriptions = pgTable(
  'store_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => storeProducts.id, { onDelete: 'set null' }),
    buyerId: uuid('buyer_id').references(() => users.id, { onDelete: 'set null' }),
    buyerEmail: text('buyer_email').notNull(),
    buyerName: text('buyer_name').notNull(),
    interval: storeSubscriptionIntervalEnum('interval').notNull().default('monthly'),
    priceKurus: integer('price_kurus').notNull(),
    status: storeSubscriptionStatusEnum('status').notNull().default('active'),
    iyzicоSubscriptionReferenceCode: text('iyzico_subscription_reference_code'),
    iyzicоCustomerReferenceCode: text('iyzico_customer_reference_code'),
    nextBillingAt: timestamp('next_billing_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_subscriptions_buyer_idx').on(t.buyerId),
    index('store_subscriptions_status_idx').on(t.status),
    index('store_subscriptions_next_billing_idx').on(t.nextBillingAt),
  ],
);

// ─── Stok Bildirimi ───────────────────────────────────────────────────────────

export const storeStockNotifications = pgTable(
  'store_stock_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('store_stock_notifications_product_idx').on(t.productId),
    index('store_stock_notifications_email_idx').on(t.email),
  ],
);

// ─── Ürün Paketleri (Bundle) ──────────────────────────────────────────────────

export const storeProductBundles = pgTable(
  'store_product_bundles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bundleProductId: uuid('bundle_product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
    includedProductId: uuid('included_product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
  },
  (t) => [index('store_bundles_bundle_idx').on(t.bundleProductId)],
);

// ─── Kargo Gönderileri ────────────────────────────────────────────────────────

export const storeShipments = pgTable(
  'store_shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => storeOrders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('yurtici'),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    barcode: text('barcode'),
    shippingCostKurus: integer('shipping_cost_kurus').notNull().default(0),
    status: text('status').notNull().default('created'),
    providerResponse: jsonb('provider_response'),
    labelUrl: text('label_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('store_shipments_order_idx').on(t.orderId)],
);

// ─── B2B Fiyat Grupları ───────────────────────────────────────────────────────

export const storeB2bPriceGroups = pgTable(
  'store_b2b_price_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    discountPct: integer('discount_pct').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export const storeB2bProductPrices = pgTable(
  'store_b2b_product_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().references(() => storeB2bPriceGroups.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => storeProducts.id, { onDelete: 'cascade' }),
    priceKurus: integer('price_kurus').notNull(),
  },
  (t) => [index('store_b2b_prices_product_idx').on(t.productId)],
);

// ─── Kupon Kodları ────────────────────────────────────────────────────────────

export const storeCoupons = pgTable(
  'store_coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    description: text('description'),
    discountType: storeCouponTypeEnum('discount_type').notNull().default('percentage'),
    discountValue: integer('discount_value').notNull(),
    minOrderAmount: integer('min_order_amount').notNull().default(0),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('store_coupons_code_idx').on(t.code),
    index('store_coupons_active_idx').on(t.isActive),
  ],
);
