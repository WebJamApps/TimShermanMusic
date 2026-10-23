/**
 * @file SocialLinks.spec.tsx
 * @description Unit tests for SocialLinks component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SocialLinks } from '../../src/App/SocialLinks';
import { SOCIAL_LINKS } from '../../src/lib/socialLinks';

describe('SocialLinks', () => {
  it('renders three round social link icon buttons with exact href, target, rel and accessible name', () => {
    render(<SocialLinks />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);

    for (const [index, expected] of SOCIAL_LINKS.entries()) {
      const link = links[index];
      expect(link).toHaveAttribute('href', expected.href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAccessibleName(expected.label);
    }
  });
});
