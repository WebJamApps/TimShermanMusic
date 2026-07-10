/**
 * @file tokenExpiry.ts
 * @description Decodes JWT claims in the browser to support session expiration and admin routing.
 */

export function getTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const part = (token || '').split('.')[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(atob(b64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTokenExp(token: string): number | null {
  const exp = getTokenPayload(token)?.exp;
  return typeof exp === 'number' ? exp : null;
}

export function getTokenSub(token: string): string | null {
  const sub = getTokenPayload(token)?.sub;
  return typeof sub === 'string' ? sub : null;
}

export function isTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return false;
  return exp * 1000 <= nowMs;
}
