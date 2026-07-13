/**
 * @file sanitizePlainText.ts
 * @description Strip HTML/script-like content so admin-editable brand strings stay plain text.
 */

/** Default page header title when no branding record exists yet. */
export const DEFAULT_PAGE_TITLE = 'Tim Sherman';

/** Default page header subtitle/tagline when no branding record exists yet. */
export const DEFAULT_PAGE_SUBTITLE = 'Soulful Gigs, Live Music & Booking';

/**
 * Reduce arbitrary input to plain display text:
 * - strips HTML tags
 * - removes script/event-handler-ish fragments
 * - decodes common HTML entities
 * - collapses whitespace and trims
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== 'string') return '';

  let text = input;

  // Remove script/style blocks entirely (content included)
  text = text.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Drop javascript: / data: URLs if pasted as plain text
  text = text.replace(/(?:javascript|data)\s*:/gi, '');

  // Drop on* event handler attribute-style fragments that may remain after tag strip
  text = text.replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '');
  text = text.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');

  // Decode a few common entities so operators can paste from rich editors safely
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) && code > 0 && code < 0x110000
        ? String.fromCodePoint(code)
        : '';
    });

  // Strip any residual angle brackets / control chars (char-code filter avoids no-control-regex)
  text = text.replace(/[<>]/g, '');
  text = Array.from(text)
    .filter(ch => {
      const code = ch.charCodeAt(0);
      // Keep printable chars; drop C0 controls (except tab/newline/CR) and DEL
      if (code === 0x09 || code === 0x0a || code === 0x0d) return true;
      return code >= 0x20 && code !== 0x7f;
    })
    .join('');

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Resolve a stored branding field to a display value.
 * Missing/blank stored values fall back to the given default.
 */
export function resolveBrandingField(
  stored: string | null | undefined,
  fallback: string,
): string {
  if (stored == null) return fallback;
  const cleaned = sanitizePlainText(stored);
  return cleaned === '' ? fallback : cleaned;
}
