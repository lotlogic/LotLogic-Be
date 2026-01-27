export type AuthRole = 'ADMIN' | 'EDITOR';

export interface AuthUser {
  id: bigint;
  externalAuthId: string;
  email?: string;
  displayName?: string;
  role: AuthRole;
}

export interface ClientPrincipalClaim {
  typ: string;
  val: string;
}

export interface ClientPrincipal {
  auth_typ?: string;
  name_typ?: string;
  role_typ?: string;
  userId?: string;
  userDetails?: string;
  identityProvider?: string;
  userRoles?: string[];
  claims?: ClientPrincipalClaim[];
}
