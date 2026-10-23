/**
 * @file a11y.spec.tsx
 * @description Runtime accessibility tests (axe-core via vitest-axe) for the app's views.
 *
 * NOTE: jsdom does not load external stylesheets or paint (no canvas), so
 * axe's color-contrast rule cannot be meaningfully evaluated here — it is
 * explicitly disabled below rather than left to silently no-op. These tests
 * cover the structural rules — landmarks, labels, roles, heading order,
 * image alts, button names, etc.
 */

import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import { App } from 'src/App';
import { BookingForm } from 'src/App/BookingForm';
import { loadPlacesLibrary } from 'src/App/BookingForm/places';

vi.mock('src/App/BookingForm/places', () => ({ loadPlacesLibrary: vi.fn() }));
import { DataContext, Ipic } from 'src/providers/Data.provider';

const mockPics: Ipic[] = [
  {
    _id: '1',
    url: '/imgs/slide1.png',
    title: 'Slide 1 Caption',
    comments: 'showCaption',
    type: 'tim-pic',
    caption: '',
    thumbnail: undefined,
    link: '',
    modify: undefined,
  },
  {
    _id: '2',
    url: '/imgs/slide2.png',
    title: 'Slide 2 Caption',
    comments: 'hideCaption',
    type: 'tim-pic',
    caption: '',
    thumbnail: undefined,
    link: '',
    modify: undefined,
  },
];

// color-contrast requires real style computation + canvas, neither of which
// jsdom provides — disable it so the run reflects only rules axe can verify.
const runAxe = (el: Element) => axe(el, { rules: { 'color-contrast': { enabled: false } } });

async function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '555-123-4567' } });
  fireEvent.change(screen.getByLabelText(/Event Date/i), { target: { value: '2026-10-23' } });
  fireEvent.change(screen.getByLabelText(/Message & Event Details/i), { target: { value: 'Please book us!' } });
  fireEvent.change(screen.getByLabelText('Event Type'), { target: { value: 'wedding' } });
  await waitFor(() => { expect(screen.getByLabelText('Venue Address')).toBeEnabled(); });
  fireEvent.change(screen.getByLabelText('Venue Address'), { target: { value: '123 Main' } });
  fireEvent.click(await screen.findByRole('option', { name: '123 Main Street, Salem, VA' }));
  await waitFor(() => { expect(screen.getByRole('button', { name: /Submit Booking Request/i })).toBeEnabled(); });
}

describe('accessibility (axe)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
    vi.stubEnv('VITE_GOOGLE_MAPS_BROWSER_KEY', 'test-browser-key');
    vi.mocked(loadPlacesLibrary).mockResolvedValue({
      AutocompleteSessionToken: class {},
      AutocompleteSuggestion: { fetchAutocompleteSuggestions: vi.fn().mockResolvedValue({ suggestions: [{ placePrediction: {
        placeId: 'venue-id', text: { toString: () => '123 Main Street, Salem, VA' },
        toPlace: () => ({ id: 'venue-id', formattedAddress: '123 Main Street, Salem, VA', fetchFields: async () => ({}) }),
      } }] }) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('home page (header, slideshow, and booking form) has no axe violations', async () => {
    const { container } = render(
      <DataContext.Provider value={{ pics: mockPics, setPics: () => {}, gigs: null, setGigs: () => {} }}>
        <App />
      </DataContext.Provider>
    );
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('home page without slideshow pics has no axe violations', async () => {
    const { container } = render(<App />);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('booking form invalid-email error state has no axe violations', async () => {
    const { container } = render(<BookingForm />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('venue address suggestions have no axe violations', async () => {
    const { container } = render(<BookingForm />);
    await waitFor(() => { expect(screen.getByLabelText('Venue Address')).toBeEnabled(); });
    fireEvent.change(screen.getByLabelText('Venue Address'), { target: { value: '123 Main' } });
    expect(await screen.findByRole('option', { name: '123 Main Street, Salem, VA' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Venue Address'), { key: 'ArrowDown' });
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('booking form success view has no axe violations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'email sent' }),
    } as Response);

    const { container } = render(<BookingForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Inquiry Sent!/i)).toBeInTheDocument();
    });
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('booking form submit-error view has no axe violations', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network disconnected'));

    const { container } = render(<BookingForm />);
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sorry, we could not deliver your inquiry/i)).toBeInTheDocument();
    });
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
