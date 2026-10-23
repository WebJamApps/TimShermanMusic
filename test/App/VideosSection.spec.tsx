/**
 * @file VideosSection.spec.tsx
 * @description Unit tests for VideosSection component.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideosSection } from '../../src/App/VideosSection';
import { YOUTUBE_PLAYER_URL } from '../../src/lib/socialLinks';

const ARIA_CURRENT = 'aria-current';

describe('VideosSection', () => {
  beforeEach(() => {
    delete (window as { YT?: unknown }).YT;
    delete (window as { onYouTubeIframeAPIReady?: unknown }).onYouTubeIframeAPIReady;
  });

  afterEach(() => {
    delete (window as { YT?: unknown }).YT;
    delete (window as { onYouTubeIframeAPIReady?: unknown }).onYouTubeIframeAPIReady;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the videos section with heading and embedded YouTube playlist iframe', () => {
    render(<VideosSection />);

    const heading = screen.getByRole('heading', { name: 'Videos' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('bio-title');

    const iframe = screen.getByTitle('Tim Sherman on YouTube');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('id', 'tim-player');
    expect(iframe).toHaveAttribute('src', YOUTUBE_PLAYER_URL);
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/videoseries?list=PLdxKg_26VhE0&enablejsapi=1'
    );
    expect(iframe).toHaveAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    );
    expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });

  it('renders thumbnail row in playlist order, calls playVideoAt(1) on click, and updates aria-current', async () => {
    const playVideoAtMock = vi.fn();
    let stateChangeHandler: (() => void) | undefined;
    let playlistIndex = 0;

    const mockPlayer = {
      getPlaylist: vi.fn().mockReturnValue(['vid-1', 'vid-2', 'vid-3']),
      getPlaylistIndex: vi.fn().mockImplementation(() => playlistIndex),
      playVideoAt: playVideoAtMock,
      destroy: vi.fn(),
    };

    window.YT = {
      Player: vi.fn().mockImplementation(function (_elementId, options) {
        stateChangeHandler = options.events?.onStateChange;
        setTimeout(() => {
          options.events?.onReady?.({ target: mockPlayer });
        }, 0);
        return mockPlayer;
      }),
    };

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('vid-1')) {
        return {
          ok: true,
          json: async () => ({ title: 'My Ship' }),
        };
      }
      if (url.includes('vid-2')) {
        return {
          ok: true,
          json: async () => ({ title: 'Little girl blue' }),
        };
      }
      if (url.includes('vid-3')) {
        return {
          ok: true,
          json: async () => ({ title: 'Poinciana' }),
        };
      }
      return { ok: false };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<VideosSection />);

    const buttons = await screen.findAllByRole('button', { name: /^Play / });
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAccessibleName('Play My Ship');
    expect(buttons[1]).toHaveAccessibleName('Play Little girl blue');
    expect(buttons[2]).toHaveAccessibleName('Play Poinciana');

    // First thumbnail is current on load
    expect(buttons[0]).toHaveAttribute(ARIA_CURRENT, 'true');
    expect(buttons[1]).not.toHaveAttribute(ARIA_CURRENT);
    expect(buttons[2]).not.toHaveAttribute(ARIA_CURRENT);

    // Clicking second thumbnail calls playVideoAt(1) and moves aria-current
    fireEvent.click(buttons[1]);
    expect(playVideoAtMock).toHaveBeenCalledWith(1);
    expect(buttons[0]).not.toHaveAttribute(ARIA_CURRENT);
    expect(buttons[1]).toHaveAttribute(ARIA_CURRENT, 'true');
    expect(buttons[2]).not.toHaveAttribute(ARIA_CURRENT);

    // Simulating player state change updates aria-current
    playlistIndex = 2;
    act(() => {
      stateChangeHandler?.();
    });
    await waitFor(() => {
      expect(buttons[2]).toHaveAttribute(ARIA_CURRENT, 'true');
      expect(buttons[1]).not.toHaveAttribute(ARIA_CURRENT);
    });
  });

  it('falls back to "Video" when oEmbed fails to fetch title', async () => {
    const mockPlayer = {
      getPlaylist: vi.fn().mockReturnValue(['vid-a', 'vid-b']),
      getPlaylistIndex: vi.fn().mockReturnValue(0),
      playVideoAt: vi.fn(),
      destroy: vi.fn(),
    };

    window.YT = {
      Player: vi.fn().mockImplementation(function (_elementId, options) {
        setTimeout(() => {
          options.events?.onReady?.({ target: mockPlayer });
        }, 0);
        return mockPlayer;
      }),
    };

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<VideosSection />);

    const buttons = await screen.findAllByRole('button', { name: /^Play / });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName('Play Video');
    expect(buttons[1]).toHaveAccessibleName('Play Video');
  });

  it('keeps the thumbnail row hidden when playlist holds fewer than two videos', async () => {
    const mockPlayer = {
      getPlaylist: vi.fn().mockReturnValue(['single-video']),
      getPlaylistIndex: vi.fn().mockReturnValue(0),
      playVideoAt: vi.fn(),
      destroy: vi.fn(),
    };

    window.YT = {
      Player: vi.fn().mockImplementation(function (_elementId, options) {
        setTimeout(() => {
          options.events?.onReady?.({ target: mockPlayer });
        }, 0);
        return mockPlayer;
      }),
    };

    render(<VideosSection />);

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(screen.queryByRole('button', { name: /^Play / })).not.toBeInTheDocument();
    const list = document.querySelector('.video-thumbs');
    expect(list).toHaveAttribute('hidden');
  });

  it('keeps the thumbnail row hidden when player script never loads', async () => {
    render(<VideosSection />);

    expect(screen.queryByRole('button', { name: /^Play / })).not.toBeInTheDocument();
    const list = document.querySelector('.video-thumbs');
    expect(list).toHaveAttribute('hidden');
  });
});
