import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto, RegisterDto, RefreshTokenDto, SetupPasswordDto,
  ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestUser, TokenPair } from './auth.types';

const ACCESS_COOKIE   = 'hi_access';
const REFRESH_COOKIE  = 'hi_refresh';
const ACCESS_MAX_AGE  = 15 * 60 * 1000;           // 15 min
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ─── Cookie helpers ───────────────────────────────────────────────────────

  private cookieBase(): CookieOptions {
    const isProd   = this.config.get<string>('NODE_ENV') === 'production';
    const domain   = this.config.get<string>('COOKIE_DOMAIN') || undefined;
    // COOKIE_SECURE env var overrides NODE_ENV check — explicit beats implicit
    const rawSecure = this.config.get<string>('COOKIE_SECURE');
    const secure    = rawSecure !== undefined ? rawSecure === 'true' : isProd;
    const rawSame   = this.config.get<string>('COOKIE_SAMESITE');
    const sameSite  = (rawSame === 'strict' || rawSame === 'none') ? rawSame : 'lax';
    return { httpOnly: true, secure, sameSite, ...(domain ? { domain } : {}) };
  }

  private setCookies(res: Response, tokens: TokenPair): void {
    const base = this.cookieBase();
    res.cookie(ACCESS_COOKIE,  tokens.accessToken,  { ...base, maxAge: ACCESS_MAX_AGE  });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
  }

  private clearCookies(res: Response): void {
    const base = this.cookieBase();
    res.clearCookie(ACCESS_COOKIE,  base);
    res.clearCookie(REFRESH_COOKIE, base);
  }

  // ─── Endpoints ────────────────────────────────────────────────────────────

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);
    this.setCookies(res, tokens);
    return tokens;
  }

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 10 }, medium: { ttl: 600_000, limit: 30 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto, req.ip, req.headers['user-agent']);
    this.setCookies(res, tokens);
    return tokens;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: RequestUser & { refreshToken: string },
    @Body() _dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const tokens = await this.authService.refresh(user.id, user.refreshToken);
      this.setCookies(res, tokens);
      return tokens;
    } catch (err) {
      const origin = req.headers['origin'] ?? 'unknown';
      this.logger.warn(`refresh_failed user=${user.id} origin=${origin} err=${(err as Error).message}`);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rt =
      dto.refreshToken ??
      (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
    if (rt) await this.authService.logout(user.id, rt);
    this.logger.debug(`logout user=${user.id} via=${dto.refreshToken ? 'bearer' : 'cookie'}`);
    this.clearCookies(res);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);
    this.clearCookies(res);
  }

  @Public()
  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  async setupPassword(
    @Body() dto: SetupPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.setupPassword(dto);
    this.setCookies(res, tokens);
    return tokens;
  }

  @Public()
  @Throttle({ short: { ttl: 300_000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.resetPassword(dto);
    this.clearCookies(res);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser() user: RequestUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }
}
