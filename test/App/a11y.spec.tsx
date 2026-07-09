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
import { vi, expect, describe, it, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import { App } from 'src/App';
import { BookingForm } from 'src/App/BookingForm';
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

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '555-123-4567' } });
  fireEvent.change(screen.getByLabelText(/Event Date/i), { target: { value: '2026-08-15' } });
  fireEvent.change(screen.getByLabelText(/Message & Event Details/i), { target: { value: 'Please book us!' } });
}

describe('accessibility (axe)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('home page (header, slideshow, and booking form) has no axe violations', async () => {
    const { container } = render(
      <DataContext.Provider value={{ pics: mockPics, setPics: () => {} }}>
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

  it('booking form success view has no axe violations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'email sent' }),
    } as Response);

    const { container } = render(<BookingForm />);
    fillValidForm();
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
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Submit Booking Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sorry, we could not deliver your inquiry/i)).toBeInTheDocument();
    });
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
