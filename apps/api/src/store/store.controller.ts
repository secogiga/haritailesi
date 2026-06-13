import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe,
  Patch, Post, Query, Req,
} from '@nestjs/common';
import {
  IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength, Min,
  IsArray, IsNumber, ValidateNested, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Request } from 'express';
import { StoreService } from './store.service';
import { IyzicoService } from '../donations/iyzico.service';
import { ShippingService, type CarrierCode } from './shipping.service';
import { FraudService } from './fraud.service';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class SellerApplyDto {
  @IsString() @MinLength(2) applicantName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsIn(['bireysel', 'kurumsal']) businessType!: 'bireysel' | 'kurumsal';
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() iban?: string;
  @IsString() @MinLength(20) productDescription!: string;
  @IsIn(['sahne', 'mutfak']) appliedFrom!: 'sahne' | 'mutfak';
}

class ReviewSellerDto {
  @IsIn(['approved', 'rejected', 'suspended']) status!: 'approved' | 'rejected' | 'suspended';
  @IsOptional() @IsString() adminNotes?: string;
  @IsOptional() @IsNumber() commissionRate?: number;
  @IsOptional() @IsString() iyzicоSubMerchantKey?: string;
}

class UpdateSellerDto {
  @IsOptional() @IsNumber() commissionRate?: number;
  @IsOptional() @IsString() iyzicоSubMerchantKey?: string;
  @IsOptional() @IsString() iban?: string;
  @IsOptional() @IsString() adminNotes?: string;
}

class CreateProductDto {
  @IsString() @MinLength(2) slug!: string;
  @IsIn(['vakif', 'seller']) ownerType!: 'vakif' | 'seller';
  @IsOptional() @IsString() sellerId?: string;
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsString() @MinLength(10) description!: string;
  @IsIn(['digital', 'physical', 'app']) type!: 'digital' | 'physical' | 'app';
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsInt() @Min(0) memberPrice?: number;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() downloadUrl?: string;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() badgeLabel?: string;
  @IsOptional() @IsString() badgeColor?: string;
  @IsOptional() @IsIn(['draft', 'active', 'paused', 'archived']) status?: 'draft' | 'active' | 'paused' | 'archived';
  @IsOptional() @IsInt() sortOrder?: number;
}

class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() @MinLength(10) description?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() memberPrice?: number | null;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() downloadUrl?: string | null;
  @IsOptional() stock?: number | null;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() badgeLabel?: string | null;
  @IsOptional() badgeColor?: string | null;
  @IsOptional() @IsIn(['draft', 'active', 'paused', 'archived']) status?: 'draft' | 'active' | 'paused' | 'archived';
  @IsOptional() @IsInt() sortOrder?: number;
}

class OrderItemDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() selectedVariants?: Record<string, string>;
}

class CreateOrderDto {
  @IsString() @MinLength(2) buyerName!: string;
  @IsEmail() buyerEmail!: string;
  @IsOptional() shippingAddress?: object;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items!: OrderItemDto[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() couponCode?: string;
}

class UpdateItemShippingDto {
  @IsIn(['preparing', 'shipped', 'delivered']) shippingStatus!: 'preparing' | 'shipped' | 'delivered';
  @IsOptional() @IsString() trackingNumber?: string;
  @IsOptional() @IsString() trackingCompany?: string;
}

class CheckoutDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) surname!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() ip?: string;
  @IsOptional() @IsString() callbackUrl?: string;
}

class CreateReviewDto {
  @IsString() productId!: string;
  @IsOptional() @IsString() orderId?: string;
  @IsString() @MinLength(2) buyerName!: string;
  @IsEmail() buyerEmail!: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() comment?: string;
}

class CreateGiftCardDto {
  @IsEmail() purchasedByEmail!: string;
  @IsEmail() recipientEmail!: string;
  @IsString() @MinLength(2) recipientName!: string;
  @IsInt() @Min(100) amount!: number;
  @IsOptional() @IsString() message?: string;
  @IsOptional() expiresAt?: string;
}

class StoreCampaignDto {
  @IsString() @MinLength(3) subject!: string;
  @IsString() @MinLength(10) body!: string;
  @IsIn(['all_buyers', 'product_buyers']) targetType!: 'all_buyers' | 'product_buyers';
  @IsOptional() @IsString() productId?: string;
}

class CreateCollectionDto {
  @IsString() @MinLength(2) slug!: string;
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() productIds?: string[];
  @IsOptional() @IsInt() sortOrder?: number;
}

class UpdateCollectionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() productIds?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

