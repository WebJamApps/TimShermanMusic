/**
 * @file fetchGigs.spec.tsx
 * @description Unit tests for fetchGigs.tsx provider.
 */

import { vi, expect, describe, it } from 'vitest';
import scc from 'socketcluster-client';
import fetchGigs from '../../src/providers/fetchGigs';

vi.mock('socketcluster-client', () => {
  return {
    default: {
      create: vi.fn(() => ({
        transmit: vi.fn(),
        receiver: vi.fn(() => ({
          createConsumer: vi.fn(() => ({
            next: vi.fn().mockResolvedValue({ value: [], done: true }),
          })),
        })),
        disconnect: vi.fn(),
      })),
    },
  };
});

describe('fetchGigs', () => {
  it('getGigs runs successfully', () => {
    const setGigs = vi.fn();
    expect(fetchGigs.getGigs(setGigs)).toBe(true);
  });

  it('getGigs catches error', () => {
    const sccCreateSpy = vi.spyOn(scc, 'create').mockImplementationOnce(() => {
      throw new Error('failed');
    });
    const setGigs = vi.fn();
    expect(fetchGigs.getGigs(setGigs)).toBe(false);
    sccCreateSpy.mockRestore();
  });
});
