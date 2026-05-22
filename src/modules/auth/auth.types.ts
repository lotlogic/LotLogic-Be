export type AuthRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: bigint;
  externalAuthId: string;
  email?: string;
  displayName?: string;
  role: AuthRole;
  registered?: boolean;
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
