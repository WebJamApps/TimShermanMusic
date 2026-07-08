/**
 * @file GigList.spec.tsx
 * @description Comprehensive unit tests for GigList and DataProvider gig-related functionality.
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useContext } from 'react';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import scc from 'socketcluster-client';
import { GigList } from '../../src/App/GigList';

const mockNext = vi.fn();

vi.mock('socketcluster-client', () => {
  return {
    default: {
      create: vi.fn(() => ({
        transmit: vi.fn(),
        receiver: vi.fn(() => ({
          createConsumer: vi.fn(() => ({
            next: mockNext,
          })),
        })),
        disconnect: vi.fn(),
      })),
    },
  };
});
import { DataContext, DataProvider, Igig } from '../../src/providers/Data.provider';

const mockGigs: Igig[] = [
  {
    _id: 'g1',
    venue: 'Future Venue A',
    datetime: '2026-12-15T19:00:00.000Z',
    location: 'Richmond, VA',
    tickets: 'https://tickets.example.com/g1',
    duration: 3,
  },
  {
    _id: 'g2',
    venue: 'Future Venue B',
    datetime: '2026-11-20T20:30:00.000Z',
    city: 'Alexandria',
    usState: 'Virginia',
    tickets: 'Free',
  },
  {
    _id: 'g3',
    venue: 'Past Venue C',
    datetime: '2020-01-01T18:00:00.000Z',
    location: 'Denver, CO',
    tickets: '<a href="https://custom.link">Custom</a>',
  },
];

describe('GigList component tests', () => {
  it('renders loading state when gigs is null', () => {
    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: null, setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    expect(screen.getByTestId('gigs-loading')).toBeInTheDocument();
    expect(screen.getByText(/Loading gigs.../i)).toBeInTheDocument();
  });

  it('renders empty state when there are no gigs', () => {
    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: [], setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    expect(screen.getByTestId('gigs-empty')).toBeInTheDocument();
    expect(screen.getByText(/No upcoming performances scheduled/i)).toBeInTheDocument();
  });

  it('renders upcoming gigs in ascending sorted order and hides past gigs', () => {
    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: mockGigs, setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    // Past gig should not be rendered
    expect(screen.queryByText('Past Venue C')).not.toBeInTheDocument();

    // Upcoming gigs should be rendered
    expect(screen.getByText('Future Venue A')).toBeInTheDocument();
    expect(screen.getByText('Future Venue B')).toBeInTheDocument();

    // Verify ordering (Venue B datetime 2026-11-20 is before Venue A 2026-12-15)
    const items = screen.getAllByTestId('gig-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Future Venue B');
    expect(items[1]).toHaveTextContent('Future Venue A');
  });

  it('renders ticket details correctly for links, html and text', () => {
    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: mockGigs, setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    // Venue B has "Free"
    expect(screen.getByText('Free')).toBeInTheDocument();

    // Venue A has a tickets link
    const ticketLink = screen.getByRole('link', { name: /Get Tickets/i });
    expect(ticketLink).toBeInTheDocument();
    expect(ticketLink).toHaveAttribute('href', 'https://tickets.example.com/g1');
  });

  it('renders tickets-free badge when tickets is missing', () => {
    const gigNoTickets: Igig[] = [
      {
        _id: 'g4',
        venue: 'No Tickets Venue',
        datetime: '2026-10-10T18:00:00.000Z',
      },
    ];

    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: gigNoTickets, setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    expect(screen.getByText('Free Entry')).toBeInTheDocument();
  });

  it('handles custom HTML ticket links', () => {
    const gigHtmlTickets: Igig[] = [
      {
        _id: 'g5',
        venue: 'HTML Tickets Venue',
        datetime: '2026-10-10T18:00:00.000Z',
        tickets: '<a href="https://myhtml.com">Buy Here</a>',
      },
    ];

    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: gigHtmlTickets, setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    const link = screen.getByRole('link', { name: /Buy Here/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://myhtml.com');
  });
});

describe('DataProvider gig-fetching tests', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches gigs and populates gigs state', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    mockNext.mockResolvedValueOnce({
      value: mockGigs,
      done: true,
    });

    const ConsumerComponent = () => {
      const { gigs } = useContext(DataContext);
      return (
        <div>
          {gigs ? <div data-testid="gigs-loaded">{gigs.length} gigs</div> : <div data-testid="loading">loading</div>}
        </div>
      );
    };

    render(
      <DataProvider>
        <ConsumerComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('gigs-loaded')).toBeInTheDocument();
      expect(screen.getByText('3 gigs')).toBeInTheDocument();
    });

    expect(scc.create).toHaveBeenCalled();
  });

  it('handles gig fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const sccCreateSpy = vi.spyOn(scc, 'create').mockImplementationOnce(() => {
      throw new Error('Socket creation failed');
    });

    render(
      <DataProvider>
        <div />
      </DataProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Socket creation failed');
    });
    consoleSpy.mockRestore();
    sccCreateSpy.mockRestore();
  });
});
