/**
 * @file sanitizePlainText.spec.ts
 * @description Unit tests for plain-text sanitization of admin-editable brand strings.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizePlainText,
  resolveBrandingField,
  DEFAULT_PAGE_TITLE,
  DEFAULT_PAGE_SUBTITLE,
} from '../../src/lib/sanitizePlainText';

describe('sanitizePlainText', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizePlainText(null as unknown as string)).toBe('');
    expect(sanitizePlainText(undefined as unknown as string)).toBe('');
  });

  it('passes through plain text unchanged (aside from trim/collapse)', () => {
    expect(sanitizePlainText('  Tim   Sherman  ')).toBe('Tim Sherman');
  });

  it('strips HTML tags', () => {
    expect(sanitizePlainText('<b>Tim</b> <em>Sherman</em>')).toBe('Tim Sherman');
    expect(sanitizePlainText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('removes script and style blocks including their content', () => {
    expect(sanitizePlainText('Hello<script>alert(1)</script>World')).toBe('HelloWorld');
    expect(sanitizePlainText('A<style>body{display:none}</style>B')).toBe('AB');
  });

  it('strips javascript: and data: URL schemes', () => {
    expect(sanitizePlainText('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizePlainText('data:text/html,hi')).toBe('text/html,hi');
  });

  it('decodes common HTML entities', () => {
    expect(sanitizePlainText('Soulful Gigs &amp; Booking')).toBe('Soulful Gigs & Booking');
    expect(sanitizePlainText('A&nbsp;B')).toBe('A B');
    expect(sanitizePlainText('&lt;tag&gt; &quot;x&quot; &#39;y&#39; &#x27;z&#x27;')).toBe('tag "x" \'y\' \'z\'');
  });

  it('decodes numeric HTML entities and drops invalid ones', () => {
    expect(sanitizePlainText('A&#65;B')).toBe('AAB');
    expect(sanitizePlainText('bad&#0;code')).toBe('badcode');
    expect(sanitizePlainText('bad&#999999999;code')).toBe('badcode');
  });

  it('strips residual angle brackets and control characters', () => {
    expect(sanitizePlainText('Tim < Sherman')).toBe('Tim Sherman');
    expect(sanitizePlainText('Tim\u0000Sherman')).toBe('TimSherman');
    // tab/newline/CR kept then collapsed to a single space by whitespace normalizer
    expect(sanitizePlainText('Tim\tSherman\nMusic\rYes')).toBe('Tim Sherman Music Yes');
    expect(sanitizePlainText(`Tim${String.fromCharCode(0x7f)}Sherman`)).toBe('TimSherman');
  });

  it('strips leftover event-handler attribute fragments', () => {
    expect(sanitizePlainText('hello onerror="alert(1)" world')).toBe('hello world');
    expect(sanitizePlainText('hello onclick=alert(1) world')).toBe('hello world');
  });
});

describe('resolveBrandingField', () => {
  it('uses fallback when stored value is null, undefined, or blank after sanitize', () => {
    expect(resolveBrandingField(null, DEFAULT_PAGE_TITLE)).toBe(DEFAULT_PAGE_TITLE);
    expect(resolveBrandingField(undefined, DEFAULT_PAGE_SUBTITLE)).toBe(DEFAULT_PAGE_SUBTITLE);
    expect(resolveBrandingField('   ', DEFAULT_PAGE_TITLE)).toBe(DEFAULT_PAGE_TITLE);
    expect(resolveBrandingField('<script></script>', DEFAULT_PAGE_TITLE)).toBe(DEFAULT_PAGE_TITLE);
  });

  it('returns sanitized stored value when present', () => {
    expect(resolveBrandingField('<b>Live Music</b>', DEFAULT_PAGE_SUBTITLE)).toBe('Live Music');
    expect(resolveBrandingField('Custom Title', DEFAULT_PAGE_TITLE)).toBe('Custom Title');
  });
});
