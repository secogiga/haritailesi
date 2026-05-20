import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from './rbac.decorator';
import { can, type Permission } from './permissions';
import type { RequestUser } from '../auth/auth.types';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { user: RequestUser }>();
    const user = req.user;

    if (!user) throw new ForbiddenException();

    const hasAll = required.every((permission) => can(user, permission));

    if (!hasAll) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmuyor.');
    }

    return true;
  }
}
