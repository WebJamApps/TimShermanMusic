/**
 * @file socialLinks.ts
 * @description Named constants for social profile addresses and YouTube player embed.
 */

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@timsherman4865';
export const YOUTUBE_PLAYLIST_ID = 'PLdxKg_26VhE0';
export const YOUTUBE_PLAYER_URL = 'https://www.youtube.com/embed/videoseries?list=PLdxKg_26VhE0&enablejsapi=1';

export const FACEBOOK_URL = 'https://www.facebook.com/tim.sherman.1213';
export const INSTAGRAM_URL = 'https://www.instagram.com/timey_shermaney/';
export const YOUTUBE_URL = YOUTUBE_CHANNEL_URL;

export interface SocialLinkItem {
  readonly name: 'Facebook' | 'Instagram' | 'YouTube';
  readonly href: string;
  readonly label: string;
}

export const SOCIAL_LINKS: readonly SocialLinkItem[] = [
  {
    name: 'Facebook',
    href: FACEBOOK_URL,
    label: 'Tim Sherman on Facebook',
  },
  {
    name: 'Instagram',
    href: INSTAGRAM_URL,
    label: 'Tim Sherman on Instagram',
  },
  {
    name: 'YouTube',
    href: YOUTUBE_URL,
    label: 'Tim Sherman on YouTube',
  },
] as const;
