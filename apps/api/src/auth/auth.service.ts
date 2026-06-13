import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { users, userProfiles, userFunctionalRoles, refreshTokens, setupTokens, passwordResetTokens } from '@haritailesi/database';
import type { JwtPayload, RequestUser, TokenPair } from './auth.types';
import type { LoginDto, SetupPasswordDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.email, dto.email.toLowerCase()), isNull(users.deletedAt)),
      with: {
        functionalRoles: {
          where: (roles, { eq: eqFn }) => eqFn(roles.isActive, true),
        },
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException('Hesabınız askıya alınmıştır.');
    }

    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const requestUser: RequestUser = {
      id: user.id,
      email: user.email,
      membershipTier: user.membershipTier,
      functionalRoles: user.functionalRoles.map((r) => r.role),
    };

    return this.generateTokenPair(requestUser, ipAddress, userAgent);
  }

  async refresh(userId: string, rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const now = new Date();

    const token = await this.db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tokenHash, tokenHash),
        gt(refreshTokens.expiresAt, now),
        isNull(refreshTokens.revokedAt),
      ),
    });

    if (!token) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum.');
    }

    // Eski token'ı iptal et (rotation)
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, token.id));

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { functionalRoles: { where: (r, { eq: eqFn }) => eqFn(r.isActive, true) } },
    });

    if (!user) throw new UnauthorizedException();

    return this.generateTokenPair({
      id: user.id,
      email: user.email,
      membershipTier: user.membershipTier,
      functionalRoles: user.functionalRoles.map((r) => r.role),
    });
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.tokenHash, tokenHash)));
  }

  async logoutAll(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  async createSetupToken(userId: string): Promise<string> {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

    await this.db.insert(setupTokens).values({ userId, tokenHash, expiresAt });

    return rawToken;
  }

  async setupPassword(dto: SetupPasswordDto): Promise<TokenPair> {
    const tokenHash = this.hashToken(dto.token);
    const now = new Date();

    const token = await this.db.query.setupTokens.findFirst({
      where: and(
        eq(setupTokens.tokenHash, tokenHash),
        gt(setupTokens.expiresAt, now),
        isNull(setupTokens.usedAt),
      ),
    });

    if (!token) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş bağlantı.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.db
      .update(users)
      .set({ passwordHash, status: 'active', updatedAt: now })
      .where(eq(users.id, token.userId));

    await this.db
      .update(setupTokens)
      .set({ usedAt: now })
      .where(eq(setupTokens.id, token.id));

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, token.userId),
      with: { functionalRoles: { where: (r, { eq: eqFn }) => eqFn(r.isActive, true) } },
    });

    if (!user) throw new UnauthorizedException();

    return this.generateTokenPair({
      id: user.id,
      email: user.email,
      membershipTier: user.membershipTier,
      functionalRoles: user.functionalRoles.map((r) => r.role),
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.email, dto.email.toLowerCase()), isNull(users.deletedAt), eq(users.status, 'active')),
      with: { profile: true },
    });
    // Always return 204 to prevent email enumeration
    if (!user) return;

    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

    const appUrl = this.config.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3003');
    const resetUrl = `${appUrl}/sifre-sifirla?token=${rawToken}`;
    await this.emailService.send(user.email, 'forgot_password', {
      displayName: user.profile?.displayName ?? user.email,
      resetUrl,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const now = new Date();

    const token = await this.db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt),
      ),
    });

    if (!token) throw new BadRequestException('Geçersiz veya süresi dolmuş bağlantı.');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, token.userId));
    await this.db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, token.id));

    // Revoke all refresh tokens for security
    await this.logoutAll(token.userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Mevcut şifre hatalı.');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  private async generateTokenPair(
    user: RequestUser,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tier: user.membershipTier,
      roles: user.functionalRoles,
    };

    // JwtModule'de configüre edilmiş secret + expiresIn kullanılır
    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(expiresIn));

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) throw new Error(`Invalid duration: ${duration}`);
    const [, value, unit] = match;
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(value!, 10) * (multipliers[unit!] ?? 0);
  }
}
