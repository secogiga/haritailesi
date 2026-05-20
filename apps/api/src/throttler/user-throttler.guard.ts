import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../auth/auth.types';

/**
 * Extends the default ThrottlerGuard to key on userId when the request is
 * authenticated. Falls back to the client IP for unauthenticated routes.
 * This prevents a single bad-actor user from burning the IP-wide quota of
 * other users sharing the same NAT/proxy.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = (req as Request & { user?: RequestUser }).user;
    if (user?.id) return `user:${user.id}`;
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
