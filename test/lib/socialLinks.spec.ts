/**
 * @file socialLinks.spec.ts
 * @description Unit tests for socialLinks constants.
 */

import { describe, it, expect } from 'vitest';
import {
  YOUTUBE_PLAYER_URL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  YOUTUBE_URL,
  SOCIAL_LINKS,
} from '../../src/lib/socialLinks';

describe('socialLinks constants', () => {
  it('defines the expected player and profile addresses', () => {
    expect(YOUTUBE_PLAYER_URL).toBe('https://www.youtube.com/embed/videoseries?list=PLdxKg_26VhE0');
    expect(FACEBOOK_URL).toBe('https://www.facebook.com/tim.sherman.1213');
    expect(INSTAGRAM_URL).toBe('https://www.instagram.com/timey_shermaney/');
    expect(YOUTUBE_URL).toBe('https://www.youtube.com/@timsherman4865');
    expect(SOCIAL_LINKS).toHaveLength(3);
  });
});
