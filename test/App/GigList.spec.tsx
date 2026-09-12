/**
 * @file GigList.spec.tsx
 * @description Comprehensive unit tests for GigList and DataProvider gig-related functionality.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('renders upcoming gigs in ascending sorted order and past gigs in past section', () => {
    render(
      <DataContext.Provider value={{ pics: null, setPics: () => {}, gigs: mockGigs, setGigs: () => {} }}>
        <GigList />
      </DataContext.Provider>
    );

    // Upcoming gigs should be rendered
    expect(screen.getByText('Future Venue A')).toBeInTheDocument();
    expect(screen.getByText('Future Venue B')).toBeInTheDocument();

    // Verify upcoming ordering (Venue B datetime 2026-11-20 is before Venue A 2026-12-15)
    const upcomingItems = screen.getAllByTestId('gig-item');
    expect(upcomingItems).toHaveLength(2);
    expect(upcomingItems[0]).toHaveTextContent('Future Venue B');
    expect(upcomingItems[1]).toHaveTextContent('Future Venue A');

    // Past gig should be rendered in past gigs section
    const pastItems = screen.getAllByTestId('past-gig-item');
    expect(pastItems).toHaveLength(1);
    expect(pastItems[0]).toHaveTextContent('Past Venue C');
    expect(pastItems[0]).toHaveTextContent('Past Event');
  });

  it('hides past gigs when their id is listed in hiddenGigIds', () => {
    render(
      <DataContext.Provider
        value={{
          pics: null,
          setPics: () => {},
          gigs: mockGigs,
          setGigs: () => {},
          pastGigsConfig: { hiddenGigIds: ['g3'] },
        }}
      >
        <GigList />
      </DataContext.Provider>
    );

    // Past Venue C is hidden
    expect(screen.queryByText('Past Venue C')).not.toBeInTheDocument();
    expect(screen.queryByTestId('past-gig-item')).not.toBeInTheDocument();
    expect(screen.queryByText('Past Performances')).not.toBeInTheDocument();
  });

  it('paginates past performances at 4 items per page with navigation controls', () => {
    const manyPastGigs: Igig[] = [
      { _id: 'p1', venue: 'Past 2024-01', datetime: '2024-01-01T19:00:00.000Z' },
      { _id: 'p2', venue: 'Past 2024-02', datetime: '2024-02-01T19:00:00.000Z' },
      { _id: 'p3', venue: 'Past 2024-03', datetime: '2024-03-01T19:00:00.000Z' },
      { _id: 'p4', venue: 'Past 2024-04', datetime: '2024-04-01T19:00:00.000Z' },
      { _id: 'p5', venue: 'Past 2024-05', datetime: '2024-05-01T19:00:00.000Z' },
      { _id: 'p6', venue: 'Past 2024-06', datetime: '2024-06-01T19:00:00.000Z' },
    ];

    render(
      <DataContext.Provider
        value={{
          pics: null,
          setPics: () => {},
          gigs: manyPastGigs,
          setGigs: () => {},
          pastGigsConfig: { hiddenGigIds: [] },
        }}
      >
        <GigList />
      </DataContext.Provider>
    );

    // Sorted most recent first: 2024-06, 2024-05, 2024-04, 2024-03 on Page 1
    const page1Items = screen.getAllByTestId('past-gig-item');
    expect(page1Items).toHaveLength(4);
    expect(page1Items[0]).toHaveTextContent('Past 2024-06');
    expect(page1Items[1]).toHaveTextContent('Past 2024-05');
    expect(page1Items[2]).toHaveTextContent('Past 2024-04');
    expect(page1Items[3]).toHaveTextContent('Past 2024-03');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Click Next
    fireEvent.click(nextBtn);

    const page2Items = screen.getAllByTestId('past-gig-item');
    expect(page2Items).toHaveLength(2);
    expect(page2Items[0]).toHaveTextContent('Past 2024-02');
    expect(page2Items[1]).toHaveTextContent('Past 2024-01');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeDisabled();

    // Click Previous
    fireEvent.click(prevBtn);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('does not collapse the whole past section when hiddenGigIds contains a stray empty string (id-less gig)', () => {
    const gigsWithIdless: Igig[] = [
      // Mirrors defaultGig from fetchGigs.tsx: no _id, id defaults to 0.
      { _id: '', id: 0, venue: 'Idless Venue', datetime: '2020-01-01T18:00:00.000Z' },
      { _id: 'g3', venue: 'Past Venue C', datetime: '2020-02-01T18:00:00.000Z' },
    ];

    render(
      <DataContext.Provider
        value={{
          pics: null,
          setPics: () => {},
          gigs: gigsWithIdless,
          setGigs: () => {},
          pastGigsConfig: { hiddenGigIds: [''] },
        }}
      >
        <GigList />
      </DataContext.Provider>
    );

    // Neither gig has a stable id that the stray '' entry can match, so the
    // whole Past Performances section must still render both gigs.
    expect(screen.getByText('Past Performances')).toBeInTheDocument();
    expect(screen.getByText('Idless Venue')).toBeInTheDocument();
    expect(screen.getByText('Past Venue C')).toBeInTheDocument();
    expect(screen.getAllByTestId('past-gig-item')).toHaveLength(2);
  });

  it('keeps Previous/Next responsive after the past-gigs list shrinks while paged forward', () => {
    const manyPastGigs: Igig[] = Array.from({ length: 12 }, (_, i) => ({
      _id: `p${i + 1}`,
      venue: `Past ${i + 1}`,
      datetime: new Date(2020, 0, i + 1).toISOString(),
    }));

    const { rerender } = render(
      <DataContext.Provider
        value={{
          pics: null,
          setPics: () => {},
          gigs: manyPastGigs,
          setGigs: () => {},
          pastGigsConfig: { hiddenGigIds: [] },
        }}
      >
        <GigList />
      </DataContext.Provider>
    );

    const nextBtn = () => screen.getByRole('button', { name: /Next/i });
    const prevBtn = () => screen.getByRole('button', { name: /Previous/i });

    fireEvent.click(nextBtn()); // page 1 -> 2
    fireEvent.click(nextBtn()); // page 2 -> 3
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();

    // The list shrinks (e.g. gigs re-arrive over SocketCluster with fewer
    // entries than pastGigsConfig, fetched separately over REST, expects).
    const shrunkGigs = manyPastGigs.slice(0, 8);
    rerender(
      <DataContext.Provider
        value={{
          pics: null,
          setPics: () => {},
          gigs: shrunkGigs,
          setGigs: () => {},
          pastGigsConfig: { hiddenGigIds: [] },
        }}
      >
        <GigList />
      </DataContext.Provider>
    );

    // Rendered page clamps down automatically.
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    // Clicking Previous must move the visible page. Before the fix, the
    // handler mutated the stale unclamped `pastPage` (3) instead of the
    // clamped, rendered `currentPastPage` (2), so this first click was a
    // dead click that left the page on "Page 2 of 2".
    fireEvent.click(prevBtn());
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
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
