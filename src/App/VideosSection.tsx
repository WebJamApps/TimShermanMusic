/**
 * @file VideosSection.tsx
 * @description Embedded YouTube playlist player card directly following About Tim.
 */

import React from 'react';
import { YOUTUBE_PLAYER_URL } from '../lib/socialLinks';

export function VideosSection(): React.JSX.Element {
  return (
    <section className="bio-section-container" aria-labelledby="videos-title" data-testid="videos-section">
      <div className="bio-card video-card">
        <h2 className="bio-title" id="videos-title">Videos</h2>
        <div className="video-frame">
          <iframe
            src={YOUTUBE_PLAYER_URL}
            title="Tim Sherman on YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
