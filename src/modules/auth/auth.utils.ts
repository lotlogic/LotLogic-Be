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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

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

  // Fallback to the AAD id token if Easy Auth didn't project the oid claim.
  const idTokenHeader = req.headers['x-ms-token-aad-id-token'];
  const idToken = Array.isArray(idTokenHeader) ? idTokenHeader[0] : idTokenHeader;
  if (idToken) {
    const payload = decodeJwtPayload(idToken);
    const oid = payload?.oid;
    if (typeof oid === 'string' && oid.trim()) return oid;
    const sub = payload?.sub;
    if (typeof sub === 'string' && sub.trim()) return sub;
  }

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
