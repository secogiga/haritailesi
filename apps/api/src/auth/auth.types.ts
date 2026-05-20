import type { MembershipTier, FunctionalRole } from '@haritailesi/types';

export interface JwtPayload {
  sub: string;
  email: string;
  tier: MembershipTier;
  roles: FunctionalRole[];
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  membershipTier: MembershipTier;
  functionalRoles: FunctionalRole[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
