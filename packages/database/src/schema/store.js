"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeCoupons = exports.storeB2bProductPrices = exports.storeB2bPriceGroups = exports.storeShipments = exports.storeProductBundles = exports.storeStockNotifications = exports.storeSubscriptions = exports.storeWishlist = exports.storeReturns = exports.storeAbandonedCarts = exports.storeGiftCards = exports.storeReviewsRelations = exports.storeReviews = exports.storeSellerPayoutsRelations = exports.storeSellerPayouts = exports.storeCollections = exports.storeFraudBlockedIps = exports.storeInvoicesRelations = exports.storeInvoices = exports.storeVariantStocksRelations = exports.storeVariantStocks = exports.storeLoyaltyPointsRelations = exports.storeLoyaltyPoints = exports.storeOrderItemsRelations = exports.storeOrderItems = exports.storeOrdersRelations = exports.storeOrders = exports.storeProductsRelations = exports.storeProducts = exports.storeSellersRelations = exports.storeSellers = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
var users_1 = require("./users");
// ─── Satıcılar ────────────────────────────────────────────────────────────────
exports.storeSellers = (0, pg_core_1.pgTable)('store_sellers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    applicantName: (0, pg_core_1.text)('applicant_name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    phone: (0, pg_core_1.text)('phone'),
    businessType: (0, enums_1.storeSellerTypeEnum)('business_type').notNull().default('bireysel'),
    businessName: (0, pg_core_1.text)('business_name'),
    taxNumber: (0, pg_core_1.text)('tax_number'),
    iban: (0, pg_core_1.text)('iban'),
    productDescription: (0, pg_core_1.text)('product_description').notNull(),
    commissionRate: (0, pg_core_1.numeric)('commission_rate', { precision: 5, scale: 4 }),
    iyzicоSubMerchantKey: (0, pg_core_1.text)('iyzico_sub_merchant_key'),
    status: (0, enums_1.storeSellerStatusEnum)('status').notNull().default('pending'),
    appliedFrom: (0, enums_1.storeSellerSourceEnum)('applied_from').notNull().default('sahne'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    approvedAt: (0, pg_core_1.timestamp)('approved_at', { withTimezone: true }),
    approvedBy: (0, pg_core_1.uuid)('approved_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_sellers_status_idx').on(t.status),
    (0, pg_core_1.index)('store_sellers_user_idx').on(t.userId),
]; });
exports.storeSellersRelations = (0, drizzle_orm_1.relations)(exports.storeSellers, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(users_1.users, { fields: [exports.storeSellers.userId], references: [users_1.users.id] }),
        approver: one(users_1.users, { fields: [exports.storeSellers.approvedBy], references: [users_1.users.id] }),
        products: many(exports.storeProducts),
        orderItems: many(exports.storeOrderItems),
    });
});
// ─── Ürünler ──────────────────────────────────────────────────────────────────
exports.storeProducts = (0, pg_core_1.pgTable)('store_products', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.text)('slug').notNull(),
    ownerType: (0, enums_1.storeProductOwnerEnum)('owner_type').notNull().default('vakif'),
    sellerId: (0, pg_core_1.uuid)('seller_id').references(function () { return exports.storeSellers.id; }, { onDelete: 'set null' }),
    title: (0, pg_core_1.text)('title').notNull(),
    subtitle: (0, pg_core_1.text)('subtitle'),
    description: (0, pg_core_1.text)('description').notNull(),
    type: (0, enums_1.storeProductTypeEnum)('type').notNull(),
    price: (0, pg_core_1.integer)('price').notNull(),
    memberPrice: (0, pg_core_1.integer)('member_price'),
    images: (0, pg_core_1.text)('images').array().notNull().default([]),
    downloadUrl: (0, pg_core_1.text)('download_url'),
    stock: (0, pg_core_1.integer)('stock'),
    tags: (0, pg_core_1.text)('tags').array().notNull().default([]),
    badgeLabel: (0, pg_core_1.text)('badge_label'),
    badgeColor: (0, pg_core_1.text)('badge_color'),
    variants: (0, pg_core_1.jsonb)('variants').notNull().default([]),
    weightGrams: (0, pg_core_1.integer)('weight_grams'),
    dimensions: (0, pg_core_1.jsonb)('dimensions'),
    source: (0, enums_1.storeProductSourceEnum)('source'),
    subscriptionInterval: (0, enums_1.storeSubscriptionIntervalEnum)('subscription_interval'),
    subscriptionPrice: (0, pg_core_1.integer)('subscription_price'),
    enabledInstallments: (0, pg_core_1.jsonb)('enabled_installments').$type().notNull().default([1]),
    status: (0, enums_1.storeProductStatusEnum)('status').notNull().default('active'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_products_slug_idx').on(t.slug),
    (0, pg_core_1.index)('store_products_status_idx').on(t.status),
    (0, pg_core_1.index)('store_products_type_idx').on(t.type),
    (0, pg_core_1.index)('store_products_seller_idx').on(t.sellerId),
]; });
exports.storeProductsRelations = (0, drizzle_orm_1.relations)(exports.storeProducts, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        seller: one(exports.storeSellers, { fields: [exports.storeProducts.sellerId], references: [exports.storeSellers.id] }),
        orderItems: many(exports.storeOrderItems),
    });
});
// ─── Siparişler ───────────────────────────────────────────────────────────────
exports.storeOrders = (0, pg_core_1.pgTable)('store_orders', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    buyerId: (0, pg_core_1.uuid)('buyer_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    buyerName: (0, pg_core_1.text)('buyer_name').notNull(),
    buyerEmail: (0, pg_core_1.text)('buyer_email').notNull(),
    shippingAddress: (0, pg_core_1.jsonb)('shipping_address'),
    subtotal: (0, pg_core_1.integer)('subtotal').notNull(),
    total: (0, pg_core_1.integer)('total').notNull(),
    iyzicоConversationId: (0, pg_core_1.text)('iyzico_conversation_id'),
    iyzicоPaymentId: (0, pg_core_1.text)('iyzico_payment_id'),
    couponId: (0, pg_core_1.uuid)('coupon_id'),
    discountAmount: (0, pg_core_1.integer)('discount_amount').notNull().default(0),
    shippingCost: (0, pg_core_1.integer)('shipping_cost').notNull().default(0),
    selectedInstallments: (0, pg_core_1.integer)('selected_installments').notNull().default(1),
    paymentStatus: (0, enums_1.storePaymentStatusEnum)('payment_status').notNull().default('pending'),
    status: (0, enums_1.storeOrderStatusEnum)('status').notNull().default('pending'),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_orders_buyer_idx').on(t.buyerId),
    (0, pg_core_1.index)('store_orders_payment_status_idx').on(t.paymentStatus),
    (0, pg_core_1.index)('store_orders_status_idx').on(t.status),
    (0, pg_core_1.index)('store_orders_created_idx').on(t.createdAt),
]; });
exports.storeOrdersRelations = (0, drizzle_orm_1.relations)(exports.storeOrders, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        buyer: one(users_1.users, { fields: [exports.storeOrders.buyerId], references: [users_1.users.id] }),
        items: many(exports.storeOrderItems),
    });
});
// ─── Sipariş Kalemleri ────────────────────────────────────────────────────────
exports.storeOrderItems = (0, pg_core_1.pgTable)('store_order_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull().references(function () { return exports.storeOrders.id; }, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.uuid)('product_id').references(function () { return exports.storeProducts.id; }, { onDelete: 'set null' }),
    productSnapshot: (0, pg_core_1.jsonb)('product_snapshot').notNull(),
    sellerId: (0, pg_core_1.uuid)('seller_id').references(function () { return exports.storeSellers.id; }, { onDelete: 'set null' }),
    quantity: (0, pg_core_1.integer)('quantity').notNull().default(1),
    unitPrice: (0, pg_core_1.integer)('unit_price').notNull(),
    commissionAmount: (0, pg_core_1.integer)('commission_amount').notNull().default(0),
    sellerAmount: (0, pg_core_1.integer)('seller_amount').notNull().default(0),
    shippingStatus: (0, enums_1.storeItemShippingStatusEnum)('shipping_status').notNull().default('pending'),
    trackingNumber: (0, pg_core_1.text)('tracking_number'),
    trackingCompany: (0, pg_core_1.text)('tracking_company'),
    shippedAt: (0, pg_core_1.timestamp)('shipped_at', { withTimezone: true }),
    deliveredAt: (0, pg_core_1.timestamp)('delivered_at', { withTimezone: true }),
    payoutStatus: (0, enums_1.storePayoutStatusEnum)('payout_status').notNull().default('held'),
    buyerConfirmedAt: (0, pg_core_1.timestamp)('buyer_confirmed_at', { withTimezone: true }),
    autoReleaseAt: (0, pg_core_1.timestamp)('auto_release_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_order_items_order_idx').on(t.orderId),
    (0, pg_core_1.index)('store_order_items_seller_idx').on(t.sellerId),
    (0, pg_core_1.index)('store_order_items_product_idx').on(t.productId),
]; });
exports.storeOrderItemsRelations = (0, drizzle_orm_1.relations)(exports.storeOrderItems, function (_a) {
    var one = _a.one;
    return ({
        order: one(exports.storeOrders, { fields: [exports.storeOrderItems.orderId], references: [exports.storeOrders.id] }),
        product: one(exports.storeProducts, { fields: [exports.storeOrderItems.productId], references: [exports.storeProducts.id] }),
        seller: one(exports.storeSellers, { fields: [exports.storeOrderItems.sellerId], references: [exports.storeSellers.id] }),
    });
});
// ─── Loyalty Puanları ─────────────────────────────────────────────────────────
exports.storeLoyaltyPoints = (0, pg_core_1.pgTable)('store_loyalty_points', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    orderId: (0, pg_core_1.uuid)('order_id').references(function () { return exports.storeOrders.id; }, { onDelete: 'set null' }),
    type: (0, pg_core_1.text)('type').notNull().$type(),
    points: (0, pg_core_1.integer)('points').notNull(),
    balanceAfter: (0, pg_core_1.integer)('balance_after').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_loyalty_user_idx').on(t.userId),
    (0, pg_core_1.index)('store_loyalty_order_idx').on(t.orderId),
    (0, pg_core_1.index)('store_loyalty_type_idx').on(t.type),
]; });
exports.storeLoyaltyPointsRelations = (0, drizzle_orm_1.relations)(exports.storeLoyaltyPoints, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.storeLoyaltyPoints.userId], references: [users_1.users.id] }),
        order: one(exports.storeOrders, { fields: [exports.storeLoyaltyPoints.orderId], references: [exports.storeOrders.id] }),
    });
});
// ─── Varyant Bazlı Stok ───────────────────────────────────────────────────────
exports.storeVariantStocks = (0, pg_core_1.pgTable)('store_variant_stocks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    productId: (0, pg_core_1.uuid)('product_id').notNull().references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    variantKey: (0, pg_core_1.text)('variant_key').notNull(),
    stock: (0, pg_core_1.integer)('stock').notNull().default(0),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_variant_stocks_product_variant_idx').on(t.productId, t.variantKey),
    (0, pg_core_1.index)('store_variant_stocks_product_idx').on(t.productId),
]; });
exports.storeVariantStocksRelations = (0, drizzle_orm_1.relations)(exports.storeVariantStocks, function (_a) {
    var one = _a.one;
    return ({
        product: one(exports.storeProducts, { fields: [exports.storeVariantStocks.productId], references: [exports.storeProducts.id] }),
    });
});
// ─── Faturalar (E-Arşiv / E-Fatura) ──────────────────────────────────────────
exports.storeInvoices = (0, pg_core_1.pgTable)('store_invoices', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull().references(function () { return exports.storeOrders.id; }, { onDelete: 'cascade' }),
    invoiceNumber: (0, pg_core_1.text)('invoice_number').notNull(),
    invoiceType: (0, enums_1.storeInvoiceTypeEnum)('invoice_type').notNull().default('e_arsiv'),
    status: (0, enums_1.storeInvoiceStatusEnum)('status').notNull().default('draft'),
    buyerName: (0, pg_core_1.text)('buyer_name').notNull(),
    buyerEmail: (0, pg_core_1.text)('buyer_email').notNull(),
    buyerTaxNumber: (0, pg_core_1.text)('buyer_tax_number'),
    buyerAddress: (0, pg_core_1.text)('buyer_address'),
    lines: (0, pg_core_1.jsonb)('lines').notNull().$type().default([]),
    subtotal: (0, pg_core_1.integer)('subtotal').notNull(),
    vatAmount: (0, pg_core_1.integer)('vat_amount').notNull(),
    total: (0, pg_core_1.integer)('total').notNull(),
    providerInvoiceId: (0, pg_core_1.text)('provider_invoice_id'),
    providerResponse: (0, pg_core_1.jsonb)('provider_response'),
    webhookSentAt: (0, pg_core_1.timestamp)('webhook_sent_at', { withTimezone: true }),
    issuedAt: (0, pg_core_1.timestamp)('issued_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_invoices_number_idx').on(t.invoiceNumber),
    (0, pg_core_1.index)('store_invoices_order_idx').on(t.orderId),
    (0, pg_core_1.index)('store_invoices_status_idx').on(t.status),
]; });
exports.storeInvoicesRelations = (0, drizzle_orm_1.relations)(exports.storeInvoices, function (_a) {
    var one = _a.one;
    return ({
        order: one(exports.storeOrders, { fields: [exports.storeInvoices.orderId], references: [exports.storeOrders.id] }),
    });
});
// ─── Fraud IP Engelleme ───────────────────────────────────────────────────────
exports.storeFraudBlockedIps = (0, pg_core_1.pgTable)('store_fraud_blocked_ips', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ip: (0, pg_core_1.text)('ip').notNull(),
    reason: (0, pg_core_1.text)('reason'),
    blockedBy: (0, pg_core_1.uuid)('blocked_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_fraud_blocked_ips_ip_idx').on(t.ip),
    (0, pg_core_1.index)('store_fraud_blocked_ips_expires_idx').on(t.expiresAt),
]; });
// ─── Koleksiyonlar ────────────────────────────────────────────────────────────
exports.storeCollections = (0, pg_core_1.pgTable)('store_collections', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    slug: (0, pg_core_1.text)('slug').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    coverImage: (0, pg_core_1.text)('cover_image'),
    productIds: (0, pg_core_1.text)('product_ids').array().notNull().default([]),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_collections_slug_idx').on(t.slug),
    (0, pg_core_1.index)('store_collections_active_idx').on(t.isActive),
]; });
// ─── Satıcı Ödemeleri (Escrow) ────────────────────────────────────────────────
exports.storeSellerPayouts = (0, pg_core_1.pgTable)('store_seller_payouts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sellerId: (0, pg_core_1.uuid)('seller_id').notNull().references(function () { return exports.storeSellers.id; }, { onDelete: 'cascade' }),
    totalAmount: (0, pg_core_1.integer)('total_amount').notNull(),
    status: (0, enums_1.storeSellerPayoutStatusEnum)('status').notNull().default('pending'),
    itemIds: (0, pg_core_1.text)('item_ids').array().notNull().default([]),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    paidAt: (0, pg_core_1.timestamp)('paid_at', { withTimezone: true }),
    paidBy: (0, pg_core_1.uuid)('paid_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_seller_payouts_seller_idx').on(t.sellerId),
    (0, pg_core_1.index)('store_seller_payouts_status_idx').on(t.status),
]; });
exports.storeSellerPayoutsRelations = (0, drizzle_orm_1.relations)(exports.storeSellerPayouts, function (_a) {
    var one = _a.one;
    return ({
        seller: one(exports.storeSellers, { fields: [exports.storeSellerPayouts.sellerId], references: [exports.storeSellers.id] }),
        payer: one(users_1.users, { fields: [exports.storeSellerPayouts.paidBy], references: [users_1.users.id] }),
    });
});
// ─── Ürün Yorumları ───────────────────────────────────────────────────────────
exports.storeReviews = (0, pg_core_1.pgTable)('store_reviews', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    productId: (0, pg_core_1.uuid)('product_id').references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    orderId: (0, pg_core_1.uuid)('order_id').references(function () { return exports.storeOrders.id; }, { onDelete: 'set null' }),
    buyerId: (0, pg_core_1.uuid)('buyer_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    buyerName: (0, pg_core_1.text)('buyer_name').notNull(),
    buyerEmail: (0, pg_core_1.text)('buyer_email').notNull(),
    rating: (0, pg_core_1.integer)('rating').notNull(),
    comment: (0, pg_core_1.text)('comment'),
    isPublished: (0, pg_core_1.boolean)('is_published').notNull().default(false),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_reviews_product_idx').on(t.productId),
    (0, pg_core_1.index)('store_reviews_buyer_idx').on(t.buyerId),
]; });
exports.storeReviewsRelations = (0, drizzle_orm_1.relations)(exports.storeReviews, function (_a) {
    var one = _a.one;
    return ({
        product: one(exports.storeProducts, { fields: [exports.storeReviews.productId], references: [exports.storeProducts.id] }),
        buyer: one(users_1.users, { fields: [exports.storeReviews.buyerId], references: [users_1.users.id] }),
    });
});
// ─── Hediye Kartları ──────────────────────────────────────────────────────────
exports.storeGiftCards = (0, pg_core_1.pgTable)('store_gift_cards', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    code: (0, pg_core_1.text)('code').notNull(),
    originalAmount: (0, pg_core_1.integer)('original_amount').notNull(),
    balance: (0, pg_core_1.integer)('balance').notNull(),
    purchasedByUserId: (0, pg_core_1.uuid)('purchased_by_user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    purchasedByEmail: (0, pg_core_1.text)('purchased_by_email').notNull(),
    recipientEmail: (0, pg_core_1.text)('recipient_email').notNull(),
    recipientName: (0, pg_core_1.text)('recipient_name').notNull(),
    message: (0, pg_core_1.text)('message'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_gift_cards_code_idx').on(t.code),
    (0, pg_core_1.index)('store_gift_cards_recipient_idx').on(t.recipientEmail),
]; });
// ─── Terk Edilen Sepet ────────────────────────────────────────────────────────
exports.storeAbandonedCarts = (0, pg_core_1.pgTable)('store_abandoned_carts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').notNull(),
    name: (0, pg_core_1.text)('name'),
    cartSnapshot: (0, pg_core_1.jsonb)('cart_snapshot').notNull(),
    orderId: (0, pg_core_1.uuid)('order_id'),
    reminderStep: (0, pg_core_1.integer)('reminder_step').notNull().default(0),
    reminderSentAt: (0, pg_core_1.timestamp)('reminder_sent_at', { withTimezone: true }),
    nextReminderAt: (0, pg_core_1.timestamp)('next_reminder_at', { withTimezone: true }),
    convertedAt: (0, pg_core_1.timestamp)('converted_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_abandoned_carts_email_idx').on(t.email),
    (0, pg_core_1.index)('store_abandoned_carts_next_reminder_idx').on(t.nextReminderAt),
]; });
// ─── İade Talepleri ───────────────────────────────────────────────────────────
exports.storeReturns = (0, pg_core_1.pgTable)('store_returns', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull().references(function () { return exports.storeOrders.id; }, { onDelete: 'cascade' }),
    orderItemId: (0, pg_core_1.uuid)('order_item_id').references(function () { return exports.storeOrderItems.id; }, { onDelete: 'set null' }),
    buyerId: (0, pg_core_1.uuid)('buyer_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    buyerEmail: (0, pg_core_1.text)('buyer_email').notNull(),
    reason: (0, pg_core_1.text)('reason').notNull(),
    status: (0, enums_1.storeReturnStatusEnum)('status').notNull().default('pending'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    refundAmount: (0, pg_core_1.integer)('refund_amount'),
    restockItems: (0, pg_core_1.boolean)('restock_items').notNull().default(true),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_returns_order_idx').on(t.orderId),
    (0, pg_core_1.index)('store_returns_status_idx').on(t.status),
]; });
// ─── Favori Listesi ───────────────────────────────────────────────────────────
exports.storeWishlist = (0, pg_core_1.pgTable)('store_wishlist', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.uuid)('product_id').notNull().references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_wishlist_user_idx').on(t.userId),
    (0, pg_core_1.index)('store_wishlist_product_idx').on(t.productId),
]; });
// ─── Abonelikler ──────────────────────────────────────────────────────────────
exports.storeSubscriptions = (0, pg_core_1.pgTable)('store_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    productId: (0, pg_core_1.uuid)('product_id').references(function () { return exports.storeProducts.id; }, { onDelete: 'set null' }),
    buyerId: (0, pg_core_1.uuid)('buyer_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    buyerEmail: (0, pg_core_1.text)('buyer_email').notNull(),
    buyerName: (0, pg_core_1.text)('buyer_name').notNull(),
    interval: (0, enums_1.storeSubscriptionIntervalEnum)('interval').notNull().default('monthly'),
    priceKurus: (0, pg_core_1.integer)('price_kurus').notNull(),
    status: (0, enums_1.storeSubscriptionStatusEnum)('status').notNull().default('active'),
    iyzicоSubscriptionReferenceCode: (0, pg_core_1.text)('iyzico_subscription_reference_code'),
    iyzicоCustomerReferenceCode: (0, pg_core_1.text)('iyzico_customer_reference_code'),
    nextBillingAt: (0, pg_core_1.timestamp)('next_billing_at', { withTimezone: true }),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_subscriptions_buyer_idx').on(t.buyerId),
    (0, pg_core_1.index)('store_subscriptions_status_idx').on(t.status),
    (0, pg_core_1.index)('store_subscriptions_next_billing_idx').on(t.nextBillingAt),
]; });
// ─── Stok Bildirimi ───────────────────────────────────────────────────────────
exports.storeStockNotifications = (0, pg_core_1.pgTable)('store_stock_notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    productId: (0, pg_core_1.uuid)('product_id').notNull().references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    email: (0, pg_core_1.text)('email').notNull(),
    notifiedAt: (0, pg_core_1.timestamp)('notified_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('store_stock_notifications_product_idx').on(t.productId),
    (0, pg_core_1.index)('store_stock_notifications_email_idx').on(t.email),
]; });
// ─── Ürün Paketleri (Bundle) ──────────────────────────────────────────────────
exports.storeProductBundles = (0, pg_core_1.pgTable)('store_product_bundles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    bundleProductId: (0, pg_core_1.uuid)('bundle_product_id').notNull().references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    includedProductId: (0, pg_core_1.uuid)('included_product_id').notNull().references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    quantity: (0, pg_core_1.integer)('quantity').notNull().default(1),
}, function (t) { return [(0, pg_core_1.index)('store_bundles_bundle_idx').on(t.bundleProductId)]; });
// ─── Kargo Gönderileri ────────────────────────────────────────────────────────
exports.storeShipments = (0, pg_core_1.pgTable)('store_shipments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull().references(function () { return exports.storeOrders.id; }, { onDelete: 'cascade' }),
    provider: (0, pg_core_1.text)('provider').notNull().default('yurtici'),
    trackingNumber: (0, pg_core_1.text)('tracking_number'),
    trackingUrl: (0, pg_core_1.text)('tracking_url'),
    barcode: (0, pg_core_1.text)('barcode'),
    shippingCostKurus: (0, pg_core_1.integer)('shipping_cost_kurus').notNull().default(0),
    status: (0, pg_core_1.text)('status').notNull().default('created'),
    providerResponse: (0, pg_core_1.jsonb)('provider_response'),
    labelUrl: (0, pg_core_1.text)('label_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [(0, pg_core_1.index)('store_shipments_order_idx').on(t.orderId)]; });
// ─── B2B Fiyat Grupları ───────────────────────────────────────────────────────
exports.storeB2bPriceGroups = (0, pg_core_1.pgTable)('store_b2b_price_groups', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    discountPct: (0, pg_core_1.integer)('discount_pct').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.storeB2bProductPrices = (0, pg_core_1.pgTable)('store_b2b_product_prices', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    groupId: (0, pg_core_1.uuid)('group_id').notNull().references(function () { return exports.storeB2bPriceGroups.id; }, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.uuid)('product_id').notNull().references(function () { return exports.storeProducts.id; }, { onDelete: 'cascade' }),
    priceKurus: (0, pg_core_1.integer)('price_kurus').notNull(),
}, function (t) { return [(0, pg_core_1.index)('store_b2b_prices_product_idx').on(t.productId)]; });
// ─── Kupon Kodları ────────────────────────────────────────────────────────────
exports.storeCoupons = (0, pg_core_1.pgTable)('store_coupons', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    code: (0, pg_core_1.text)('code').notNull(),
    description: (0, pg_core_1.text)('description'),
    discountType: (0, enums_1.storeCouponTypeEnum)('discount_type').notNull().default('percentage'),
    discountValue: (0, pg_core_1.integer)('discount_value').notNull(),
    minOrderAmount: (0, pg_core_1.integer)('min_order_amount').notNull().default(0),
    maxUses: (0, pg_core_1.integer)('max_uses'),
    usedCount: (0, pg_core_1.integer)('used_count').notNull().default(0),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('store_coupons_code_idx').on(t.code),
    (0, pg_core_1.index)('store_coupons_active_idx').on(t.isActive),
]; });
