import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mapsWindow = window as typeof window & { __timBookingMapsReady?: () => void };

function mapsScript(): HTMLScriptElement {
  return document.querySelector('script[src*="callback=__timBookingMapsReady"]')!;
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
});

afterEach(() => {
  mapsScript()?.remove();
  delete mapsWindow.__timBookingMapsReady;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Booking Places loader', () => {
  it('loads Places with the supplied browser key and shares one script between mounts', async () => {
    const { loadPlacesLibrary } = await import('src/App/BookingForm/places');
    const library = { AutocompleteSuggestion: {} };
    const importLibrary = vi.fn().mockResolvedValue(library);
    vi.stubGlobal('google', { maps: { importLibrary } });
    const result = loadPlacesLibrary('test browser key');
    expect(loadPlacesLibrary('test browser key')).toBe(result);
    const url = new URL(mapsScript().src);
    expect(url.origin).toBe('https://maps.googleapis.com');
    expect(url.searchParams.get('key')).toBe('test browser key');
    expect(url.searchParams.get('libraries')).toBe('places');
    expect(mapsScript().async).toBe(true);
    mapsWindow.__timBookingMapsReady!();
    await expect(result).resolves.toBe(library);
    expect(importLibrary).toHaveBeenCalledWith('places');
    expect(mapsWindow.__timBookingMapsReady).toBeUndefined();
  });

  it('allows retry after a script error', async () => {
    const { loadPlacesLibrary } = await import('src/App/BookingForm/places');
    const result = loadPlacesLibrary('test-key');
    const rejected = result.catch(error => error);
    mapsScript().dispatchEvent(new Event('error'));
    expect(await rejected).toEqual(new Error('Address suggestions unavailable'));
    expect(mapsScript()).toBeNull();
    const retry = loadPlacesLibrary('test-key');
    const retryRejected = retry.catch(error => error);
    expect(retry).not.toBe(result);
    expect(mapsScript()).toBeInTheDocument();
    mapsScript().dispatchEvent(new Event('error'));
    expect(await retryRejected).toEqual(new Error('Address suggestions unavailable'));
  });

  it('times out rather than leaving the form loading forever', async () => {
    const { loadPlacesLibrary } = await import('src/App/BookingForm/places');
    const result = loadPlacesLibrary('test-key');
    const rejected = result.catch(error => error);
    await vi.advanceTimersByTimeAsync(15000);
    expect(await rejected).toEqual(new Error('Address suggestions unavailable'));
    expect(mapsScript()).toBeNull();
  });

  it('handles a callback without the Maps API', async () => {
    const { loadPlacesLibrary } = await import('src/App/BookingForm/places');
    vi.stubGlobal('google', undefined);
    const result = loadPlacesLibrary('test-key');
    const rejected = result.catch(error => error);
    mapsWindow.__timBookingMapsReady!();
    expect(await rejected).toEqual(new Error('Address suggestions unavailable'));
  });

  it('handles failure to import the Places library', async () => {
    const { loadPlacesLibrary } = await import('src/App/BookingForm/places');
    vi.stubGlobal('google', { maps: { importLibrary: vi.fn().mockRejectedValue(new Error('Unavailable')) } });
    const result = loadPlacesLibrary('test-key');
    const rejected = result.catch(error => error);
    mapsWindow.__timBookingMapsReady!();
    expect(await rejected).toEqual(new Error('Address suggestions unavailable'));
  });
});
