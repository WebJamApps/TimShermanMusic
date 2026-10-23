/**
 * @file VideosSection.tsx
 * @description Embedded YouTube playlist player card directly following About Tim.
 */

import React, { useEffect, useRef, useState } from 'react';
import { YOUTUBE_PLAYER_URL } from '../lib/socialLinks';

interface VideoItem {
  readonly id: string;
  readonly title: string;
}

interface YouTubePlayerInstance {
  getPlaylist?: () => string[] | null | undefined;
  getPlaylistIndex?: () => number;
  playVideoAt?: (index: number) => void;
  destroy?: () => void;
}

interface YouTubePlayerOptions {
  events?: {
    onReady?: (event: { target: YouTubePlayerInstance }) => void;
    onStateChange?: (event: unknown) => void;
  };
}

interface YouTubeNamespace {
  Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

async function fetchVideoTitle(id: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`
    );
    if (!res.ok) return 'Video';
    const data = (await res.json()) as { title?: string };
    return data?.title || 'Video';
  } catch {
    return 'Video';
  }
}

function createPlayerIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.id = 'tim-player';
  iframe.src = YOUTUBE_PLAYER_URL;
  iframe.title = 'Tim Sherman on YouTube';
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  );
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  return iframe;
}

export function VideosSection(): React.JSX.Element {
  const [videos, setVideos] = useState<readonly VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let playerInstance: YouTubePlayerInstance | null = null;

    const buildRow = async (player: YouTubePlayerInstance) => {
      try {
        let ids = player.getPlaylist?.() || [];
        if (!ids || ids.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
          if (!isMounted) return;
          ids = player.getPlaylist?.() || [];
        }
        if (!ids || ids.length < 2) return;

        const items = await Promise.all(
          ids.map(async id => ({
            id,
            title: await fetchVideoTitle(id),
          }))
        );

        if (!isMounted) return;
        setVideos(items);
        const initialIdx = Math.max(0, player.getPlaylistIndex?.() ?? 0);
        setCurrentIndex(initialIdx);
      } catch {
        // Ignore failure, row stays hidden
      }
    };

    const handleLateTarget = () => {
      if (!isMounted) return;
      const lateTarget = playerInstance || playerRef.current;
      if (lateTarget) void buildRow(lateTarget);
    };

    const ensureIframe = (): HTMLElement | null => {
      let iframe = document.getElementById('tim-player');
      if (!iframe && frameRef.current) {
        iframe = createPlayerIframe();
        frameRef.current.append(iframe);
      }
      return iframe;
    };

    const initPlayer = () => {
      if (!isMounted || !window.YT?.Player) return;
      ensureIframe();
      try {
        playerInstance = new window.YT.Player('tim-player', {
          events: {
            onReady: event => {
              if (!isMounted) return;
              const target = playerInstance || event?.target || playerRef.current;
              if (target) {
                void buildRow(target);
              } else {
                setTimeout(handleLateTarget, 0);
              }
            },
            onStateChange: () => {
              if (!isMounted) return;
              const activePlayer = playerInstance || playerRef.current;
              const idx = activePlayer?.getPlaylistIndex?.();
              if (typeof idx === 'number' && idx >= 0) {
                setCurrentIndex(idx);
              }
            },
          },
        });
        playerRef.current = playerInstance;
      } catch {
        // Ignore player creation errors
      }
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prevOnReady = window.onYouTubeIframeAPIReady;
      Reflect.set(window, 'onYouTubeIframeAPIReady', () => {
        if (typeof prevOnReady === 'function') {
          prevOnReady();
        }
        initPlayer();
      });

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.body.append(tag);
      }
    }

    return () => {
      isMounted = false;
      try {
        playerInstance?.destroy?.();
      } catch {
        // Ignore destroy errors
      }
      ensureIframe();
    };
  }, []);

  return (
    <section className="bio-section-container" aria-labelledby="videos-title" data-testid="videos-section">
      <div className="bio-card video-card">
        <h2 className="bio-title" id="videos-title">Videos</h2>
        <div className="video-frame" ref={frameRef}>
          <iframe
            id="tim-player"
            src={YOUTUBE_PLAYER_URL}
            title="Tim Sherman on YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <ul
          className="video-thumbs"
          id="video-thumbs"
          aria-label="Tim's videos"
          hidden={videos.length < 2}
        >
          {videos.map((video, index) => {
            const isCurrent = index === currentIndex;
            return (
              <li key={video.id}>
                <button
                  type="button"
                  className="video-thumb"
                  aria-label={`Play ${video.title}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => {
                    playerRef.current?.playVideoAt?.(index);
                    setCurrentIndex(index);
                  }}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                  <span>{video.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
