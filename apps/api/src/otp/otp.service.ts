import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import type Redis from 'ioredis';
import crypto from 'crypto';
import { REDIS_TOKEN } from '../redis/redis.constants';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    private readonly emailService: EmailService,
  ) {}

  async send(email: string): Promise<void> {
    const rateKey = `otp:rate:${email.toLowerCase()}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) await this.redis.expire(rateKey, 3600);
    if (count > 5) throw new BadRequestException('Çok fazla kod istendi. Lütfen 1 saat bekleyin.');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.setex(
      `otp:code:${email.toLowerCase()}`,
      600,
      JSON.stringify({ code, attempts: 0 }),
    );

    await this.emailService.send(email, 'otp_verification', { code });
  }

  async verify(email: string, code: string): Promise<string> {
    const raw = await this.redis.get(`otp:code:${email.toLowerCase()}`);
    if (!raw) throw new BadRequestException('Kod bulunamadı veya süresi doldu. Yeni kod isteyin.');

    const data = JSON.parse(raw) as { code: string; attempts: number };

    if (data.attempts >= 5) {
      await this.redis.del(`otp:code:${email.toLowerCase()}`);
      throw new BadRequestException('Çok fazla yanlış deneme. Yeni kod isteyin.');
    }

    if (data.code !== code.trim()) {
      data.attempts++;
      const ttl = await this.redis.ttl(`otp:code:${email.toLowerCase()}`);
      await this.redis.setex(`otp:code:${email.toLowerCase()}`, Math.max(ttl, 1), JSON.stringify(data));
      const remaining = 5 - data.attempts;
      throw new BadRequestException(`Yanlış kod. ${remaining} deneme hakkınız kaldı.`);
    }

    await this.redis.del(`otp:code:${email.toLowerCase()}`);
    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.setex(`otp:token:${token}`, 900, email.toLowerCase());
    return token;
  }

  async consumeToken(token: string | undefined, expectedEmail: string): Promise<void> {
    if (!token) throw new BadRequestException('E-posta doğrulaması gerekiyor.');
    const stored = await this.redis.get(`otp:token:${token}`);
    if (!stored) throw new BadRequestException('Doğrulama süresi doldu. Lütfen yeniden doğrulayın.');
    if (stored !== expectedEmail.toLowerCase()) {
      throw new BadRequestException('Doğrulama e-postası eşleşmiyor.');
    }
    await this.redis.del(`otp:token:${token}`);
  }
}
