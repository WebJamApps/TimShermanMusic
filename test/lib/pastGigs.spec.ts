/**
 * @file pastGigs.spec.ts
 * @description Unit tests for the shared past-gig boundary/sort/identity helpers
 * used by both GigList (public) and AdminPanel's ManagePastGigs (admin curation).
 */

import { describe, it, expect } from 'vitest';
import { getPastGigBoundaryIso, getStableGigId, isGigHidden, selectPastGigs } from '../../src/lib/pastGigs';
import type { Igig } from '../../src/providers/Data.provider';

describe('getPastGigBoundaryIso', () => {
  it('returns an ISO string for yesterday', () => {
    const boundary = getPastGigBoundaryIso();
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    // Compare to the minute to avoid flakiness across the exact millisecond.
    expect(boundary.slice(0, 16)).toBe(expected.toISOString().slice(0, 16));
  });
});

describe('selectPastGigs', () => {
  const gigs: Igig[] = [
    { _id: 'future', venue: 'Future Venue', datetime: '2099-01-01T00:00:00.000Z' },
    { _id: 'old', venue: 'Old Venue', datetime: '2020-01-01T00:00:00.000Z' },
    { _id: 'older', venue: 'Older Venue', datetime: '2019-01-01T00:00:00.000Z' },
    { _id: 'no-date', venue: 'No Date Venue' },
  ];

  it('returns only gigs before the boundary, sorted most-recent-first', () => {
    const result = selectPastGigs(gigs);
    expect(result.map(g => g._id)).toEqual(['old', 'older']);
  });

  it('handles null/undefined gigs', () => {
    expect(selectPastGigs(null)).toEqual([]);
    expect(selectPastGigs(undefined)).toEqual([]);
  });
});

describe('getStableGigId', () => {
  it('prefers _id', () => {
    expect(getStableGigId({ _id: 'abc', venue: 'V', id: 5 })).toBe('abc');
  });

  it('falls back to a truthy numeric id', () => {
    expect(getStableGigId({ venue: 'V', id: 5 })).toBe('5');
  });

  it('returns null for a gig with neither _id nor a truthy id (e.g. defaultGig shape)', () => {
    expect(getStableGigId({ _id: '', venue: 'V', id: 0 })).toBeNull();
    expect(getStableGigId({ venue: 'V' })).toBeNull();
  });
});

describe('isGigHidden', () => {
  it('matches a gig whose stable id is in the hidden set', () => {
    const hidden = new Set(['abc']);
    expect(isGigHidden({ _id: 'abc', venue: 'V' }, hidden)).toBe(true);
  });

  it('never matches an id-less gig, even if the hidden set contains an empty string', () => {
    const hidden = new Set(['']);
    expect(isGigHidden({ _id: '', venue: 'V', id: 0 }, hidden)).toBe(false);
    expect(isGigHidden({ venue: 'V' }, hidden)).toBe(false);
  });
});
