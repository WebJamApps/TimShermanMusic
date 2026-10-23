/**
 * @file VideosSection.spec.tsx
 * @description Unit tests for VideosSection component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VideosSection } from '../../src/App/VideosSection';
import { YOUTUBE_PLAYER_URL } from '../../src/lib/socialLinks';

describe('VideosSection', () => {
  it('renders the videos section with heading and embedded YouTube playlist iframe', () => {
    render(<VideosSection />);

    const heading = screen.getByRole('heading', { name: 'Videos' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('bio-title');

    const iframe = screen.getByTitle('Tim Sherman on YouTube');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', YOUTUBE_PLAYER_URL);
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/videoseries?list=PLdxKg_26VhE0&enablejsapi=1');
    expect(iframe).toHaveAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    );
    expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });
});
