/**
 * @file tokenExpiry.spec.ts
 * @description Unit tests for token expiration utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  getTokenPayload,
  getTokenExp,
  getTokenSub,
  isTokenExpired,
} from '../../src/lib/tokenExpiry';

// {"exp": 1700000000, "sub": "test-user-id", "name": "Test User"}
const VALID_PAYLOAD_B64 = 'eyJleHAiOjE3MDAwMDAwMDAsInN1YiI6InRlc3QtdXNlci1pZCIsIm5hbWUiOiJUZXN0IFVzZXIifQ';
const VALID_TOKEN = `header.${VALID_PAYLOAD_B64}.signature`;

describe('tokenExpiry utility library', () => {
  describe('getTokenPayload', () => {
    it('returns parsed payload for valid JWT format', () => {
      const payload = getTokenPayload(VALID_TOKEN);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('test-user-id');
      expect(payload?.exp).toBe(1700000000);
    });

    it('returns null for empty or invalid JWT format', () => {
      expect(getTokenPayload('')).toBeNull();
      expect(getTokenPayload('invalid-format')).toBeNull();
      expect(getTokenPayload('part1.invalid_base64.part3')).toBeNull();
    });
  });

  describe('getTokenExp', () => {
    it('returns exp if number', () => {
      expect(getTokenExp(VALID_TOKEN)).toBe(1700000000);
    });

    it('returns null if token is invalid or does not have exp', () => {
      expect(getTokenExp('')).toBeNull();
      const noExpToken = 'h.eyJzdWIiOiIxMjMifQ.s';
      expect(getTokenExp(noExpToken)).toBeNull();
    });
  });

  describe('getTokenSub', () => {
    it('returns sub if string', () => {
      expect(getTokenSub(VALID_TOKEN)).toBe('test-user-id');
    });

    it('returns null if token is invalid or does not have sub', () => {
      expect(getTokenSub('')).toBeNull();
      const noSubToken = 'h.eyJleHAiOjEyM30.s';
      expect(getTokenSub(noSubToken)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns true if expired', () => {
      expect(isTokenExpired(VALID_TOKEN, 1800000000000)).toBe(true);
    });

    it('returns false if not expired', () => {
      expect(isTokenExpired(VALID_TOKEN, 1600000000000)).toBe(false);
    });

    it('returns false if token has no exp claim', () => {
      const noExpToken = 'h.eyJzdWIiOiIxMjMifQ.s';
      expect(isTokenExpired(noExpToken)).toBe(false);
    });
  });
});
