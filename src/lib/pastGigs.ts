/**
 * @file pastGigs.ts
 * @description Shared helpers for the "past performances" feature so the
 * public GigList and the admin ManagePastGigs sub-modal always agree on
 * which gigs count as past, how they are sorted, and how a gig is
 * identified for hide/show purposes.
 */

import type { Igig } from '../providers/Data.provider';

/**
 * ISO boundary before which a gig counts as "past". A gig dated today still
 * shows as upcoming; only gigs before yesterday are past.
 */
export function getPastGigBoundaryIso(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString();
}

/** Selects gigs strictly before the past-gig boundary, sorted most-recent-first. */
export function selectPastGigs(gigs: Igig[] | null | undefined): Igig[] {
  const boundaryIso = getPastGigBoundaryIso();
  return (gigs || [])
    .filter(g => typeof g.datetime === 'string' && g.datetime < boundaryIso)
    .sort((a, b) => (a.datetime && b.datetime ? b.datetime.localeCompare(a.datetime) : 0));
}

/**
 * A stable identifier for a gig, usable as a hiddenGigIds entry or list key.
 * Returns null when a gig has neither a real `_id` nor a truthy numeric
 * `id` (e.g. an unsaved/default gig) so that an empty string can never be
 * written into hiddenGigIds nor mistakenly match every id-less gig on read.
 */
export function getStableGigId(gig: Igig): string | null {
  if (gig._id) return gig._id;
  if (gig.id) return String(gig.id);
  return null;
}

/** True when the gig has a stable id and that id is present in hiddenIds. */
export function isGigHidden(gig: Igig, hiddenIds: ReadonlySet<string>): boolean {
  const id = getStableGigId(gig);
  return id !== null && hiddenIds.has(id);
}
