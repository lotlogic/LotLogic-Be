import { ClientPrincipal } from '@/modules/auth/auth.types';
import { Request } from 'express';

const CLAIM_TYPE_ALIASES = [
  'http://schemas.microsoft.com/identity/claims/objectidentifier',
  'oid',
  'sub',
];

const EMAIL_TYPE_ALIASES = [
  'preferred_username',
  'email',
  'upn',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
];

const NAME_TYPE_ALIASES = [
  'name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
];

export function parseClientPrincipal(req: Request): ClientPrincipal | null {
  const headerValue = req.headers['x-ms-client-principal'];
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

export function extractClaim(
  principal: ClientPrincipal | null,
  types: string[],
): string | undefined {
  if (!principal?.claims) return undefined;
  const match = principal.claims.find((claim) => types.includes(claim.typ));
  return match?.val;
}

export function extractExternalAuthId(
  principal: ClientPrincipal | null,
  req: Request,
): string | undefined {
  const claimId = extractClaim(principal, CLAIM_TYPE_ALIASES);
  if (claimId) return claimId;

  if (principal?.userId) return principal.userId;

  const headerValue = req.headers['x-ms-client-principal-id'];
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return raw || undefined;
}

export function extractEmail(principal: ClientPrincipal | null): string | undefined {
  return extractClaim(principal, EMAIL_TYPE_ALIASES);
}

export function extractDisplayName(
  principal: ClientPrincipal | null,
): string | undefined {
  return extractClaim(principal, NAME_TYPE_ALIASES) || principal?.userDetails;
}
