/**
 * @file BioSection.spec.tsx
 * @description Unit tests for the BioSection component.
 */

import { render, screen } from '@testing-library/react';
import { BioSection } from 'src/App/BioSection';
import { DataContext } from 'src/providers/Data.provider';
import { expect, describe, it } from 'vitest';

describe('BioSection Component', () => {
  it('renders a loading skeleton when bio is null (not loaded yet)', () => {
    const mockContext = {
      pics: null,
      setPics: () => {},
      gigs: null,
      setGigs: () => {},
      bio: null,
      setBio: () => {},
    };

    render(
      <DataContext.Provider value={mockContext}>
        <BioSection />
      </DataContext.Provider>
    );

    expect(screen.getByTestId('bio-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('bio-section')).not.toBeInTheDocument();
  });

  it('renders nothing when bio is empty string', () => {
    const mockContext = {
      pics: null,
      setPics: () => {},
      gigs: null,
      setGigs: () => {},
      bio: '',
      setBio: () => {},
    };

    const { container } = render(
      <DataContext.Provider value={mockContext}>
        <BioSection />
      </DataContext.Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders paragraphs correctly when bio is provided', () => {
    const mockContext = {
      pics: null,
      setPics: () => {},
      gigs: null,
      setGigs: () => {},
      bio: 'Tim is a guitarist.\n\nHe has played music for 20 years.',
      setBio: () => {},
    };

    render(
      <DataContext.Provider value={mockContext}>
        <BioSection />
      </DataContext.Provider>
    );

    expect(screen.getByTestId('bio-section')).toBeInTheDocument();
    expect(screen.getByText('About Tim')).toBeInTheDocument();
    expect(screen.getByText('Tim is a guitarist.')).toBeInTheDocument();
    expect(screen.getByText('He has played music for 20 years.')).toBeInTheDocument();
  });
});
