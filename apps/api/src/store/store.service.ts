import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, and, lt, lte, inArray, ilike, or, isNull, type SQL } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  storeSellers, storeProducts, storeOrders, storeOrderItems, storeCoupons,
  storeReviews, storeGiftCards, storeAbandonedCarts,
  storeReturns, storeWishlist, storeSubscriptions, storeStockNotifications,
  storeShipments, storeProductBundles, storeB2bPriceGroups, storeB2bProductPrices,
  storeSellerPayouts, storeCollections, storeInvoices, storeVariantStocks,
  storeLoyaltyPoints,
} from '@haritailesi/database';
import { EmailService } from '../email/email.service';
import { IyzicoService } from '../donations/iyzico.service';

const SAHNE_URL = process.env['SAHNE_URL'] ?? 'http://localhost:3002';
const MUTFAK_URL = process.env['MUTFAK_URL'] ?? 'http://localhost:3003';

@Injectable()
export class StoreService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly iyzicoService: IyzicoService,
  ) {}

  // ─── Satıcı Başvuruları ───────────────────────────────────────────────────────

  async applyAsSeller(dto: {
    userId?: string;
    applicantName: string;
    email: string;
    phone?: string;
    businessType: 'bireysel' | 'kurumsal';
    businessName?: string;
    taxNumber?: string;
    iban?: string;
    productDescription: string;
    appliedFrom: 'sahne' | 'mutfak';
  }) {
    const [row] = await this.db
      .insert(storeSellers)
      .values({
        userId: dto.userId ?? null,
        applicantName: dto.applicantName,
        email: dto.email,
        phone: dto.phone ?? null,
        businessType: dto.businessType,
        businessName: dto.businessName ?? null,
        taxNumber: dto.taxNumber ?? null,
        iban: dto.iban ?? null,
        productDescription: dto.productDescription,
        appliedFrom: dto.appliedFrom,
      })
      .returning({ id: storeSellers.id });
    return { id: row!.id };
  }

  async listSellers(params: { status?: string } = {}) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(storeSellers.status, params.status as 'pending' | 'approved' | 'rejected' | 'suspended'));
    }
    return this.db
      .select()
      .from(storeSellers)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storeSellers.createdAt));
  }

  async getSeller(id: string) {
    const row = await this.db.query.storeSellers.findFirst({ where: eq(storeSellers.id, id) });
    if (!row) throw new NotFoundException('Satıcı bulunamadı.');
    return row;
  }

  async getSellerByUserId(userId: string) {
    return this.db.query.storeSellers.findFirst({
      where: and(eq(storeSellers.userId, userId), eq(storeSellers.status, 'approved')),
    });
  }

  async reviewSeller(
    id: string,
    adminId: string,
    status: 'approved' | 'rejected' | 'suspended',
    dto: { adminNotes?: string; commissionRate?: number; iyzicоSubMerchantKey?: string },
  ) {
    const setValues: Record<string, unknown> = {
      status,
      adminNotes: dto.adminNotes ?? null,
      updatedAt: new Date(),
    };
    if (status === 'approved') {
      setValues.approvedAt = new Date();
      setValues.approvedBy = adminId;
      if (dto.commissionRate !== undefined) setValues.commissionRate = String(dto.commissionRate);
      if (dto.iyzicоSubMerchantKey) setValues.iyzicоSubMerchantKey = dto.iyzicоSubMerchantKey;
    }
    const [row] = await this.db
      .update(storeSellers)
      .set(setValues as Parameters<typeof this.db.update>[0] extends never ? never : object)
      .where(eq(storeSellers.id, id))
      .returning();
    if (!row) throw new NotFoundException('Satıcı bulunamadı.');

    if (status === 'approved') {
      void this.emailService.sendStoreSellerApproved(row.email, row.applicantName, `${MUTFAK_URL}/magazam`).catch(() => undefined);
    } else if (status === 'rejected') {
      void this.emailService.sendStoreSellerRejected(row.email, row.applicantName, dto.adminNotes).catch(() => undefined);
    }

    return row;
  }

  async updateSeller(id: string, dto: {
    commissionRate?: number;
    iyzicоSubMerchantKey?: string;
    iban?: string;
    adminNotes?: string;
  }) {
    const setValues: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.commissionRate !== undefined) setValues.commissionRate = String(dto.commissionRate);
    if (dto.iyzicоSubMerchantKey !== undefined) setValues.iyzicоSubMerchantKey = dto.iyzicоSubMerchantKey;
    if (dto.iban !== undefined) setValues.iban = dto.iban;
    if (dto.adminNotes !== undefined) setValues.adminNotes = dto.adminNotes;

    const [row] = await this.db
      .update(storeSellers)
      .set(setValues as Parameters<typeof this.db.update>[0] extends never ? never : object)
      .where(eq(storeSellers.id, id))
      .returning();
    if (!row) throw new NotFoundException('Satıcı bulunamadı.');
    return row;
  }

  // ─── Varyant Bazlı Stok ────────────────────────────────────────────────────

  private variantKey(variants: Record<string, string>): string {
    return Object.keys(variants).sort().map(k => `${k}:${variants[k]}`).join('|');
  }

  async getVariantStocks(productId: string): Promise<Record<string, number>> {
    const rows = await this.db.select().from(storeVariantStocks).where(eq(storeVariantStocks.productId, productId));
    return Object.fromEntries(rows.map(r => [r.variantKey, r.stock]));
  }

  async setVariantStock(productId: string, variants: Record<string, string>, stock: number) {
    const key = this.variantKey(variants);
    await this.db.insert(storeVariantStocks)
      .values({ productId, variantKey: key, stock })
      .onConflictDoUpdate({ target: [storeVariantStocks.productId, storeVariantStocks.variantKey], set: { stock, updatedAt: new Date() } });
    return { productId, variantKey: key, stock };
  }

  async setAllVariantStocks(productId: string, stocks: Array<{ variants: Record<string, string>; stock: number }>) {
    for (const s of stocks) {
      await this.setVariantStock(productId, s.variants, s.stock);
    }
    return this.getVariantStocks(productId);
  }

  private async checkAndDeductVariantStock(productId: string, selectedVariants: Record<string, string>, quantity: number): Promise<boolean> {
    if (!Object.keys(selectedVariants).length) return true;
    const key = this.variantKey(selectedVariants);
    const row = await this.db.query.storeVariantStocks.findFirst({
      where: and(eq(storeVariantStocks.productId, productId), eq(storeVariantStocks.variantKey, key)),
    });
    if (!row || row.stock < quantity) return false;
    await this.db.update(storeVariantStocks)
      .set({ stock: row.stock - quantity, updatedAt: new Date() })
      .where(eq(storeVariantStocks.id, row.id));
    return true;
  }

  // ─── Ürünler ──────────────────────────────────────────────────────────────────

  async listProducts(params: { type?: string; ownerType?: string; status?: string; limit?: number; offset?: number; collectionSlug?: string; search?: string } = {}) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(storeProducts.status, params.status as 'draft' | 'active' | 'paused' | 'archived'));
    } else {
      conditions.push(eq(storeProducts.status, 'active'));
    }
    if (params.type) conditions.push(eq(storeProducts.type, params.type as 'digital' | 'physical' | 'app'));
    if (params.ownerType) conditions.push(eq(storeProducts.ownerType, params.ownerType as 'vakif' | 'seller'));
    if (params.search) {
      const term = `%${params.search}%`;
      conditions.push(
        or(
          ilike(storeProducts.title, term),
          ilike(storeProducts.description, term),
          ilike(storeProducts.subtitle, term),
        )!,
      );
    }
    if (params.collectionSlug) {
      const col = await this.db.query.storeCollections.findFirst({ where: eq(storeCollections.slug, params.collectionSlug) });
      if (col?.productIds?.length) {
        conditions.push(inArray(storeProducts.id, col.productIds));
      } else {
        return { data: [], total: 0, hasMore: false };
      }
    }

    const PAGE = params.limit ?? 24;
    const OFFSET = params.offset ?? 0;

    const [rows, countResult] = await Promise.all([
      this.db.select().from(storeProducts)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(storeProducts.sortOrder, desc(storeProducts.createdAt))
        .limit(PAGE)
        .offset(OFFSET),
      this.db.select({ count: storeProducts.id }).from(storeProducts)
        .where(conditions.length ? and(...conditions) : undefined),
    ]);

    const total = countResult.length;
    return { data: rows, total, hasMore: OFFSET + PAGE < total };
  }

  // ─── Koleksiyonlar ────────────────────────────────────────────────────────────

  async listCollections(onlyActive = true) {
    const conditions: SQL[] = [];
    if (onlyActive) conditions.push(eq(storeCollections.isActive, true));
    return this.db
      .select()
      .from(storeCollections)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(storeCollections.sortOrder, desc(storeCollections.createdAt));
  }

  async getCollection(slug: string) {
    const col = await this.db.query.storeCollections.findFirst({ where: eq(storeCollections.slug, slug) });
    if (!col) throw new NotFoundException('Koleksiyon bulunamadı.');
    return col;
  }

  async createCollection(dto: { slug: string; title: string; description?: string; coverImage?: string; productIds?: string[]; sortOrder?: number }) {
    const existing = await this.db.query.storeCollections.findFirst({ where: eq(storeCollections.slug, dto.slug) });
    if (existing) throw new BadRequestException('Bu slug zaten kullanılıyor.');
    const [row] = await this.db.insert(storeCollections).values({
      slug: dto.slug, title: dto.title,
      description: dto.description ?? null,
      coverImage: dto.coverImage ?? null,
      productIds: dto.productIds ?? [],
      sortOrder: dto.sortOrder ?? 0,
    }).returning({ id: storeCollections.id });
    return { id: row!.id };
  }

  async updateCollection(id: string, dto: Partial<{ title: string; description: string; coverImage: string; productIds: string[]; isActive: boolean; sortOrder: number }>) {
    const [row] = await this.db.update(storeCollections)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(storeCollections.id, id))
      .returning();
    if (!row) throw new NotFoundException('Koleksiyon bulunamadı.');
    return row;
  }

  async deleteCollection(id: string) {
    await this.db.delete(storeCollections).where(eq(storeCollections.id, id));
    return { deleted: true };
  }

  async getProductBySlug(slug: string) {
    const row = await this.db.query.storeProducts.findFirst({ where: eq(storeProducts.slug, slug) });
    if (!row) throw new NotFoundException('Ürün bulunamadı.');
    return row;
  }

  async getProduct(id: string) {
    const row = await this.db.query.storeProducts.findFirst({ where: eq(storeProducts.id, id) });
    if (!row) throw new NotFoundException('Ürün bulunamadı.');
    return row;
  }

  async createProduct(dto: {
    slug: string;
    ownerType: 'vakif' | 'seller';
    sellerId?: string;
    title: string;
    subtitle?: string;
    description: string;
    type: 'digital' | 'physical' | 'app';
    price: number;
    memberPrice?: number;
    images?: string[];
    downloadUrl?: string;
    stock?: number;
    tags?: string[];
    badgeLabel?: string;
    badgeColor?: string;
    status?: 'draft' | 'active' | 'paused' | 'archived';
    sortOrder?: number;
  }) {
    const existing = await this.db.query.storeProducts.findFirst({ where: eq(storeProducts.slug, dto.slug) });
    if (existing) throw new BadRequestException('Bu slug zaten kullanılıyor.');

    const [row] = await this.db
      .insert(storeProducts)
      .values({
        slug: dto.slug,
        ownerType: dto.ownerType,
        sellerId: dto.sellerId ?? null,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        description: dto.description,
        type: dto.type,
        price: dto.price,
        memberPrice: dto.memberPrice ?? null,
        images: dto.images ?? [],
        downloadUrl: dto.downloadUrl ?? null,
        stock: dto.stock ?? null,
        tags: dto.tags ?? [],
        badgeLabel: dto.badgeLabel ?? null,
        badgeColor: dto.badgeColor ?? null,
        status: dto.status ?? 'active',
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning({ id: storeProducts.id });
    return { id: row!.id };
  }

  async updateProduct(id: string, dto: Partial<{
    title: string; subtitle: string; description: string;
    price: number; memberPrice: number | null;
    images: string[]; downloadUrl: string | null;
    stock: number | null; tags: string[];
    badgeLabel: string | null; badgeColor: string | null;
    status: 'draft' | 'active' | 'paused' | 'archived';
    sortOrder: number;
  }>) {
    const [row] = await this.db
      .update(storeProducts)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(storeProducts.id, id))
      .returning();
    if (!row) throw new NotFoundException('Ürün bulunamadı.');
    return row;
  }

  async deleteProduct(id: string) {
    await this.db.delete(storeProducts).where(eq(storeProducts.id, id));
    return { deleted: true };
  }

  async listSellerProducts(sellerId: string) {
    return this.db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.sellerId, sellerId))
      .orderBy(storeProducts.sortOrder, desc(storeProducts.createdAt));
  }

  // ─── Siparişler ───────────────────────────────────────────────────────────────

  async createOrder(dto: {
    buyerId?: string;
    buyerName: string;
    buyerEmail: string;
    shippingAddress?: object;
    items: Array<{
      productId: string;
      quantity: number;
      selectedVariants?: Record<string, string>;
    }>;
    notes?: string;
    couponCode?: string;
  }) {
    const productIds = dto.items.map(i => i.productId);
    const products = await this.db
      .select()
      .from(storeProducts)
      .where(and(eq(storeProducts.status, 'active')));

    const productMap = new Map(products.map(p => [p.id, p]));

    for (const item of dto.items) {
      const p = productMap.get(item.productId);
      if (!p) throw new BadRequestException(`Ürün bulunamadı: ${item.productId}`);
      if (p.stock !== null && p.stock < item.quantity) {
        throw new BadRequestException(`${p.title} için yeterli stok yok.`);
      }
      if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
        const key = this.variantKey(item.selectedVariants);
        const variantStock = await this.db.query.storeVariantStocks.findFirst({
          where: and(eq(storeVariantStocks.productId, item.productId), eq(storeVariantStocks.variantKey, key)),
        });
        if (variantStock && variantStock.stock < item.quantity) {
          throw new BadRequestException(`${p.title} (${key}) için yeterli stok yok.`);
        }
      }
    }

    const orderItems = dto.items.map(item => {
      const p = productMap.get(item.productId)!;
      const seller = p.ownerType === 'seller' && p.sellerId ? p.sellerId : null;
      const unitPrice = p.price * item.quantity;
      return { product: p, sellerId: seller, quantity: item.quantity, unitPrice, selectedVariants: item.selectedVariants ?? {} };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.unitPrice, 0);

    let discountAmount = 0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const coupon = await this.validateCoupon(dto.couponCode, subtotal);
      if (coupon.valid && coupon.couponId && coupon.discountAmount) {
        discountAmount = coupon.discountAmount;
        couponId = coupon.couponId;
        await this.db.update(storeCoupons)
          .set({ usedCount: (await this.db.query.storeCoupons.findFirst({ where: eq(storeCoupons.id, couponId) }))!.usedCount + 1, updatedAt: new Date() })
          .where(eq(storeCoupons.id, couponId));
      }
    }

    const total = subtotal - discountAmount;

    const [order] = await this.db
      .insert(storeOrders)
      .values({
        buyerId: dto.buyerId ?? null,
        buyerName: dto.buyerName,
        buyerEmail: dto.buyerEmail,
        shippingAddress: dto.shippingAddress ?? null,
        subtotal,
        discountAmount,
        total,
        ...(couponId ? { couponId } : {}),
        notes: dto.notes ?? null,
      })
      .returning({ id: storeOrders.id });

    const orderId = order!.id;

    const autoReleaseDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const itemRows = orderItems.map(i => {
      const isSeller = i.product.ownerType === 'seller' && !!i.sellerId;
      return {
        orderId,
        productId: i.product.id,
        productSnapshot: {
          title: i.product.title,
          price: i.product.price,
          type: i.product.type,
          ownerType: i.product.ownerType,
          downloadUrl: i.product.downloadUrl,
        },
        sellerId: i.sellerId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        commissionAmount: 0,
        sellerAmount: 0,
        payoutStatus: (isSeller ? 'held' : 'released') as 'held' | 'released',
        autoReleaseAt: isSeller ? autoReleaseDate : null,
      };
    });

    await this.db.insert(storeOrderItems).values(itemRows);

    // Fiziksel ürünlerde stok düş
    for (const item of orderItems) {
      if (item.product.type === 'physical' && item.product.stock !== null) {
        await this.db.update(storeProducts)
          .set({ stock: Math.max(0, (item.product.stock ?? 0) - item.quantity), updatedAt: new Date() })
          .where(eq(storeProducts.id, item.product.id));
      }
      // Varyant bazlı stok düş
      if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
        await this.checkAndDeductVariantStock(item.product.id, item.selectedVariants, item.quantity);
      }
    }

    // Sipariş onay e-postası (fire-and-forget)
    const hasPhysical = orderItems.some(i => i.product.type === 'physical');
    const itemsLabel = orderItems.map(i => `${i.product.title} ×${i.quantity}`).join(', ');
    void this.emailService.sendStoreOrderConfirmed(dto.buyerEmail, {
      buyerName: dto.buyerName,
      orderId,
      total: `${(total / 100).toFixed(2)} TL`,
      items: itemsLabel,
      hasPhysical,
      orderUrl: `${SAHNE_URL}/magaza/siparislerim?orderId=${orderId}&email=${encodeURIComponent(dto.buyerEmail)}`,
    }).catch(() => undefined);

    return { id: orderId, subtotal, discountAmount, total };
  }

  async listOrders(params: { status?: string; paymentStatus?: string; limit?: number } = {}) {
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(storeOrders.status, params.status as 'pending' | 'processing' | 'partially_shipped' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'));
    if (params.paymentStatus) conditions.push(eq(storeOrders.paymentStatus, params.paymentStatus as 'pending' | 'paid' | 'failed' | 'refunded'));

    return this.db
      .select()
      .from(storeOrders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storeOrders.createdAt))
      .limit(params.limit ?? 50);
  }

  async getOrder(id: string) {
    const order = await this.db.query.storeOrders.findFirst({
      where: eq(storeOrders.id, id),
      with: { items: true },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');
    return order;
  }

  async getSellerOrders(sellerId: string) {
    const items = await this.db
      .select()
      .from(storeOrderItems)
      .where(eq(storeOrderItems.sellerId, sellerId))
      .orderBy(desc(storeOrderItems.createdAt));
    return items;
  }

  async updateOrderStatus(id: string, status: 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded') {
    const [row] = await this.db
      .update(storeOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(storeOrders.id, id))
      .returning({ id: storeOrders.id });
    if (!row) throw new NotFoundException('Sipariş bulunamadı.');

    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, id) });
    if (order) {
      const orderUrl = `${SAHNE_URL}/magaza/siparislerim?orderId=${id}&email=${encodeURIComponent(order.buyerEmail)}`;
      if (status === 'processing') {
        void this.emailService.send(order.buyerEmail, 'store_order_processing', {
          buyerName: order.buyerName, orderId: id, orderUrl,
        }).catch(() => undefined);
      } else if (status === 'delivered') {
        void this.emailService.send(order.buyerEmail, 'store_order_delivered', {
          buyerName: order.buyerName, orderId: id, orderUrl,
        }).catch(() => undefined);
        // Teslimat 3 gün sonra yorum isteği
        void this.emailService.send(order.buyerEmail, 'store_review_request', {
          buyerName: order.buyerName, orderId: id, reviewUrl: `${SAHNE_URL}/magaza/siparislerim?orderId=${id}&email=${encodeURIComponent(order.buyerEmail)}`,
        }, { delay: 3 * 24 * 60 * 60 * 1000 }).catch(() => undefined);
      } else if (status === 'cancelled') {
        void this.emailService.send(order.buyerEmail, 'store_order_cancelled', {
          buyerName: order.buyerName, orderId: id, orderUrl,
        }).catch(() => undefined);
      }
    }

    return row;
  }

  async updateOrderPayment(id: string, dto: {
    paymentStatus: 'paid' | 'failed' | 'refunded';
    iyzicоConversationId?: string;
    iyzicоPaymentId?: string;
  }) {
    const [row] = await this.db
      .update(storeOrders)
      .set({
        paymentStatus: dto.paymentStatus,
        iyzicоConversationId: dto.iyzicоConversationId ?? null,
        iyzicоPaymentId: dto.iyzicоPaymentId ?? null,
        status: dto.paymentStatus === 'paid' ? 'processing' : dto.paymentStatus === 'failed' ? 'cancelled' : 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(storeOrders.id, id))
      .returning({ id: storeOrders.id });
    if (!row) throw new NotFoundException('Sipariş bulunamadı.');

    if (dto.paymentStatus === 'paid') {
      const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, id), with: { items: true } });
      if (order) {
        // Dijital ürünler için signed download linki e-postası
        const digitalItems = (order.items ?? []).filter(i => {
          const snap = i.productSnapshot as { type: string; downloadUrl?: string };
          return snap.type === 'digital' && snap.downloadUrl;
        });
        for (const item of digitalItems) {
          const snap = item.productSnapshot as { title: string; downloadUrl: string };
          const token = this.generateDownloadToken(item.id);
          const signedUrl = `${SAHNE_URL}/magaza/download/${token}`;
          void this.emailService.send(order.buyerEmail, 'store_digital_download', {
            buyerName: order.buyerName,
            productTitle: snap.title,
            downloadUrl: signedUrl,
            orderUrl: `${SAHNE_URL}/magaza/siparislerim?orderId=${order.id}&email=${encodeURIComponent(order.buyerEmail)}`,
          }).catch(() => undefined);
        }

        // E-fatura oluştur (fire-and-forget)
        void this.createInvoiceForOrder(order).catch(() => undefined);

        // Loyalty puan kazandır
        if (order.buyerId) {
          void this.earnLoyaltyPoints(order.buyerId, id, order.total).catch(() => undefined);
        }
      }
    }

    return row;
  }

  async updateItemShipping(itemId: string, dto: {
    shippingStatus: 'preparing' | 'shipped' | 'delivered';
    trackingNumber?: string;
    trackingCompany?: string;
  }) {
    const setValues: Record<string, unknown> = { shippingStatus: dto.shippingStatus };
    if (dto.trackingNumber) setValues.trackingNumber = dto.trackingNumber;
    if (dto.trackingCompany) setValues.trackingCompany = dto.trackingCompany;
    if (dto.shippingStatus === 'shipped') setValues.shippedAt = new Date();
    if (dto.shippingStatus === 'delivered') setValues.deliveredAt = new Date();

    const [row] = await this.db
      .update(storeOrderItems)
      .set(setValues as Parameters<typeof this.db.update>[0] extends never ? never : object)
      .where(eq(storeOrderItems.id, itemId))
      .returning({ id: storeOrderItems.id, orderId: storeOrderItems.orderId });
    if (!row) throw new NotFoundException('Sipariş kalemi bulunamadı.');

    // Kargoya verildi ise alıcıya e-posta gönder
    if (dto.shippingStatus === 'shipped') {
      const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, row.orderId) });
      const item = await this.db.query.storeOrderItems.findFirst({ where: eq(storeOrderItems.id, itemId) });
      if (order && item) {
        const snap = item.productSnapshot as { title: string };
        void this.emailService.sendStoreOrderShipped(order.buyerEmail, {
          buyerName: order.buyerName,
          productTitle: snap.title ?? 'Ürününüz',
          ...(dto.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
          ...(dto.trackingCompany ? { trackingCompany: dto.trackingCompany } : {}),
          orderUrl: `${SAHNE_URL}/magaza/siparislerim?orderId=${order.id}&email=${encodeURIComponent(order.buyerEmail)}`,
        }).catch(() => undefined);
      }
    }

    return row;
  }

  // ─── Loyalty Puanları ────────────────────────────────────────────────────────

  // Her 1 TL harcama = 1 puan; 100 puan = 1 TL indirim
  private readonly POINTS_PER_TL = 1;
  private readonly POINTS_TO_TL = 100;

  async getLoyaltyBalance(userId: string): Promise<number> {
    const rows = await this.db.select().from(storeLoyaltyPoints).where(eq(storeLoyaltyPoints.userId, userId));
    return rows.reduce((s, r) => s + r.points, 0);
  }

  async earnLoyaltyPoints(userId: string, orderId: string, orderTotalKurus: number) {
    const earned = Math.floor((orderTotalKurus / 100) * this.POINTS_PER_TL);
    if (!earned) return { earned: 0 };

    const current = await this.getLoyaltyBalance(userId);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 yıl

    await this.db.insert(storeLoyaltyPoints).values({
      userId, orderId,
      type: 'earn',
      points: earned,
      balanceAfter: current + earned,
      description: `Sipariş #${orderId.slice(-8).toUpperCase()} — ${earned} puan kazanıldı`,
      expiresAt,
    });

    return { earned, newBalance: current + earned };
  }

  async redeemLoyaltyPoints(userId: string, points: number): Promise<{ discountKurus: number }> {
    const balance = await this.getLoyaltyBalance(userId);
    if (balance < points) throw new BadRequestException(`Yetersiz puan. Bakiye: ${balance}`);

    const discountKurus = Math.floor((points / this.POINTS_TO_TL) * 100);
    await this.db.insert(storeLoyaltyPoints).values({
      userId,
      type: 'redeem',
      points: -points,
      balanceAfter: balance - points,
      description: `${points} puan kullanıldı — ${(discountKurus / 100).toFixed(2)} TL indirim`,
    });

    return { discountKurus };
  }

  async getLoyaltyHistory(userId: string, limit = 20) {
    return this.db.select().from(storeLoyaltyPoints)
      .where(eq(storeLoyaltyPoints.userId, userId))
      .orderBy(desc(storeLoyaltyPoints.createdAt))
      .limit(limit);
  }

  async adjustLoyaltyPoints(userId: string, points: number, description: string) {
    const current = await this.getLoyaltyBalance(userId);
    await this.db.insert(storeLoyaltyPoints).values({
      userId, type: 'adjust', points, balanceAfter: current + points, description,
    });
    return { newBalance: current + points };
  }

  // ─── Signed Download Token ────────────────────────────────────────────────────

  private generateDownloadToken(itemId: string): string {
    const { createHmac } = require('crypto') as typeof import('crypto');
    const secret = process.env['DOWNLOAD_TOKEN_SECRET'] ?? 'download-secret-key';
    const expires = Math.floor(Date.now() / 1000) + 48 * 3600; // 48 saat
    const payload = `${itemId}:${expires}`;
    const sig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
    return Buffer.from(`${payload}:${sig}`).toString('base64url');
  }

  verifyDownloadToken(token: string): { itemId: string } | null {
    try {
      const { createHmac } = require('crypto') as typeof import('crypto');
      const secret = process.env['DOWNLOAD_TOKEN_SECRET'] ?? 'download-secret-key';
      const decoded = Buffer.from(token, 'base64url').toString();
      const parts = decoded.split(':');
      if (parts.length !== 3) return null;
      const [itemId, expiresStr, sig] = parts;
      const expires = parseInt(expiresStr!, 10);
      if (Date.now() / 1000 > expires) return null;
      const payload = `${itemId}:${expires}`;
      const expected = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
      if (sig !== expected) return null;
      return { itemId: itemId! };
    } catch { return null; }
  }

  async resolveDownload(token: string) {
    const parsed = this.verifyDownloadToken(token);
    if (!parsed) throw new BadRequestException('Geçersiz veya süresi dolmuş indirme bağlantısı.');

    const item = await this.db.query.storeOrderItems.findFirst({ where: eq(storeOrderItems.id, parsed.itemId) });
    if (!item) throw new NotFoundException('Sipariş kalemi bulunamadı.');

    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, item.orderId) });
    if (!order || order.paymentStatus !== 'paid') throw new BadRequestException('Ödeme doğrulanmamış.');

    const snap = item.productSnapshot as { type: string; downloadUrl?: string };
    if (snap.type !== 'digital' || !snap.downloadUrl) throw new BadRequestException('Bu ürün dijital indirilebilir değil.');

    return { downloadUrl: snap.downloadUrl };
  }

  // ─── E-Fatura / E-Arşiv ───────────────────────────────────────────────────────

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 900000) + 100000;
    return `HAR${year}${rand}`;
  }

  async createInvoiceForOrder(order: { id: string; buyerName: string; buyerEmail: string; total: number; items?: { productSnapshot: unknown; quantity: number; unitPrice: number }[] }) {
    const existing = await this.db.query.storeInvoices.findFirst({ where: eq(storeInvoices.orderId, order.id) });
    if (existing) return existing;

    const VAT_RATE = 0.20;
    const items = order.items ?? [];
    const lines = items.map(i => {
      const snap = i.productSnapshot as { title: string };
      const unitWithoutVat = Math.round(i.unitPrice / (1 + VAT_RATE));
      const vatAmount = i.unitPrice - unitWithoutVat;
      return {
        description: snap.title,
        quantity: i.quantity,
        unitPrice: unitWithoutVat,
        vatRate: 20,
        total: i.unitPrice,
        vatAmount,
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const vatAmount = lines.reduce((s, l) => s + l.vatAmount * l.quantity, 0);

    const [invoice] = await this.db.insert(storeInvoices).values({
      orderId: order.id,
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceType: 'e_arsiv',
      status: 'draft',
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      lines,
      subtotal,
      vatAmount,
      total: order.total,
    }).returning();

    // Webhook ile dış e-fatura sağlayıcısına gönder
    void this.sendInvoiceWebhook(invoice!).catch(() => undefined);

    return invoice!;
  }

  private async sendInvoiceWebhook(invoice: { id: string; invoiceNumber: string; [key: string]: unknown }) {
    const webhookUrl = process.env['EFATURA_WEBHOOK_URL'];
    if (!webhookUrl) return;

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invoice-Secret': process.env['EFATURA_WEBHOOK_SECRET'] ?? '' },
        body: JSON.stringify(invoice),
      });
      const status = res.ok ? 'sent' : 'failed';
      await this.db.update(storeInvoices)
        .set({ status, webhookSentAt: new Date(), providerResponse: await res.json().catch(() => null), updatedAt: new Date() })
        .where(eq(storeInvoices.id, invoice.id));
    } catch {
      await this.db.update(storeInvoices).set({ status: 'failed', updatedAt: new Date() }).where(eq(storeInvoices.id, invoice.id));
    }
  }

  async listInvoices(params: { status?: string; limit?: number; offset?: number } = {}) {
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(storeInvoices.status, params.status as 'draft' | 'sent' | 'failed' | 'cancelled'));
    return this.db.select().from(storeInvoices)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storeInvoices.createdAt))
      .limit(params.limit ?? 50)
      .offset(params.offset ?? 0);
  }

  async retryInvoiceWebhook(invoiceId: string) {
    const invoice = await this.db.query.storeInvoices.findFirst({ where: eq(storeInvoices.id, invoiceId) });
    if (!invoice) throw new NotFoundException('Fatura bulunamadı.');
    await this.sendInvoiceWebhook(invoice);
    return invoice;
  }

  // ─── Escrow: Alıcı Teslim Onayı ──────────────────────────────────────────────

  async confirmDelivery(itemId: string, buyerEmail: string) {
    const item = await this.db.query.storeOrderItems.findFirst({ where: eq(storeOrderItems.id, itemId) });
    if (!item) throw new NotFoundException('Sipariş kalemi bulunamadı.');

    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, item.orderId) });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');
    if (order.buyerEmail.toLowerCase() !== buyerEmail.toLowerCase()) {
      throw new BadRequestException('Bu sipariş size ait değil.');
    }
    if (item.payoutStatus === 'released') {
      return { alreadyReleased: true };
    }
    if (item.payoutStatus !== 'held') {
      throw new BadRequestException('Bu kalem için ödeme zaten işlendi.');
    }

    await this._releaseItem(item, order);
    return { released: true };
  }

  private async _releaseItem(
    item: { id: string; sellerId: string | null; unitPrice: number; orderId: string },
    order: { buyerEmail: string; buyerName: string },
  ) {
    let sellerAmount = 0;
    let commissionAmount = 0;

    if (item.sellerId) {
      const seller = await this.db.query.storeSellers.findFirst({ where: eq(storeSellers.id, item.sellerId) });
      const rate = seller?.commissionRate ? parseFloat(seller.commissionRate) : 0.1;
      commissionAmount = Math.round(item.unitPrice * rate);
      sellerAmount = item.unitPrice - commissionAmount;
    }

    await this.db
      .update(storeOrderItems)
      .set({
        payoutStatus: 'released',
        buyerConfirmedAt: new Date(),
        sellerAmount,
        commissionAmount,
      })
      .where(eq(storeOrderItems.id, item.id));

    if (item.sellerId) {
      const seller = await this.db.query.storeSellers.findFirst({ where: eq(storeSellers.id, item.sellerId) });
      if (seller) {
        void this.emailService.send(seller.email, 'store_payout_released', {
          sellerName: seller.applicantName,
          amount: `${(sellerAmount / 100).toFixed(2)} TL`,
          orderUrl: `${SAHNE_URL}/magaza/siparislerim?orderId=${item.orderId}&email=${encodeURIComponent(order.buyerEmail)}`,
        }).catch(() => undefined);
      }
    }
  }

  // ─── Escrow: Süresi Dolan Otomatik Serbest Bırakma (Cron) ────────────────────

  async releaseExpiredPayouts() {
    const now = new Date();
    const expiredItems = await this.db
      .select()
      .from(storeOrderItems)
      .where(
        and(
          eq(storeOrderItems.payoutStatus, 'held'),
          lt(storeOrderItems.autoReleaseAt, now),
        ),
      );

    let released = 0;
    for (const item of expiredItems) {
      const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, item.orderId) });
      if (!order) continue;
      await this._releaseItem(item, order);
      released++;
    }

    return { released };
  }

  // ─── Escrow: Admin Payout Yönetimi ───────────────────────────────────────────

  async listPayoutSummary() {
    const items = await this.db
      .select()
      .from(storeOrderItems)
      .where(and(eq(storeOrderItems.payoutStatus, 'released')));

    const sellerMap = new Map<string, { sellerId: string; releasedAmount: number; itemIds: string[] }>();
    for (const item of items) {
      if (!item.sellerId || item.sellerAmount === 0) continue;
      const prev = sellerMap.get(item.sellerId) ?? { sellerId: item.sellerId, releasedAmount: 0, itemIds: [] };
      prev.releasedAmount += item.sellerAmount;
      prev.itemIds.push(item.id);
      sellerMap.set(item.sellerId, prev);
    }

    const result = [];
    for (const entry of sellerMap.values()) {
      const seller = await this.db.query.storeSellers.findFirst({ where: eq(storeSellers.id, entry.sellerId) });
      if (!seller) continue;
      result.push({
        sellerId: entry.sellerId,
        sellerName: seller.applicantName,
        sellerEmail: seller.email,
        iban: seller.iban,
        releasedAmount: entry.releasedAmount,
        itemCount: entry.itemIds.length,
        itemIds: entry.itemIds,
      });
    }

    const payouts = await this.db.select().from(storeSellerPayouts).orderBy(desc(storeSellerPayouts.createdAt));
    return { summary: result, payouts };
  }

  async createSellerPayout(adminId: string, sellerId: string, itemIds: string[], adminNotes?: string) {
    if (!itemIds.length) throw new BadRequestException('Ödeme için en az bir kalem gerekli.');

    const items = await this.db
      .select()
      .from(storeOrderItems)
      .where(
        and(
          eq(storeOrderItems.sellerId, sellerId),
          eq(storeOrderItems.payoutStatus, 'released'),
          inArray(storeOrderItems.id, itemIds),
        ),
      );

    if (!items.length) throw new BadRequestException('Geçerli serbest kalem bulunamadı.');

    const totalAmount = items.reduce((s, i) => s + i.sellerAmount, 0);

    const [payout] = await this.db
      .insert(storeSellerPayouts)
      .values({ sellerId, totalAmount, itemIds, adminNotes: adminNotes ?? null })
      .returning({ id: storeSellerPayouts.id });

    await this.db
      .update(storeOrderItems)
      .set({ payoutStatus: 'cancelled' })
      .where(inArray(storeOrderItems.id, itemIds));

    return { id: payout!.id, totalAmount };
  }

  async markPayoutPaid(payoutId: string, adminId: string, adminNotes?: string) {
    const [row] = await this.db
      .update(storeSellerPayouts)
      .set({ status: 'paid', paidAt: new Date(), paidBy: adminId, ...(adminNotes ? { adminNotes } : {}), updatedAt: new Date() })
      .where(eq(storeSellerPayouts.id, payoutId))
      .returning();
    if (!row) throw new NotFoundException('Ödeme kaydı bulunamadı.');

    const seller = await this.db.query.storeSellers.findFirst({ where: eq(storeSellers.id, row.sellerId) });
    if (seller) {
      void this.emailService.send(seller.email, 'store_payout_paid', {
        sellerName: seller.applicantName,
        amount: `${(row.totalAmount / 100).toFixed(2)} TL`,
      }).catch(() => undefined);
    }

    return row;
  }

  async getSellerBalance(sellerId: string) {
    const [items, payouts] = await Promise.all([
      this.db.select().from(storeOrderItems).where(eq(storeOrderItems.sellerId, sellerId)),
      this.db.select().from(storeSellerPayouts).where(and(eq(storeSellerPayouts.sellerId, sellerId), eq(storeSellerPayouts.status, 'paid'))),
    ]);

    const held = items.filter(i => i.payoutStatus === 'held').reduce((s, i) => s + i.sellerAmount, 0);
    const released = items.filter(i => i.payoutStatus === 'released').reduce((s, i) => s + i.sellerAmount, 0);
    const totalPaid = payouts.reduce((s, p) => s + p.totalAmount, 0);

    return { held, released, totalPaid };
  }

  async listSellerPayouts(params: { status?: string } = {}) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(storeSellerPayouts.status, params.status as 'pending' | 'paid' | 'cancelled'));
    }
    return this.db
      .select()
      .from(storeSellerPayouts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storeSellerPayouts.createdAt));
  }

  // ─── iyzico Basket Builder ────────────────────────────────────────────────────

  async buildBasketItems(orderId: string) {
    const items = await this.db.select().from(storeOrderItems).where(eq(storeOrderItems.orderId, orderId));
    const results: Array<{
      id: string; name: string; price: string;
      itemType: 'PHYSICAL' | 'VIRTUAL';
      subMerchantKey?: string; subMerchantPrice?: string;
    }> = [];

    for (const item of items) {
      const snap = item.productSnapshot as { title: string; type: string; ownerType: string };
      let subMerchantKey: string | undefined;
      let subMerchantPrice: string | undefined;

      if (snap.ownerType === 'seller' && item.sellerId) {
        const seller = await this.db.query.storeSellers.findFirst({ where: eq(storeSellers.id, item.sellerId) });
        if (seller?.iyzicоSubMerchantKey) {
          subMerchantKey = seller.iyzicоSubMerchantKey;
          subMerchantPrice = (item.sellerAmount / 100).toFixed(2);
        }
      }

      const entry: { id: string; name: string; price: string; itemType: 'PHYSICAL' | 'VIRTUAL'; subMerchantKey?: string; subMerchantPrice?: string } = {
        id: item.id,
        name: snap.title.slice(0, 128),
        price: (item.unitPrice / 100).toFixed(2),
        itemType: snap.type === 'physical' ? 'PHYSICAL' : 'VIRTUAL',
      };
      if (subMerchantKey && subMerchantPrice) { entry.subMerchantKey = subMerchantKey; entry.subMerchantPrice = subMerchantPrice; }
      results.push(entry);
    }

    return results;
  }

  // ─── Satış Analitiği ──────────────────────────────────────────────────────────

  async getAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [orders, items] = await Promise.all([
      this.db.select().from(storeOrders).where(eq(storeOrders.paymentStatus, 'paid')),
      this.db.select().from(storeOrderItems),
    ]);

    const paidOrders = orders.filter(o => o.createdAt >= since);
    const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = paidOrders.length;
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

    // Günlük sipariş trendi
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    for (const order of paidOrders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const prev = dailyMap.get(day) ?? { orders: 0, revenue: 0 };
      dailyMap.set(day, { orders: prev.orders + 1, revenue: prev.revenue + order.total });
    }
    const dailyTrend = Array.from(dailyMap.entries()).map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day));

    // En çok satılan ürünler
    const productSales = new Map<string, { title: string; quantity: number; revenue: number }>();
    for (const item of items) {
      const snap = item.productSnapshot as { title: string };
      const key = item.productId ?? item.id;
      const prev = productSales.get(key) ?? { title: snap.title, quantity: 0, revenue: 0 };
      productSales.set(key, { title: snap.title, quantity: prev.quantity + item.quantity, revenue: prev.revenue + item.unitPrice });
    }
    const topProducts = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    return { totalRevenue, totalOrders, avgOrderValue, dailyTrend, topProducts, period: days };
  }

  // ─── İleri Analytics ─────────────────────────────────────────────────────────

  async getAdvancedAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const paidOrders = await this.db.select().from(storeOrders).where(eq(storeOrders.paymentStatus, 'paid'));

    // LTV hesabı: müşteri başına toplam harcama
    const customerSpend = new Map<string, number>();
    for (const o of paidOrders) {
      const key = o.buyerEmail;
      customerSpend.set(key, (customerSpend.get(key) ?? 0) + o.total);
    }
    const customerValues = Array.from(customerSpend.values());
    const avgLTV = customerValues.length ? Math.round(customerValues.reduce((a, b) => a + b, 0) / customerValues.length) : 0;
    const topCustomers = Array.from(customerSpend.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([email, total]) => ({ email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), total }));

    // Tekrar satın alma oranı
    const repeatBuyers = customerValues.filter(v => v > 0).length;
    const multiOrderBuyers = Array.from(customerSpend.entries()).filter(() => {
      const orders = paidOrders.filter(o => o.buyerEmail === '');
      return orders.length > 1;
    }).length;

    // Dönüşüm hunisi: sipariş oluşturuldu vs ödendi
    const allOrders = await this.db.select({ id: storeOrders.id, paymentStatus: storeOrders.paymentStatus })
      .from(storeOrders)
      .where(lt(storeOrders.createdAt, new Date()));
    const totalCreated = allOrders.length;
    const totalPaid = allOrders.filter(o => o.paymentStatus === 'paid').length;
    const conversionRate = totalCreated ? parseFloat(((totalPaid / totalCreated) * 100).toFixed(1)) : 0;

    // Dönem geliri
    const periodOrders = paidOrders.filter(o => o.createdAt >= since);
    const periodRevenue = periodOrders.reduce((s, o) => s + o.total, 0);

    // Günlük satış dağılımı (haftanın günü)
    const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const dayDist = new Array(7).fill(0) as number[];
    for (const o of periodOrders) {
      const d = o.createdAt.getDay();
      dayDist[d] = (dayDist[d] ?? 0) + 1;
    }
    const salesByDay = dayLabels.map((label, i) => ({ label, count: dayDist[i]! }));

    return {
      period: days,
      avgLTV,
      topCustomers,
      repeatBuyers,
      conversionRate,
      periodRevenue,
      totalOrders: periodOrders.length,
      salesByDay,
    };
  }

  // ─── Kupon ────────────────────────────────────────────────────────────────────

  async validateCoupon(code: string, orderAmount: number): Promise<{
    valid: boolean;
    couponId?: string;
    discountAmount?: number;
    finalAmount?: number;
    error?: string;
  }> {
    const coupon = await this.db.query.storeCoupons.findFirst({
      where: and(eq(storeCoupons.code, code.toUpperCase()), eq(storeCoupons.isActive, true)),
    });

    if (!coupon) return { valid: false, error: 'Kupon kodu geçersiz.' };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: 'Kupon süresi dolmuş.' };
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { valid: false, error: 'Kupon kullanım limiti dolmuş.' };
    if (orderAmount < coupon.minOrderAmount) {
      return { valid: false, error: `Bu kupon için minimum sipariş tutarı ${(coupon.minOrderAmount / 100).toFixed(2)} TL.` };
    }

    const discountAmount = coupon.discountType === 'percentage'
      ? Math.round(orderAmount * coupon.discountValue / 100)
      : Math.min(coupon.discountValue, orderAmount);

    return {
      valid: true,
      couponId: coupon.id,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    };
  }

  async listCoupons() {
    return this.db.select().from(storeCoupons).orderBy(desc(storeCoupons.createdAt));
  }

  async createCoupon(dto: {
    code: string; description?: string;
    discountType: 'percentage' | 'fixed'; discountValue: number;
    minOrderAmount?: number; maxUses?: number; expiresAt?: Date;
  }) {
    const [row] = await this.db.insert(storeCoupons).values({
      code: dto.code.toUpperCase(),
      description: dto.description ?? null,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount ?? 0,
      maxUses: dto.maxUses ?? null,
      expiresAt: dto.expiresAt ?? null,
    }).returning({ id: storeCoupons.id });
    return { id: row!.id };
  }

  async toggleCoupon(id: string, isActive: boolean) {
    await this.db.update(storeCoupons).set({ isActive, updatedAt: new Date() }).where(eq(storeCoupons.id, id));
    return { id, isActive };
  }

  async deleteCoupon(id: string) {
    await this.db.delete(storeCoupons).where(eq(storeCoupons.id, id));
    return { deleted: true };
  }

  // ─── Sipariş Sorgulama (Alıcı) ────────────────────────────────────────────────

  async lookupOrder(orderId: string, email: string) {
    const order = await this.db.query.storeOrders.findFirst({
      where: and(eq(storeOrders.id, orderId), eq(storeOrders.buyerEmail, email.toLowerCase())),
      with: { items: true },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı. Sipariş numarası ve e-posta adresinizi kontrol edin.');
    return order;
  }

  async getOrdersByBuyer(buyerId: string) {
    return this.db.select().from(storeOrders)
      .where(eq(storeOrders.buyerId, buyerId))
      .orderBy(desc(storeOrders.createdAt)).limit(20);
  }

  // ─── Ürün Yorumları ────────────────────────────────────────────────────────────

  async createReview(dto: { productId: string; orderId?: string; buyerId?: string; buyerName: string; buyerEmail: string; rating: number; comment?: string }) {
    const [row] = await this.db.insert(storeReviews).values({
      productId: dto.productId,
      orderId: dto.orderId ?? null,
      buyerId: dto.buyerId ?? null,
      buyerName: dto.buyerName,
      buyerEmail: dto.buyerEmail,
      rating: Math.max(1, Math.min(5, dto.rating)),
      comment: dto.comment ?? null,
    }).returning({ id: storeReviews.id });
    return { id: row!.id };
  }

  async listReviews(productId: string, onlyPublished = true) {
    const conds: SQL[] = [eq(storeReviews.productId, productId)];
    if (onlyPublished) conds.push(eq(storeReviews.isPublished, true));
    const rows = await this.db.select().from(storeReviews).where(and(...conds)).orderBy(desc(storeReviews.createdAt));
    const avgRating = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
    return { reviews: rows, avgRating: Math.round(avgRating * 10) / 10, count: rows.length };
  }

  async listAdminReviews(params: { isPublished?: boolean } = {}) {
    const conds: SQL[] = [];
    if (params.isPublished !== undefined) conds.push(eq(storeReviews.isPublished, params.isPublished));
    return this.db.select().from(storeReviews).where(conds.length ? and(...conds) : undefined).orderBy(desc(storeReviews.createdAt));
  }

  async publishReview(id: string, isPublished: boolean) {
    await this.db.update(storeReviews).set({ isPublished }).where(eq(storeReviews.id, id));
    return { id, isPublished };
  }

  async deleteReview(id: string) {
    await this.db.delete(storeReviews).where(eq(storeReviews.id, id));
    return { deleted: true };
  }

  // ─── Hediye Kartları ─────────────────────────────────────────────────────────

  async createGiftCard(dto: { purchasedByEmail: string; purchasedByUserId?: string; recipientEmail: string; recipientName: string; amount: number; message?: string; expiresAt?: Date }) {
    const code = `GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const [row] = await this.db.insert(storeGiftCards).values({
      code, originalAmount: dto.amount, balance: dto.amount,
      purchasedByEmail: dto.purchasedByEmail,
      purchasedByUserId: dto.purchasedByUserId ?? null,
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      message: dto.message ?? null,
      expiresAt: dto.expiresAt ?? null,
    }).returning({ id: storeGiftCards.id, code: storeGiftCards.code });

    // Alıcıya e-posta
    void this.emailService.send(dto.recipientEmail, 'store_gift_card', {
      recipientName: dto.recipientName,
      senderName: dto.purchasedByEmail,
      code: row!.code,
      amount: `${(dto.amount / 100).toFixed(2)} TL`,
      ...(dto.message ? { message: dto.message } : {}),
      shopUrl: `${SAHNE_URL}/magaza`,
    }).catch(() => undefined);

    return { id: row!.id, code: row!.code };
  }

  async validateGiftCard(code: string): Promise<{ valid: boolean; balance?: number; id?: string; error?: string }> {
    const card = await this.db.query.storeGiftCards.findFirst({ where: and(eq(storeGiftCards.code, code), eq(storeGiftCards.isActive, true)) });
    if (!card) return { valid: false, error: 'Hediye kartı geçersiz.' };
    if (card.expiresAt && card.expiresAt < new Date()) return { valid: false, error: 'Hediye kartının süresi dolmuş.' };
    if (card.balance <= 0) return { valid: false, error: 'Hediye kartı bakiyesi tükenmiş.' };
    return { valid: true, balance: card.balance, id: card.id };
  }

  async listGiftCards() {
    return this.db.select().from(storeGiftCards).orderBy(desc(storeGiftCards.createdAt));
  }

  // ─── Terk Edilen Sepet ────────────────────────────────────────────────────────

  async saveAbandonedCart(dto: { email: string; name?: string; cartSnapshot: object; orderId?: string }) {
    await this.db.insert(storeAbandonedCarts).values({
      email: dto.email,
      name: dto.name ?? null,
      cartSnapshot: dto.cartSnapshot,
      orderId: dto.orderId ?? null,
    });
  }

  async sendAbandonedCartReminders() {
    const now = new Date();

    // Sırası gelen sepetleri bul: nextReminderAt geçmişte veya null + dönüşmemiş
    const carts = await this.db.select().from(storeAbandonedCarts)
      .where(
        and(
          isNull(storeAbandonedCarts.convertedAt),
          or(
            isNull(storeAbandonedCarts.nextReminderAt),
            lte(storeAbandonedCarts.nextReminderAt, now),
          ),
          lt(storeAbandonedCarts.reminderStep, 3), // max 3 adım
        ),
      )
      .limit(100);

    // Adım 0 = henüz ilk reminder zamanı gelmemiş (1 saat bekleme)
    const STEP_DELAYS = [
      60 * 60 * 1000,       // T+1h → ilk e-posta
      24 * 60 * 60 * 1000,  // T+24h → ikinci
      72 * 60 * 60 * 1000,  // T+72h → son
    ];
    const STEP_TEMPLATES: Array<'store_abandoned_cart' | 'store_abandoned_cart_24h' | 'store_abandoned_cart_72h'> = [
      'store_abandoned_cart', 'store_abandoned_cart_24h', 'store_abandoned_cart_72h',
    ];

    let sent = 0;
    for (const cart of carts) {
      const step = cart.reminderStep;
      const createdAt = cart.createdAt;
      const minSendTime = new Date(createdAt.getTime() + STEP_DELAYS.slice(0, step + 1).reduce((a, b) => a + b, 0));

      if (now < minSendTime) continue;

      const items = (cart.cartSnapshot as Array<{ title: string; quantity: number }> ?? []);
      const itemsLabel = items.map(i => `${i.title} ×${i.quantity}`).join(', ');

      await this.emailService.send(cart.email, STEP_TEMPLATES[step]!, {
        buyerName: cart.name ?? 'Değerli Müşteri',
        items: itemsLabel,
        cartUrl: `${SAHNE_URL}/magaza`,
        step: step + 1,
      }).catch(() => undefined);

      const nextStep = step + 1;
      const nextDelay = STEP_DELAYS[nextStep];
      const nextReminderAt = nextDelay ? new Date(now.getTime() + nextDelay) : null;

      await this.db.update(storeAbandonedCarts).set({
        reminderStep: nextStep,
        reminderSentAt: now,
        nextReminderAt: nextReminderAt ?? now,
      }).where(eq(storeAbandonedCarts.id, cart.id));

      sent++;
    }
    return { sent };
  }

  // ─── EFT / Banka Transferi ────────────────────────────────────────────────────

  async initiateEftOrder(orderId: string) {
    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, orderId) });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');
    const iban = process.env['VAKIF_IBAN'] ?? 'TR00 0000 0000 0000 0000 0000 00';
    const bankName = process.env['VAKIF_BANK_NAME'] ?? 'Haritailesi Vakfı';
    await this.db.update(storeOrders).set({ notes: `EFT bekliyor: ${iban}`, updatedAt: new Date() }).where(eq(storeOrders.id, orderId));
    return { iban, bankName, amount: `${(order.total / 100).toFixed(2)} TL`, description: `SIP-${orderId.slice(-8).toUpperCase()}` };
  }

  // ─── Çoklu Mağaza ─────────────────────────────────────────────────────────────

  async listProductsBySource(source: 'sahne' | 'mutfak') {
    return this.db.select().from(storeProducts)
      .where(and(eq(storeProducts.status, 'active'), eq(storeProducts.ownerType, 'vakif')))
      .orderBy(storeProducts.sortOrder, desc(storeProducts.createdAt));
  }

  // ─── Email Pazarlama ──────────────────────────────────────────────────────────

  async sendStoreCampaign(dto: { subject: string; body: string; targetType: 'all_buyers' | 'product_buyers'; productId?: string }) {
    const orders = await this.db.select({ email: storeOrders.buyerEmail, name: storeOrders.buyerName })
      .from(storeOrders).where(eq(storeOrders.paymentStatus, 'paid'));
    const uniqueBuyers = new Map(orders.map(o => [o.email, o.name]));

    let sent = 0;
    for (const [email, name] of uniqueBuyers) {
      await this.emailService.send(email, 'admin_broadcast', {
        recipientName: name ?? 'Değerli Müşteri',
        subject: dto.subject,
        body: dto.body,
      }).catch(() => undefined);
      sent++;
    }
    return { sent };
  }

  // ─── İade Yönetimi ────────────────────────────────────────────────────────────

  async createReturn(dto: { orderId: string; orderItemId?: string; buyerId?: string; buyerEmail: string; reason: string }) {
    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, dto.orderId) });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');
    const [row] = await this.db.insert(storeReturns).values({
      orderId: dto.orderId,
      orderItemId: dto.orderItemId ?? null,
      buyerId: dto.buyerId ?? null,
      buyerEmail: dto.buyerEmail,
      reason: dto.reason,
    }).returning({ id: storeReturns.id });
    // Admin'e bildirim e-postası
    const adminEmail = process.env['ADMIN_EMAIL'] ?? 'admin@haritailesi.org';
    void this.emailService.send(adminEmail, 'admin_broadcast', {
      recipientName: 'Admin',
      subject: `Yeni iade talebi — Sipariş ${dto.orderId.slice(-8).toUpperCase()}`,
      body: `Müşteri: ${dto.buyerEmail}\nNeden: ${dto.reason}`,
    }).catch(() => undefined);
    return { id: row!.id };
  }

  async listReturns(params: { status?: string } = {}) {
    const conds: SQL[] = [];
    if (params.status) conds.push(eq(storeReturns.status, params.status as 'pending' | 'approved' | 'rejected' | 'completed'));
    return this.db.select().from(storeReturns).where(conds.length ? and(...conds) : undefined).orderBy(desc(storeReturns.createdAt));
  }

  async resolveReturn(
    id: string,
    status: 'approved' | 'rejected' | 'completed',
    dto: { adminNotes?: string; refundAmount?: number; restockItems?: boolean; processRefund?: boolean },
    iyzicoService?: { refundPayment: (account: 'sirket', params: { paymentTransactionId: string; price: string; conversationId: string }) => Promise<{ status: string; refundConversationId?: string; errorMessage?: string }> },
  ) {
    const ret = await this.db.query.storeReturns.findFirst({ where: eq(storeReturns.id, id) });
    if (!ret) throw new NotFoundException('İade talebi bulunamadı.');

    let iyzRefundResult: { status: string; errorMessage?: string } | null = null;

    // iyzico üzerinden otomatik iade
    if (status === 'completed' && dto.processRefund !== false && iyzicoService && ret.orderId) {
      const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, ret.orderId) });
      if (order?.iyzicоPaymentId) {
        const refundAmount = dto.refundAmount ?? order.total;
        iyzRefundResult = await iyzicoService.refundPayment('sirket', {
          paymentTransactionId: order.iyzicоPaymentId,
          price: (refundAmount / 100).toFixed(2),
          conversationId: `refund-${id}`,
        }).catch(e => ({ status: 'error', errorMessage: String(e) }));

        if (iyzRefundResult.status === 'success') {
          await this.updateOrderPayment(ret.orderId, { paymentStatus: 'refunded' });
        }
      }
    }

    await this.db.update(storeReturns).set({
      status,
      adminNotes: dto.adminNotes ?? null,
      refundAmount: dto.refundAmount ?? null,
      resolvedAt: new Date(),
      ...(dto.restockItems !== undefined ? { restockItems: dto.restockItems } : {}),
    }).where(eq(storeReturns.id, id));

    // Stok geri ekle
    if (status !== 'rejected' && dto.restockItems !== false && ret.orderItemId) {
      const item = await this.db.query.storeOrderItems.findFirst({ where: eq(storeOrderItems.id, ret.orderItemId) });
      if (item?.productId) {
        const product = await this.db.query.storeProducts.findFirst({ where: eq(storeProducts.id, item.productId) });
        if (product && product.stock !== null) {
          await this.db.update(storeProducts)
            .set({ stock: (product.stock ?? 0) + item.quantity, updatedAt: new Date() })
            .where(eq(storeProducts.id, item.productId));
        }
      }
    }

    void this.emailService.send(ret.buyerEmail, 'admin_broadcast', {
      recipientName: 'Müşteri',
      subject: status === 'approved' ? 'İade talebiniz onaylandı' : status === 'rejected' ? 'İade talebiniz reddedildi' : 'İade işleminiz tamamlandı',
      body: dto.adminNotes ?? '',
    }).catch(() => undefined);

    return { id, status, iyzRefundResult };
  }

  // ─── Favori Listesi ────────────────────────────────────────────────────────────

  async getWishlist(userId: string) {
    const items = await this.db.select().from(storeWishlist).where(eq(storeWishlist.userId, userId));
    if (!items.length) return { productIds: [] };
    const productIds = items.map(i => i.productId);
    return { productIds };
  }

  async toggleWishlist(userId: string, productId: string) {
    const existing = await this.db.query.storeWishlist.findFirst({
      where: and(eq(storeWishlist.userId, userId), eq(storeWishlist.productId, productId)),
    });
    if (existing) {
      await this.db.delete(storeWishlist).where(eq(storeWishlist.id, existing.id));
      return { added: false };
    }
    await this.db.insert(storeWishlist).values({ userId, productId });
    return { added: true };
  }

  // ─── Stok Bildirimi ───────────────────────────────────────────────────────────

  async subscribeStockNotification(productId: string, email: string) {
    const existing = await this.db.query.storeStockNotifications.findFirst({
      where: and(eq(storeStockNotifications.productId, productId), eq(storeStockNotifications.email, email)),
    });
    if (!existing) {
      await this.db.insert(storeStockNotifications).values({ productId, email });
    }
    return { subscribed: true };
  }

  async sendStockNotifications(productId: string) {
    const subscribers = await this.db.select().from(storeStockNotifications)
      .where(and(eq(storeStockNotifications.productId, productId), eq(storeStockNotifications.notifiedAt, null as unknown as Date)));
    const product = await this.db.query.storeProducts.findFirst({ where: eq(storeProducts.id, productId) });
    if (!product) return;
    for (const sub of subscribers) {
      void this.emailService.send(sub.email, 'store_stock_available', {
        buyerName: 'Değerli Müşteri',
        productTitle: product.title,
        productUrl: `${SAHNE_URL}/magaza/${product.slug}`,
      }).catch(() => undefined);
      await this.db.update(storeStockNotifications).set({ notifiedAt: new Date() }).where(eq(storeStockNotifications.id, sub.id));
    }
    return { notified: subscribers.length };
  }

  // ─── Kargo Servisi ────────────────────────────────────────────────────────────

  async calculateShipping(params: { weightGrams: number; city: string }): Promise<{ provider: string; cost: number; estimatedDays: number }[]> {
    const w = params.weightGrams;
    const desi = Math.ceil(w / 1000) || 1;
    // Basit desi tabanlı fiyat (Yurtiçi benzeri)
    const baseCost = desi <= 1 ? 2500 : desi <= 3 ? 3500 : desi <= 5 ? 4500 : desi <= 10 ? 6500 : 9000; // kuruş
    return [
      { provider: 'yurtici', cost: baseCost, estimatedDays: 2 },
      { provider: 'mng', cost: Math.round(baseCost * 0.95), estimatedDays: 3 },
      { provider: 'ptt', cost: Math.round(baseCost * 0.85), estimatedDays: 4 },
    ];
  }

  async createShipment(orderId: string, provider: 'yurtici' | 'mng' | 'ptt') {
    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, orderId) });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');

    const addr = order.shippingAddress as { fullName?: string; address?: string; city?: string; phone?: string } | null;
    const trackingNumber = `${provider.toUpperCase().slice(0, 3)}${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // Provider API çağrısı (gerçek entegrasyon için API key gerekli)
    let providerResponse: Record<string, unknown> = {};
    const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (apiKey && addr) {
      try {
        // Yurtiçi API example structure
        if (provider === 'yurtici') {
          const res = await fetch('https://ws.yurticikargo.com/v1/CreateBarcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${apiKey}` },
            body: JSON.stringify({
              invoiceKey: trackingNumber,
              senderName: 'Haritailesi Vakfı',
              receiverName: addr.fullName ?? order.buyerName,
              receiverAddress: addr.address ?? '',
              receiverCityName: addr.city ?? '',
              receiverPhone: addr.phone ?? '',
              weight: '1',
              cargoType: '1',
              barcode: trackingNumber,
            }),
          });
          providerResponse = await res.json() as Record<string, unknown>;
        }
      } catch { /* API mevcut değilse mock */ }
    }

    const [shipment] = await this.db.insert(storeShipments).values({
      orderId,
      provider,
      trackingNumber,
      trackingUrl: provider === 'yurtici'
        ? `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`
        : provider === 'mng'
          ? `https://www.mngkargo.com.tr/gonderi-sorgula?barkod=${trackingNumber}`
          : `https://www.ptt.gov.tr/Pages/GonderiBilgisi.aspx?q=${trackingNumber}`,
      providerResponse,
    }).returning({ id: storeShipments.id });

    return { id: shipment!.id, trackingNumber };
  }

  async getShipmentsByOrder(orderId: string) {
    return this.db.select().from(storeShipments).where(eq(storeShipments.orderId, orderId)).orderBy(desc(storeShipments.createdAt));
  }

  // ─── Abonelik Ürünleri ────────────────────────────────────────────────────────

  async createSubscription(dto: { productId: string; buyerId?: string; buyerEmail: string; buyerName: string; interval: 'monthly' | 'quarterly' | 'yearly'; priceKurus: number }) {
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + (dto.interval === 'monthly' ? 1 : dto.interval === 'quarterly' ? 3 : 12));

    const [row] = await this.db.insert(storeSubscriptions).values({
      productId: dto.productId,
      buyerId: dto.buyerId ?? null,
      buyerEmail: dto.buyerEmail,
      buyerName: dto.buyerName,
      interval: dto.interval,
      priceKurus: dto.priceKurus,
      nextBillingAt: nextBilling,
    }).returning({ id: storeSubscriptions.id });

    return { id: row!.id };
  }

  async listSubscriptions(params: { status?: string; buyerId?: string } = {}) {
    const conds: SQL[] = [];
    if (params.status) conds.push(eq(storeSubscriptions.status, params.status as 'active' | 'paused' | 'cancelled' | 'past_due'));
    if (params.buyerId) conds.push(eq(storeSubscriptions.buyerId, params.buyerId));
    return this.db.select().from(storeSubscriptions).where(conds.length ? and(...conds) : undefined).orderBy(desc(storeSubscriptions.createdAt));
  }

  async cancelSubscription(id: string) {
    await this.db.update(storeSubscriptions).set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() }).where(eq(storeSubscriptions.id, id));
    return { id, cancelled: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async processSubscriptionBilling(iyzicoService: any) {
    const now = new Date();
    const due = await this.db.select().from(storeSubscriptions)
      .where(
        and(
          eq(storeSubscriptions.status, 'active'),
          lte(storeSubscriptions.nextBillingAt, now),
        ),
      )
      .limit(50);

    let billed = 0;
    let failed = 0;

    for (const sub of due) {
      try {
        // Sipariş oluştur
        const orderId = await this.createOrder({
          ...(sub.buyerId ? { buyerId: sub.buyerId } : {}),
          buyerName: sub.buyerName,
          buyerEmail: sub.buyerEmail,
          items: sub.productId ? [{ productId: sub.productId, quantity: 1 }] : [],
        });

        // İyzico ile ödeme başlat (kayıtlı kart varsa otomatik, yoksa e-posta ile link gönder)
        if (sub.iyzicоSubscriptionReferenceCode) {
          // Kayıtlı müşteri referans kodu varsa iyzico recurring payment
          // Bu aşamada mock — gerçek iyzico recurring API entegrasyonu için sub merchant flow gerekli
          await this.updateOrderPayment(orderId.id, { paymentStatus: 'paid' });
          billed++;
        } else {
          // Kayıtlı kart yok — müşteriye ödeme linki gönder
          void this.emailService.send(sub.buyerEmail, 'store_order_confirmed', {
            buyerName: sub.buyerName,
            orderId: orderId.id,
            total: `${(sub.priceKurus / 100).toFixed(2)} TL`,
            items: 'Abonelik yenileme',
            hasPhysical: false,
            orderUrl: `${SAHNE_URL}/magaza/siparislerim?orderId=${orderId.id}&email=${encodeURIComponent(sub.buyerEmail)}`,
          }).catch(() => undefined);
          failed++;
        }

        // Sonraki fatura tarihini güncelle
        const next = new Date(now);
        if (sub.interval === 'monthly') next.setMonth(next.getMonth() + 1);
        else if (sub.interval === 'quarterly') next.setMonth(next.getMonth() + 3);
        else next.setFullYear(next.getFullYear() + 1);

        await this.db.update(storeSubscriptions)
          .set({ nextBillingAt: next, updatedAt: new Date() })
          .where(eq(storeSubscriptions.id, sub.id));

      } catch {
        // Ödeme başarısız — past_due'ya al
        await this.db.update(storeSubscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(storeSubscriptions.id, sub.id));
        failed++;
      }
    }

    return { billed, failed, total: due.length };
  }

  // ─── Satıcı Self-Servis Ürün Yönetimi ────────────────────────────────────────

  async sellerCreateProduct(sellerId: string, dto: Parameters<typeof this.createProduct>[0]) {
    // Satıcı sadece kendi ürününü oluşturabilir
    return this.createProduct({ ...dto, ownerType: 'seller', sellerId });
  }

  async sellerUpdateProduct(sellerId: string, productId: string, dto: Parameters<typeof this.updateProduct>[1]) {
    const p = await this.getProduct(productId);
    if (p.sellerId !== sellerId) throw new BadRequestException('Bu ürün size ait değil.');
    return this.updateProduct(productId, dto);
  }

  async sellerDeleteProduct(sellerId: string, productId: string) {
    const p = await this.getProduct(productId);
    if (p.sellerId !== sellerId) throw new BadRequestException('Bu ürün size ait değil.');
    return this.deleteProduct(productId);
  }

  // ─── Çoklu Mağaza ────────────────────────────────────────────────────────────

  async listProductsByStore(source: 'sahne' | 'mutfak') {
    return this.db.select().from(storeProducts)
      .where(and(
        eq(storeProducts.status, 'active'),
        // source = verilen değer VEYA source IS NULL (her iki mağazada da göster)
        `(source = '${source}' OR source IS NULL)` as unknown as SQL,
      ))
      .orderBy(storeProducts.sortOrder, desc(storeProducts.createdAt));
  }

  // ─── B2B Fiyatlandırma ────────────────────────────────────────────────────────

  async listPriceGroups() {
    return this.db.select().from(storeB2bPriceGroups).orderBy(storeB2bPriceGroups.name);
  }

  async createPriceGroup(name: string, discountPct: number) {
    const [row] = await this.db.insert(storeB2bPriceGroups).values({ name, discountPct }).returning({ id: storeB2bPriceGroups.id });
    return { id: row!.id };
  }

  async setB2bProductPrice(groupId: string, productId: string, priceKurus: number) {
    const existing = await this.db.query.storeB2bProductPrices.findFirst({
      where: and(eq(storeB2bProductPrices.groupId, groupId), eq(storeB2bProductPrices.productId, productId)),
    });
    if (existing) {
      await this.db.update(storeB2bProductPrices).set({ priceKurus }).where(eq(storeB2bProductPrices.id, existing.id));
    } else {
      await this.db.insert(storeB2bProductPrices).values({ groupId, productId, priceKurus });
    }
    return { ok: true };
  }

  // ─── Ürün Paketi (Bundle) ─────────────────────────────────────────────────────

  async getBundleContents(bundleProductId: string) {
    const items = await this.db.select().from(storeProductBundles).where(eq(storeProductBundles.bundleProductId, bundleProductId));
    if (!items.length) return [];
    const products = await this.db.select().from(storeProducts)
      .where(eq(storeProducts.status, 'active'));
    return items.map(i => ({
      quantity: i.quantity,
      product: products.find(p => p.id === i.includedProductId),
    })).filter(i => i.product);
  }

  async setBundleContents(bundleProductId: string, items: Array<{ productId: string; quantity: number }>) {
    await this.db.delete(storeProductBundles).where(eq(storeProductBundles.bundleProductId, bundleProductId));
    if (items.length) {
      await this.db.insert(storeProductBundles).values(items.map(i => ({
        bundleProductId,
        includedProductId: i.productId,
        quantity: i.quantity,
      })));
    }
    return { ok: true };
  }

  // ─── SMS (Netgsm) ─────────────────────────────────────────────────────────────

  async sendSms(phones: string[], message: string): Promise<void> {
    const apiKey = process.env['NETGSM_API_KEY'];
    const sender = process.env['NETGSM_SENDER'] ?? 'HARITAILS';
    if (!apiKey) { this.emailService['logger']?.warn?.('NETGSM_API_KEY not set, SMS skipped'); return; }

    const body = new URLSearchParams({
      usercode: apiKey.split(':')[0] ?? '',
      password: apiKey.split(':')[1] ?? '',
      gsmno: phones.join(','),
      message,
      msgheader: sender,
      dil: 'TR',
    });

    await fetch('https://api.netgsm.com.tr/sms/send/get/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).catch(() => undefined);
  }

  async sendOrderSms(orderId: string, message: string) {
    const order = await this.db.query.storeOrders.findFirst({ where: eq(storeOrders.id, orderId) });
    if (!order) return;
    const addr = order.shippingAddress as { phone?: string } | null;
    if (addr?.phone) await this.sendSms([addr.phone], message);
  }
}