class ConfirmDeliveryDto {
  @IsEmail() buyerEmail!: string;
}

class CreatePayoutDto {
  @IsString() sellerId!: string;
  @IsArray() @IsString({ each: true }) itemIds!: string[];
  @IsOptional() @IsString() adminNotes?: string;
}

class MarkPayoutPaidDto {
  @IsOptional() @IsString() adminNotes?: string;
}

class CreateCouponDto {
  @IsString() @MinLength(3) code!: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['percentage', 'fixed']) discountType!: 'percentage' | 'fixed';
  @IsInt() @Min(1) discountValue!: number;
  @IsOptional() @IsInt() @Min(0) minOrderAmount?: number;
  @IsOptional() @IsInt() @Min(1) maxUses?: number;
  @IsOptional() expiresAt?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly iyzicoService: IyzicoService,
    private readonly shippingService: ShippingService,
    private readonly fraudService: FraudService,
  ) {}

  // ── Public — Ürünler ───────────────────────────────────────────────────────

  @Public()
  @Get('products')
  listProducts(
    @Query('type') type?: string,
    @Query('ownerType') ownerType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('collection') collection?: string,
    @Query('q') q?: string,
  ) {
    const params: { type?: string; ownerType?: string; limit?: number; offset?: number; collectionSlug?: string; search?: string } = {};
    if (type) params.type = type;
    if (ownerType) params.ownerType = ownerType;
    if (limit) params.limit = parseInt(limit, 10);
    if (offset) params.offset = parseInt(offset, 10);
    if (collection) params.collectionSlug = collection;
    if (q) params.search = q;
    return this.storeService.listProducts(params);
  }

  @Public()
  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.storeService.getProductBySlug(slug);
  }

  // ── Public — Satıcı Başvurusu ──────────────────────────────────────────────

  @Public()
  @Post('sellers/apply')
  @HttpCode(201)
  applyAsSeller(@Body() dto: SellerApplyDto) {
    return this.storeService.applyAsSeller(dto);
  }

  // ── Auth — Mutfak üyesi satıcı başvurusu ──────────────────────────────────

  @Post('sellers/apply/member')
  @HttpCode(201)
  applyAsSellerMember(@Body() dto: SellerApplyDto, @CurrentUser() user: RequestUser) {
    return this.storeService.applyAsSeller({ ...dto, userId: user.id, appliedFrom: 'mutfak' });
  }

  // ── Auth — Satıcı kendi satışlarını görür ─────────────────────────────────

  @Get('seller/me')
  async getMySellerProfile(@CurrentUser() user: RequestUser) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) return null;
    return seller;
  }

  @Get('seller/me/products')
  async getMyProducts(@CurrentUser() user: RequestUser) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) return { data: [] };
    const products = await this.storeService.listSellerProducts(seller.id);
    return { data: products };
  }

  @Get('seller/me/orders')
  async getMySalesOrders(@CurrentUser() user: RequestUser) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) return { data: [] };
    const items = await this.storeService.getSellerOrders(seller.id);
    return { data: items };
  }

  @Patch('seller/me/orders/items/:itemId/shipping')
  async updateMyItemShipping(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemShippingDto,
    @CurrentUser() user: RequestUser,
  ) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) throw new Error('Satıcı profili bulunamadı.');
    return this.storeService.updateItemShipping(itemId, dto);
  }

  // ── Auth — Sipariş oluştur ─────────────────────────────────────────────────

  @Public()
  @Post('orders')
  @HttpCode(201)
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: RequestUser | undefined, @Req() req: Request) {
    const ip = (req as unknown as { ip?: string }).ip ?? '127.0.0.1';

    const fraudCheck = await this.fraudService.evaluate({
      buyerEmail: dto.buyerEmail,
      buyerIp: ip,
      total: dto.items.length * 1000, // tahmini, gerçek total henüz bilinmiyor
      items: dto.items.map(i => ({ type: 'unknown', price: 0, quantity: i.quantity })),
    });

    if (fraudCheck.shouldBlock) {
      throw new (await import('@nestjs/common').then(m => m.BadRequestException))('Sipariş oluşturulamadı. Lütfen destek ekibimizle iletişime geçin.');
    }

    const payload: Parameters<StoreService['createOrder']>[0] = {
      buyerName: dto.buyerName,
      buyerEmail: dto.buyerEmail,
      items: dto.items,
    };
    if (user?.id) payload.buyerId = user.id;
    if (dto.shippingAddress) payload.shippingAddress = dto.shippingAddress;
    if (dto.notes) payload.notes = dto.notes;
    if (dto.couponCode) payload.couponCode = dto.couponCode;
    const result = await this.storeService.createOrder(payload);

    // Manuel inceleme gereken siparişi işaretle
    if (fraudCheck.requireManualReview) {
      const note = `🚩 Fraud uyarısı: skor=${fraudCheck.score}, flags=${fraudCheck.flags.join(', ')}`;
      await this.storeService.updateOrderStatus(result.id, 'processing').catch(() => undefined);
      await this.storeService.getOrder(result.id).then(o =>
        this.storeService.updateOrderStatus(o.id, 'processing')
      ).catch(() => undefined);
      void import('@nestjs/common').then(m => new m.Logger('FraudService').warn(note));
    }

    return { ...result, fraudLevel: fraudCheck.level };
  }

  // ── Public — Kupon doğrulama ───────────────────────────────────────────────

  @Public()
  @Post('coupons/validate')
  validateCoupon(@Body() body: { code: string; orderAmount: number }) {
    return this.storeService.validateCoupon(body.code, body.orderAmount);
  }

  // ── Public — Sipariş sorgulama ────────────────────────────────────────────

  @Public()
  @Get('orders/lookup')
  lookupOrder(
    @Query('orderId') orderId: string,
    @Query('email') email: string,
  ) {
    if (!orderId || !email) throw new Error('orderId ve email gerekli.');
    return this.storeService.lookupOrder(orderId, email);
  }

  // ── Auth — Alıcı siparişleri ───────────────────────────────────────────────

  @Get('orders/my')
  getMyOrders(@CurrentUser() user: RequestUser) {
    return this.storeService.getOrdersByBuyer(user.id);
  }

  // ── Auth — iyzico checkout başlat ─────────────────────────────────────────

  @Public()
  @Post('orders/:id/checkout')
  async initCheckout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckoutDto,
    @Req() req: Request,
  ) {
    const order = await this.storeService.getOrder(id);
    if (order.paymentStatus === 'paid') return { status: 'already_paid' };
    const sahneUrl = process.env['SAHNE_URL'] ?? 'http://localhost:3002';

    const basketItems = await this.storeService.buildBasketItems(id);
    const shippingAddr = order.shippingAddress as { address?: string; city?: string } | null;

    const result = await this.iyzicoService.initializeStoreCheckout({
      conversationId: id,
      items: basketItems,
      totalPrice: (order.total / 100).toFixed(2),
      callbackUrl: dto.callbackUrl ?? `${sahneUrl}/magaza/odeme-sonuc`,
      buyer: {
        id: order.buyerId ?? order.buyerEmail,
        name: dto.name,
        surname: dto.surname,
        email: dto.email,
        ip: dto.ip ?? (req.ip ?? '127.0.0.1'),
      },
      ...(shippingAddr ? { shippingAddress: { name: order.buyerName, address: shippingAddr.address ?? 'Türkiye', city: shippingAddr.city ?? 'Istanbul' } } : {}),
    });

    return result;
  }

  // ── Public — iyzico BIN Sorgulama ─────────────────────────────────────────

  @Public()
  @Post('checkout/bin-check')
  @HttpCode(200)
  async binCheck(
    @Body() body: { binNumber: string; orderTotal: number },
  ) {
    const result = await this.iyzicoService.checkBin('sirket', body.binNumber.slice(0, 6));
    if (result.status === 'mock' || result.status === 'success') {
      const installments = (result.installmentDetails ?? []).map((detail: { installmentCount: number; installmentPrice: string; totalPrice: string }) => ({
        count: detail.installmentCount,
        perInstallment: Math.round(body.orderTotal / detail.installmentCount),
        totalPrice: Math.round(parseFloat(detail.totalPrice || '0') * 100) || body.orderTotal,
      })).filter((d: { count: number }) => d.count <= 6);
      return { cardType: result.cardType, bankName: result.bankName, installments };
    }
    return { installments: [{ count: 1, perInstallment: body.orderTotal, totalPrice: body.orderTotal }] };
  }

  // ── Public — iyzico callback (3D Secure sonrası) ──────────────────────────

  @Public()
  @Post('callback/iyzico')
  @HttpCode(200)
  async iyzicoCallback(@Body() body: { token: string; status: string }) {
    const result = await this.iyzicoService.retrieveCheckoutForm('sirket', body.token);
    if (result.paymentStatus === 'SUCCESS' && result.conversationId) {
      const dto: { paymentStatus: 'paid'; iyzicоConversationId: string; iyzicоPaymentId?: string } = {
        paymentStatus: 'paid',
        iyzicоConversationId: result.conversationId,
      };
      if (result.paymentId) dto.iyzicоPaymentId = result.paymentId;
      await this.storeService.updateOrderPayment(result.conversationId, dto).catch(() => undefined);
    }
    return { status: 'ok' };
  }

  // ── Admin — Satıcılar ──────────────────────────────────────────────────────

  @Get('admin/sellers')
  @RequirePermission('content.publish')
  listSellers(@Query('status') status?: string) {
    return this.storeService.listSellers({ ...(status ? { status } : {}) });
  }

  @Get('admin/sellers/:id')
  @RequirePermission('content.publish')
  getSeller(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.getSeller(id);
  }

  @Patch('admin/sellers/:id/review')
  @RequirePermission('content.publish')
  reviewSeller(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewSellerDto,
    @CurrentUser() admin: RequestUser,
  ) {
    return this.storeService.reviewSeller(id, admin.id, dto.status, dto);
  }

  @Patch('admin/sellers/:id')
  @RequirePermission('content.publish')
  updateSeller(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSellerDto,
  ) {
    return this.storeService.updateSeller(id, dto);
  }

  // ── Admin — Ürünler ────────────────────────────────────────────────────────

  @Get('admin/products')
  @RequirePermission('content.publish')
  listAdminProducts(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('ownerType') ownerType?: string,
  ) {
    const params: { type?: string; status?: string; ownerType?: string } = {};
    if (type) params.type = type;
    if (status) params.status = status;
    if (ownerType) params.ownerType = ownerType;
    return this.storeService.listProducts(params);
  }

  @Post('admin/products')
  @RequirePermission('content.publish')
  @HttpCode(201)
  createProduct(@Body() dto: CreateProductDto) {
    return this.storeService.createProduct(dto);
  }

  @Patch('admin/products/:id')
  @RequirePermission('content.publish')
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.storeService.updateProduct(id, dto);
  }

  @Delete('admin/products/:id')
  @RequirePermission('content.publish')
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.deleteProduct(id);
  }

  // ── Admin — Siparişler ─────────────────────────────────────────────────────

  @Get('admin/orders')
  @RequirePermission('content.publish')
  listOrders(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storeService.listOrders({
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
    });
  }

  @Get('admin/orders/:id')
  @RequirePermission('content.publish')
  getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.getOrder(id);
  }

  @Patch('admin/orders/:id/status')
  @RequirePermission('content.publish')
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' },
  ) {
    return this.storeService.updateOrderStatus(id, body.status);
  }

  @Patch('admin/orders/items/:itemId/shipping')
  @RequirePermission('content.publish')
  updateItemShipping(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemShippingDto,
  ) {
    return this.storeService.updateItemShipping(itemId, dto);
  }

  // ── Admin — Analitik ───────────────────────────────────────────────────────

  @Get('admin/analytics')
  @RequirePermission('content.publish')
  getAnalytics(@Query('days') days?: string) {
    return this.storeService.getAnalytics(days ? parseInt(days, 10) : 30);
  }

  @Get('admin/analytics/advanced')
  @RequirePermission('content.publish')
  getAdvancedAnalytics(@Query('days') days?: string) {
    return this.storeService.getAdvancedAnalytics(days ? parseInt(days, 10) : 30);
  }

  // ── Admin — Kuponlar ───────────────────────────────────────────────────────

  @Get('admin/coupons')
  @RequirePermission('content.publish')
  listCoupons() { return this.storeService.listCoupons(); }

  @Post('admin/coupons')
  @RequirePermission('content.publish')
  @HttpCode(201)
  createCoupon(@Body() dto: CreateCouponDto) {
    const payload: Parameters<StoreService['createCoupon']>[0] = {
      code: dto.code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
    };
    if (dto.description) payload.description = dto.description;
    if (dto.minOrderAmount !== undefined) payload.minOrderAmount = dto.minOrderAmount;
    if (dto.maxUses !== undefined) payload.maxUses = dto.maxUses;
    if (dto.expiresAt) payload.expiresAt = new Date(dto.expiresAt);
    return this.storeService.createCoupon(payload);
  }

  @Patch('admin/coupons/:id/toggle')
  @RequirePermission('content.publish')
  toggleCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive: boolean },
  ) { return this.storeService.toggleCoupon(id, body.isActive); }

  @Delete('admin/coupons/:id')
  @RequirePermission('content.publish')
  deleteCoupon(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.deleteCoupon(id);
  }

  // ── Public — Ürün Yorumları ────────────────────────────────────────────────

  @Public()
  @Get('products/:slug/reviews')
  getReviews(@Param('slug') slug: string) {
    return this.storeService.getProductBySlug(slug).then(p => this.storeService.listReviews(p.id));
  }

  @Public()
  @Post('reviews')
  @HttpCode(201)
  createReview(@Body() dto: CreateReviewDto, @CurrentUser() user?: RequestUser) {
    const payload: Parameters<StoreService['createReview']>[0] = {
      productId: dto.productId, buyerName: dto.buyerName,
      buyerEmail: dto.buyerEmail, rating: dto.rating,
    };
    if (user?.id) payload.buyerId = user.id;
    if (dto.orderId) payload.orderId = dto.orderId;
    if (dto.comment) payload.comment = dto.comment;
    return this.storeService.createReview(payload);
  }

  // ── Public — Çapraz Satış ─────────────────────────────────────────────────

  @Public()
  @Get('products/:slug/related')
  getRelated(@Param('slug') slug: string) {
    return this.storeService.getProductBySlug(slug).then(async p => {
      const all = await this.storeService.listProducts({ type: p.type });
      return all.data.filter((r: { id: string }) => r.id !== p.id).slice(0, 4);
    });
  }

  // ── Public — EFT başlat ───────────────────────────────────────────────────

  @Public()
  @Post('orders/:id/eft')
  initiateEft(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.initiateEftOrder(id);
  }

  // ── Public — Terk edilen sepet kaydet ────────────────────────────────────

  @Public()
  @Post('abandoned-cart')
  @HttpCode(204)
  saveAbandonedCart(@Body() body: { email: string; name?: string; cartSnapshot: object; orderId?: string }) {
    return this.storeService.saveAbandonedCart(body);
  }

  // ── Public — Hediye kartı doğrula ─────────────────────────────────────────

  @Public()
  @Post('gift-cards/validate')
  validateGiftCard(@Body() body: { code: string }) {
    return this.storeService.validateGiftCard(body.code);
  }

  // ── Admin — Yorumlar ───────────────────────────────────────────────────────

  @Get('admin/reviews')
  @RequirePermission('content.publish')
  listAdminReviews(@Query('published') published?: string) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.storeService.listAdminReviews({ ...(isPublished !== undefined ? { isPublished } : {}) });
  }

  @Patch('admin/reviews/:id/publish')
  @RequirePermission('content.publish')
  publishReview(@Param('id', ParseUUIDPipe) id: string, @Body() body: { isPublished: boolean }) {
    return this.storeService.publishReview(id, body.isPublished);
  }

  @Delete('admin/reviews/:id')
  @RequirePermission('content.publish')
  deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.deleteReview(id);
  }

  // ── Admin — Hediye Kartları ────────────────────────────────────────────────

  @Get('admin/gift-cards')
  @RequirePermission('content.publish')
  listGiftCards() { return this.storeService.listGiftCards(); }

  @Post('admin/gift-cards')
  @RequirePermission('content.publish')
  @HttpCode(201)
  createGiftCard(@Body() dto: CreateGiftCardDto, @CurrentUser() admin: RequestUser) {
    const payload: Parameters<StoreService['createGiftCard']>[0] = {
      purchasedByEmail: dto.purchasedByEmail,
      purchasedByUserId: admin.id,
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      amount: dto.amount,
    };
    if (dto.message) payload.message = dto.message;
    if (dto.expiresAt) payload.expiresAt = new Date(dto.expiresAt);
    return this.storeService.createGiftCard(payload);
  }

  // ── Admin — Email Pazarlama ────────────────────────────────────────────────

  @Post('admin/campaigns')
  @RequirePermission('content.publish')
  @HttpCode(200)
  sendCampaign(@Body() dto: StoreCampaignDto) {
    return this.storeService.sendStoreCampaign(dto);
  }

  // ── Admin — Terk Edilen Sepet Cron ────────────────────────────────────────

  @Post('admin/abandoned-cart/send')
  @RequirePermission('content.publish')
  @HttpCode(200)
  sendAbandonedCartReminders() {
    return this.storeService.sendAbandonedCartReminders();
  }

  // ── Auth — Favori Listesi ─────────────────────────────────────────────────

  @Get('wishlist')
  getWishlist(@CurrentUser() user: RequestUser) {
    return this.storeService.getWishlist(user.id);
  }

  @Post('wishlist/:productId')
  @HttpCode(200)
  toggleWishlist(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.storeService.toggleWishlist(user.id, productId);
  }

  // ── Public — Stok Bildirimi ───────────────────────────────────────────────

  @Public()
  @Post('products/:slug/notify-stock')
  @HttpCode(200)
  subscribeStockNotification(
    @Param('slug') slug: string,
    @Body() body: { email: string },
  ) {
    return this.storeService.getProductBySlug(slug).then(p =>
      this.storeService.subscribeStockNotification(p.id, body.email)
    );
  }

  // ── Admin — Stok bildirimi tetikle ────────────────────────────────────────

  @Post('admin/products/:id/send-stock-notifications')
  @RequirePermission('content.publish')
  @HttpCode(200)
  sendStockNotifications(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.sendStockNotifications(id);
  }

  // ── Public — Kargo ücret hesabı ───────────────────────────────────────────

  @Public()
  @Post('shipping/calculate')
  calculateShipping(@Body() body: { weightGrams: number; city: string }): unknown {
    return this.shippingService.calculateRates(body.weightGrams, body.city);
  }

  // ── Public — Kargo Takip ──────────────────────────────────────────────────

  @Public()
  @Get('shipping/track/:carrier/:trackingNumber')
  trackShipment(
    @Param('carrier') carrier: CarrierCode,
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<unknown> {
    return this.shippingService.trackShipment(carrier, trackingNumber);
  }

  // ── Admin — Kargo oluştur ─────────────────────────────────────────────────

  @Post('admin/orders/:id/shipments')
  @RequirePermission('content.publish')
  @HttpCode(201)
  async createShipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { provider: CarrierCode; buyerPhone?: string; weightGrams?: number },
  ): Promise<unknown> {
    const order = await this.storeService.getOrder(id);
    const addr = order.shippingAddress as { address?: string; city?: string; district?: string; postalCode?: string; phone?: string; fullName?: string } | null;
    const result = await this.shippingService.createShipment(body.provider, {
      orderId: id,
      buyerName: order.buyerName,
      buyerPhone: body.buyerPhone ?? addr?.phone ?? '',
      address: addr?.address ?? '',
      city: addr?.city ?? '',
      ...(addr?.district  ? { district:   addr.district }  : {}),
      ...(addr?.postalCode ? { postalCode: addr.postalCode } : {}),
      weightGrams: body.weightGrams ?? 500,
      items: [],
    });
    // Tracking numarasını sipariş kalemine kaydet
    const items = (order as { items?: { id: string }[] }).items ?? [];
    for (const item of items) {
      await this.storeService.updateItemShipping(item.id, {
        shippingStatus: 'shipped',
        trackingNumber: result.trackingNumber,
        trackingCompany: body.provider,
      });
    }
    return result;
  }

  @Get('admin/orders/:id/shipments')
  @RequirePermission('content.publish')
  getShipments(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.getShipmentsByOrder(id);
  }

  // ── Auth — İade Talebi ────────────────────────────────────────────────────

  @Public()
  @Post('returns')
  @HttpCode(201)
  createReturn(@Body() body: { orderId: string; orderItemId?: string; buyerEmail: string; reason: string }, @CurrentUser() user?: RequestUser) {
    const dto: Parameters<StoreService['createReturn']>[0] = { orderId: body.orderId, buyerEmail: body.buyerEmail, reason: body.reason };
    if (body.orderItemId) dto.orderItemId = body.orderItemId;
    if (user?.id) dto.buyerId = user.id;
    return this.storeService.createReturn(dto);
  }

  // ── Admin — İade Yönetimi ─────────────────────────────────────────────────

  @Get('admin/returns')
  @RequirePermission('content.publish')
  listReturns(@Query('status') status?: string) {
    return this.storeService.listReturns({ ...(status ? { status } : {}) });
  }

  @Patch('admin/returns/:id')
  @RequirePermission('content.publish')
  resolveReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'approved' | 'rejected' | 'completed'; adminNotes?: string; refundAmount?: number; restockItems?: boolean; processRefund?: boolean },
  ) {
    return this.storeService.resolveReturn(id, body.status, body, this.iyzicoService);
  }

  // ── Auth — Abonelik ───────────────────────────────────────────────────────

  @Public()
  @Post('subscriptions')
  @HttpCode(201)
  createSubscription(
    @Body() body: { productId: string; buyerEmail: string; buyerName: string; interval: 'monthly' | 'quarterly' | 'yearly'; priceKurus: number },
    @CurrentUser() user?: RequestUser,
  ) {
    const dto: Parameters<StoreService['createSubscription']>[0] = { ...body };
    if (user?.id) dto.buyerId = user.id;
    return this.storeService.createSubscription(dto);
  }

  @Get('subscriptions/my')
  getMySubscriptions(@CurrentUser() user: RequestUser) {
    return this.storeService.listSubscriptions({ buyerId: user.id });
  }

  @Patch('subscriptions/:id/cancel')
  cancelSubscription(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.cancelSubscription(id);
  }

  // ── Admin — Abonelikler ───────────────────────────────────────────────────

  @Get('admin/subscriptions')
  @RequirePermission('content.publish')
  listAdminSubscriptions(@Query('status') status?: string) {
    return this.storeService.listSubscriptions({ ...(status ? { status } : {}) });
  }

  // ── Satıcı Self-Servis ────────────────────────────────────────────────────

  @Get('seller/me/balance')
  async getMyBalance(@CurrentUser() user: RequestUser) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) return { held: 0, released: 0, totalPaid: 0 };
    return this.storeService.getSellerBalance(seller.id);
  }

  @Post('seller/me/products')
  @HttpCode(201)
  async sellerCreateProduct(@Body() dto: CreateProductDto, @CurrentUser() user: RequestUser) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) throw new Error('Onaylı satıcı hesabı bulunamadı.');
    return this.storeService.sellerCreateProduct(seller.id, dto);
  }

  @Patch('seller/me/products/:id')
  async sellerUpdateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) throw new Error('Onaylı satıcı hesabı bulunamadı.');
    return this.storeService.sellerUpdateProduct(seller.id, id, dto);
  }

  @Delete('seller/me/products/:id')
  async sellerDeleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const seller = await this.storeService.getSellerByUserId(user.id);
    if (!seller) throw new Error('Onaylı satıcı hesabı bulunamadı.');
    return this.storeService.sellerDeleteProduct(seller.id, id);
  }

  // ── Çoklu Mağaza ─────────────────────────────────────────────────────────

  @Public()
  @Get('products/by-store/:source')
  getProductsByStore(@Param('source') source: 'sahne' | 'mutfak') {
    return this.storeService.listProductsByStore(source);
  }

  // ── Admin — B2B Fiyatlandırma ─────────────────────────────────────────────

  @Get('admin/b2b/groups')
  @RequirePermission('content.publish')
  listPriceGroups() { return this.storeService.listPriceGroups(); }

  @Post('admin/b2b/groups')
  @RequirePermission('content.publish')
  @HttpCode(201)
  createPriceGroup(@Body() body: { name: string; discountPct: number }) {
    return this.storeService.createPriceGroup(body.name, body.discountPct);
  }

  @Post('admin/b2b/prices')
  @RequirePermission('content.publish')
  @HttpCode(200)
  setB2bPrice(@Body() body: { groupId: string; productId: string; priceKurus: number }) {
    return this.storeService.setB2bProductPrice(body.groupId, body.productId, body.priceKurus);
  }

  // ── Ürün Paketi ───────────────────────────────────────────────────────────

  @Public()
  @Get('products/:slug/bundle')
  getBundleContents(@Param('slug') slug: string) {
    return this.storeService.getProductBySlug(slug).then(p => this.storeService.getBundleContents(p.id));
  }

  @Post('admin/products/:id/bundle')
  @RequirePermission('content.publish')
  @HttpCode(200)
  setBundleContents(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { items: Array<{ productId: string; quantity: number }> },
  ) {
    return this.storeService.setBundleContents(id, body.items);
  }

  // ── Public — Signed Download ───────────────────────────────────────────────

  @Public()
  @Get('download/:token')
  async downloadFile(@Param('token') token: string) {
    return this.storeService.resolveDownload(token);
  }

  // ── Public — Varyant Stok Sorgulama ───────────────────────────────────────

  @Public()
  @Get('products/:id/variant-stocks')
  getVariantStocks(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.getVariantStocks(id);
  }

  // ── Admin — Varyant Stok Yönetimi ─────────────────────────────────────────

  @Post('admin/products/:id/variant-stocks')
  @RequirePermission('content.publish')
  @HttpCode(200)
  setVariantStocks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { stocks: Array<{ variants: Record<string, string>; stock: number }> },
  ) {
    return this.storeService.setAllVariantStocks(id, body.stocks);
  }

  // ── Admin — Fraud Yönetimi ────────────────────────────────────────────────

  @Post('admin/fraud/check')
  @RequirePermission('content.publish')
  @HttpCode(200)
  fraudCheck(@Body() body: {
    buyerEmail: string; total: number;
    items: Array<{ type: string; price: number; quantity: number }>;
  }) {
    return this.fraudService.evaluate({ buyerEmail: body.buyerEmail, total: body.total, items: body.items });
  }

  @Get('admin/fraud/blocked-ips')
  @RequirePermission('content.publish')
  listBlockedIps() {
    return this.fraudService.listBlockedIps();
  }

  @Post('admin/fraud/block-ip')
  @RequirePermission('content.publish')
  @HttpCode(200)
  async blockIp(
    @CurrentUser() admin: RequestUser,
    @Body() body: { ip: string; reason?: string; expiresAt?: string },
  ) {
    await this.fraudService.markIpSuspicious(body.ip, body.reason, admin.id, body.expiresAt ? new Date(body.expiresAt) : undefined);
    return { blocked: body.ip };
  }

  @Post('admin/fraud/unblock-ip')
  @RequirePermission('content.publish')
  @HttpCode(200)
  async unblockIp(@Body() body: { ip: string }) {
    await this.fraudService.clearIpSuspicion(body.ip);
    return { unblocked: body.ip };
  }

  // ── Admin — Faturalar ─────────────────────────────────────────────────────

  @Get('admin/invoices')
  @RequirePermission('content.publish')
  listInvoices(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.storeService.listInvoices({
      ...(status ? { status } : {}),
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
      ...(offset ? { offset: parseInt(offset, 10) } : {}),
    });
  }

  @Post('admin/invoices/:id/retry')
  @RequirePermission('content.publish')
  @HttpCode(200)
  retryInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.retryInvoiceWebhook(id);
  }

  // ── Public — Koleksiyonlar ─────────────────────────────────────────────────

  @Public()
  @Get('collections')
  listCollections() {
    return this.storeService.listCollections(true);
  }

  @Public()
  @Get('collections/:slug')
  getCollection(@Param('slug') slug: string) {
    return this.storeService.getCollection(slug);
  }

  @Post('admin/collections')
  @RequirePermission('content.publish')
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.storeService.createCollection(dto);
  }

  @Patch('admin/collections/:id')
  @RequirePermission('content.publish')
  updateCollection(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollectionDto) {
    return this.storeService.updateCollection(id, dto);
  }

  @Delete('admin/collections/:id')
  @RequirePermission('content.publish')
  @HttpCode(204)
  deleteCollection(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeService.deleteCollection(id);
  }

  // ── Auth — Loyalty Puanları ────────────────────────────────────────────────

  @Get('loyalty/balance')
  getLoyaltyBalance(@CurrentUser() user: RequestUser) {
    return this.storeService.getLoyaltyBalance(user.id).then(balance => ({ balance, pointsValue: (balance / 100).toFixed(2) }));
  }

  @Get('loyalty/history')
  getLoyaltyHistory(@CurrentUser() user: RequestUser) {
    return this.storeService.getLoyaltyHistory(user.id);
  }

  @Post('loyalty/redeem')
  @HttpCode(200)
  redeemLoyalty(@CurrentUser() user: RequestUser, @Body() body: { points: number }) {
    return this.storeService.redeemLoyaltyPoints(user.id, body.points);
  }

  @Post('admin/loyalty/adjust')
  @RequirePermission('content.publish')
  adjustLoyalty(@Body() body: { userId: string; points: number; description: string }) {
    return this.storeService.adjustLoyaltyPoints(body.userId, body.points, body.description);
  }

  // ── Escrow: Alıcı Teslim Onayı ────────────────────────────────────────────

  @Public()
  @Post('orders/items/:itemId/confirm-delivery')
  @HttpCode(200)
  confirmDelivery(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ConfirmDeliveryDto,
  ) {
    return this.storeService.confirmDelivery(itemId, dto.buyerEmail);
  }

  // ── Escrow: Admin Payout ───────────────────────────────────────────────────

  @Get('admin/payouts/summary')
  @RequirePermission('content.publish')
  getPayoutSummary() {
    return this.storeService.listPayoutSummary();
  }

  @Get('admin/payouts')
  @RequirePermission('content.publish')
  listPayouts(@Query('status') status?: string) {
    return this.storeService.listSellerPayouts(status ? { status } : {});
  }

  @Post('admin/payouts')
  @RequirePermission('content.publish')
  createPayout(@CurrentUser() user: RequestUser, @Body() dto: CreatePayoutDto) {
    return this.storeService.createSellerPayout(user.id, dto.sellerId, dto.itemIds, dto.adminNotes);
  }

  @Patch('admin/payouts/:id/paid')
  @RequirePermission('content.publish')
  @HttpCode(200)
  markPayoutPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: MarkPayoutPaidDto,
  ) {
    return this.storeService.markPayoutPaid(id, user.id, dto.adminNotes);
  }
}
