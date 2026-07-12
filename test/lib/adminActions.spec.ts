/**
 * @file adminActions.spec.ts
 * @description Unit tests for admin socket actions, mocking socket transmissions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGig,
  updateGig,
  deleteGig,
  createPic,
  updatePic,
  deletePic,
  updateBio,
} from '../../src/lib/adminActions';

const mockTransmit = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('socketcluster-client', () => {
  return {
    default: {
      create: vi.fn(() => ({
        transmit: mockTransmit,
        disconnect: mockDisconnect,
      })),
    },
  };
});

describe('adminActions SocketCluster transmitters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('createGig transmits newGig payload and disconnects after delay', async () => {
    const callback = vi.fn();
    const gigData = {
      datetime: '2026-07-20T20:00:00.000Z',
      venue: 'The Soundry',
      tickets: 'https://tickets.com',
      city: 'Columbia',
      usState: 'Maryland',
      duration: 2,
      promoImageUrl: 'https://example.com/promo.jpg',
    };

    const p = createGig(gigData, 'mock-token', callback);
    await vi.runAllTimersAsync();
    await p;

    expect(mockTransmit).toHaveBeenCalledWith('newGig', {
      gig: {
        ...gigData,
        artist: 'tim',
      },
      token: 'mock-token',
    });
    expect(mockDisconnect).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it('updateGig transmits editGig payload and disconnects after delay', async () => {
    const callback = vi.fn();
    const gigData = {
      venue: 'The Fillmore',
    };

    const p = updateGig('gig-123', gigData, 'mock-token', callback);
    await vi.runAllTimersAsync();
    await p;

    expect(mockTransmit).toHaveBeenCalledWith('editGig', {
      gigId: 'gig-123',
      token: 'mock-token',
      gig: {
        venue: 'The Fillmore',
        artist: 'tim',
      },
    });
    expect(mockDisconnect).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it('deleteGig transmits deleteGig payload and disconnects after delay', async () => {
    const callback = vi.fn();

    const p = deleteGig('gig-123', 'mock-token', callback);
    await vi.runAllTimersAsync();
    await p;

    expect(mockTransmit).toHaveBeenCalledWith('deleteGig', {
      gig: { gigId: 'gig-123' },
      token: 'mock-token',
    });
    expect(mockDisconnect).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  // Regression guard for the prod tenant leak (issue #34): a photo added on
  // timshermanmusic.com appeared on joshandmariamusic.com because pic writes
  // went over the SocketCluster `jamPics` collection instead of web-jam-back's
  // `/book` REST collection. These tests assert every pic write now targets
  // `/book` directly and is tagged `artist: 'tim'` (create), never the socket.
  describe('pic REST actions (tenant isolation regression guard)', () => {
    let fetchSpy: any;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('createPic performs POST /book tagged with artist: tim, never the socket', async () => {
      const callback = vi.fn();
      const picData = {
        url: 'https://example.com/pic.jpg',
        title: 'Tim Playing Guitar',
        comments: 'showCaption',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: 'new-pic-id' }),
      } as Response);

      await createPic(picData, 'mock-token', callback);

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:7000/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({
          title: picData.title,
          url: picData.url,
          comments: picData.comments,
          type: 'TimShermanMusic-music',
          artist: 'tim',
        }),
      });
      expect(mockTransmit).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('createPic logs error and does not call callback when the request fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const callback = vi.fn();
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' } as Response);

      await createPic({ url: 'x', title: 'y', comments: '' }, 'mock-token', callback);

      expect(consoleErrorSpy).toHaveBeenCalledWith('createPic failed:', expect.any(Error));
      expect(callback).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('updatePic performs PUT /book/:id with the pic fields, never the socket', async () => {
      const callback = vi.fn();
      const picData = {
        _id: 'pic-123',
        url: 'https://example.com/pic-edit.jpg',
        title: 'Tim Singing',
        comments: '',
        type: 'TimShermanMusic-music',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: 1 }),
      } as Response);

      await updatePic(picData, 'mock-token', callback);

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:7000/book/pic-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({
          title: picData.title,
          url: picData.url,
          comments: picData.comments,
        }),
      });
      expect(mockTransmit).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('updatePic logs error when the request fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchSpy.mockRejectedValueOnce(new Error('network down'));

      await updatePic(
        { _id: 'pic-123', url: 'x', title: 'y', comments: '', type: 'TimShermanMusic-music' },
        'mock-token',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('updatePic failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('deletePic performs DELETE /book/:id, never the socket', async () => {
      const callback = vi.fn();

      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: 1 }) } as Response);

      await deletePic('pic-123', 'mock-token', callback);

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:7000/book/pic-123', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
      });
      expect(mockTransmit).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('deletePic logs error gracefully when the request fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' } as Response);

      await deletePic('pic-123', 'mock-token');

      expect(consoleErrorSpy).toHaveBeenCalledWith('deletePic failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateBio action', () => {
    let fetchSpy: any;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('performs POST /book when bio does not exist yet', async () => {
      const callback = vi.fn();

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: 'new-bio-id' }),
      } as Response);

      await updateBio('This is Tim biography text', 'mock-token', callback);

      expect(fetchSpy).toHaveBeenNthCalledWith(1, 'http://localhost:7000/book?type=bio&artist=tim');
      expect(fetchSpy).toHaveBeenNthCalledWith(2, 'http://localhost:7000/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({
          title: 'Bio',
          type: 'bio',
          artist: 'tim',
          comments: 'This is Tim biography text',
        }),
      });

      expect(callback).toHaveBeenCalled();
    });

    it('performs PUT /book/one when bio already exists', async () => {
      const callback = vi.fn();

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ _id: 'existing-id' }],
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: 1 }),
      } as Response);

      await updateBio('Updated biography', 'mock-token', callback);

      expect(fetchSpy).toHaveBeenNthCalledWith(1, 'http://localhost:7000/book?type=bio&artist=tim');
      expect(fetchSpy).toHaveBeenNthCalledWith(2, 'http://localhost:7000/book/one?type=bio&artist=tim', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({
          comments: 'Updated biography',
        }),
      });

      expect(callback).toHaveBeenCalled();
    });

    it('logs error if fetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchSpy.mockRejectedValueOnce(new Error('Fetch failed'));

      await updateBio('Biography', 'mock-token');

      expect(consoleErrorSpy).toHaveBeenCalledWith('updateBio failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});
