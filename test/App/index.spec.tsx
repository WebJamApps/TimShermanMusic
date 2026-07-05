import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from 'src/App';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';

describe('App & BookingForm', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Tim Sherman brand heading and contact form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Tim Sherman' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Book Tim Sherman' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message & Event Details/i)).toBeInTheDocument();
  });

  it('initially disables the submit button and validates email correctly', async () => {
    render(<App />);
    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    expect(submitBtn).toBeDisabled();

    // Fill in Name
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    expect(submitBtn).toBeDisabled();

    // Fill in invalid Email
    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Correct the Email
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Fill in Phone
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '555-123-4567' } });
    expect(submitBtn).toBeDisabled();

    // Fill in Date
    fireEvent.change(screen.getByLabelText(/Event Date/i), { target: { value: '2026-08-15' } });
    expect(submitBtn).toBeDisabled();

    // Fill in Message
    fireEvent.change(screen.getByLabelText(/Message & Event Details/i), { target: { value: 'Please book us!' } });
    
    // Now it should be enabled!
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits successfully and transitions to success view', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'email sent' }),
    } as Response);

    render(<App />);

    // Fill in valid details
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText(/Event Date/i), { target: { value: '2026-08-15' } });
    fireEvent.change(screen.getByLabelText(/Message & Event Details/i), { target: { value: 'Please book us!' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Sending.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Inquiry Sent!/i)).toBeInTheDocument();
      expect(screen.getByText(/Thank you for reaching out to book Tim/i)).toBeInTheDocument();
    });

    // Reset the form
    const resetBtn = screen.getByRole('button', { name: /Send Another Inquiry/i });
    fireEvent.click(resetBtn);

    expect(screen.getByRole('heading', { name: 'Book Tim Sherman' })).toBeInTheDocument();
    expect((screen.getByLabelText(/Full Name/i) as HTMLInputElement).value).toBe('');
  });

  it('handles server submission error gracefully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    render(<App />);

    // Fill in valid details
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText(/Event Date/i), { target: { value: '2026-08-15' } });
    fireEvent.change(screen.getByLabelText(/Message & Event Details/i), { target: { value: 'Please book us!' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Sorry, we could not deliver your inquiry/i)).toBeInTheDocument();
      expect(screen.getByText(/joshua.v.sherman@gmail.com/i)).toBeInTheDocument();
    });
  });

  it('handles fetch network/rejection error gracefully', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network disconnected'));

    render(<App />);

    // Fill in valid details
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText(/Event Date/i), { target: { value: '2026-08-15' } });
    fireEvent.change(screen.getByLabelText(/Message & Event Details/i), { target: { value: 'Please book us!' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Sorry, we could not deliver your inquiry/i)).toBeInTheDocument();
    });
  });
});
