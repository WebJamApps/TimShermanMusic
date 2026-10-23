import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingForm } from 'src/App/BookingForm';
import { loadPlacesLibrary, type PlacesLibrary, type VenuePlace } from 'src/App/BookingForm/places';

vi.mock('src/App/BookingForm/places', () => ({ loadPlacesLibrary: vi.fn() }));

const startedAt = new Date('2026-10-23T12:00:00Z');
const address = '123 Main Street, Salem, VA, USA';
const fetchMock = vi.fn();
const getSuggestions = vi.fn<PlacesLibrary['AutocompleteSuggestion']['fetchAutocompleteSuggestions']>();
const fixture: { place: VenuePlace } = { place: {} as VenuePlace };

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submitButton() {
  return screen.getByRole('button', { name: 'Submit Booking Request' });
}

async function showForm() {
  await act(async () => { render(<BookingForm />); });
}

async function searchVenue(query = '123 Main') {
  change('Venue Address', query);
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
}

async function fillForm() {
  change('Full Name', 'Booking Customer');
  change('Email Address', 'customer@example.com');
  change('Phone Number', '540-555-0123');
  change('Event Date', '2026-10-23');
  change('Event Type', 'brewery-winery');
  change('Message & Event Details', 'Can Tim play our fall festival?');
  await searchVenue();
  await act(async () => { fireEvent.click(screen.getByRole('option', { name: address })); });
}

async function submitForm() {
  await act(async () => { fireEvent.click(submitButton()); });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(startedAt);
  vi.stubEnv('VITE_GOOGLE_MAPS_BROWSER_KEY', 'test-browser-key');
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock.mockResolvedValue({ ok: true });
  fixture.place = { id: 'venue-place-id', formattedAddress: address, fetchFields: vi.fn().mockResolvedValue({}) };
  getSuggestions.mockResolvedValue({ suggestions: [{ placePrediction: {
    placeId: 'venue-place-id', text: { toString: () => address }, toPlace: () => fixture.place,
  } }] });
  vi.mocked(loadPlacesLibrary).mockResolvedValue({
    AutocompleteSessionToken: class {},
    AutocompleteSuggestion: { fetchAutocompleteSuggestions: getSuggestions },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('BookingForm submission', () => {
  it('uses Tim’s browser key and sends the form label, traps and selected venue', async () => {
    await showForm();
    expect(loadPlacesLibrary).toHaveBeenCalledWith('test-browser-key');
    expect(submitButton()).toBeDisabled();
    await fillForm();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    await submitForm();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:7000/inquiry', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      artist: 'tim', form: 'tim-booking', website: '', formLoadedAt: startedAt.getTime(),
      name: 'Booking Customer', email: 'customer@example.com', phone: '540-555-0123',
      eventDate: '2026-10-23', eventType: 'brewery-winery', venuePlaceId: 'venue-place-id',
      message: 'Can Tim play our fall festival?',
    });
    expect(fixture.place.fetchFields).toHaveBeenCalledWith({ fields: ['formattedAddress'] });
    expect(screen.getByText('Inquiry Sent!')).toBeInTheDocument();
  });

  it('hides the trap from assistive technology and keyboard users, while still sending its value', async () => {
    await showForm();
    expect(screen.queryByRole('textbox', { name: 'Website' })).not.toBeInTheDocument();
    const trap = document.querySelector('input[name="website"]')!;
    expect(trap).toHaveAttribute('tabindex', '-1');
    expect(trap).toHaveAttribute('autocomplete', 'off');
    expect(trap.parentElement).toHaveClass('booking-bot-trap');
    expect(trap.parentElement).toHaveAttribute('aria-hidden', 'true');
    fireEvent.change(trap, { target: { value: 'bot-filled-value' } });
    await fillForm();
    await submitForm();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).website).toBe('bot-filled-value');
  });

  it('starts a fresh inquiry with empty fields and a fresh load time after reset', async () => {
    await showForm();
    await fillForm();
    await submitForm();
    vi.setSystemTime(new Date(startedAt.getTime() + 60000));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Send Another Inquiry' })); });
    expect(screen.getByLabelText('Full Name')).toHaveValue('');
    expect(screen.getByLabelText('Venue Address')).toHaveValue('');
    expect(screen.getByLabelText('Event Type')).toHaveValue('');
    expect(submitButton()).toBeDisabled();
    await fillForm();
    await submitForm();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).formLoadedAt).toBe(startedAt.getTime() + 60000);
  });

  it('displays backend validation feedback so the customer can correct the booking', async () => {
    const message = "We couldn't verify that address — please choose it from the suggestions.";
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ message }) });
    await showForm();
    await fillForm();
    await submitForm();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
    expect(screen.queryByText('Inquiry Sent!')).not.toBeInTheDocument();
  });

  it.each([
    { ok: false, status: 429, statusText: 'Too Many Requests' },
    { ok: false, status: 400, json: async () => ({}) },
    { ok: false, status: 400, json: async () => { throw new Error('Not JSON'); } },
  ])('keeps the inquiry editable after a failed response: %j', async response => {
    fetchMock.mockResolvedValue(response);
    await showForm();
    await fillForm();
    await submitForm();
    expect(screen.getByText(/could not deliver your inquiry/)).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it('disables the form during a pending request and handles network failures', async () => {
    const request = Promise.withResolvers<unknown>();
    fetchMock.mockReturnValue(request.promise);
    await showForm();
    await fillForm();
    await submitForm();
    expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled();
    expect(screen.getByLabelText('Venue Address')).toBeDisabled();
    await act(async () => { request.reject(new Error('Offline')); });
    expect(screen.getByText(/could not deliver your inquiry/)).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });
});

describe('BookingForm validation', () => {
  it.each([
    ['Full Name', '   '], ['Email Address', 'bad-email'], ['Email Address', 'user@localhost'],
    ['Phone Number', '   '], ['Event Date', ''], ['Event Date', '2026-10-22'],
    ['Event Type', ''], ['Message & Event Details', '   '],
  ])('prevents submission with an invalid %s (%s)', async (label, value) => {
    await showForm();
    await fillForm();
    change(label, value);
    expect(submitButton()).toBeDisabled();
    fireEvent.submit(document.querySelector('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('offers exactly the eight approved event types', async () => {
    await showForm();
    const select = screen.getByLabelText<HTMLSelectElement>('Event Type');
    expect([...select.options].map(option => [option.value, option.text])).toEqual([
      ['', 'Choose an event type'], ['brewery-winery', 'Brewery or winery'], ['restaurant-bar', 'Restaurant or bar'],
      ['wedding', 'Wedding'], ['private-party', 'Private party'], ['festival-fair', 'Festival or fair'],
      ['church', 'Church event'], ['corporate', 'Corporate event'], ['other', 'Other'],
    ]);
    expect(screen.getByLabelText('Event Date')).toHaveAttribute('min', '2026-10-23');
  });

  it('requires a suggestion and clears the selected place when its address is edited', async () => {
    await showForm();
    await fillForm();
    expect(screen.getByLabelText('Venue Address')).toHaveValue(address);
    expect(submitButton()).toBeEnabled();
    change('Venue Address', 'Different freely typed venue');
    expect(submitButton()).toBeDisabled();
    fireEvent.submit(document.querySelector('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Venue address suggestions', () => {
  it('supports keyboard selection and escape', async () => {
    await showForm();
    await searchVenue();
    const input = screen.getByLabelText('Venue Address');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: address })).toHaveAttribute('aria-selected', 'true');
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
    expect(input).toHaveValue(address);
    await searchVenue('Main Street');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('option', { name: address })).not.toBeInTheDocument();
  });

  it('does not choose a suggestion merely because Enter was pressed', async () => {
    await showForm();
    await searchVenue();
    fireEvent.keyDown(screen.getByLabelText('Venue Address'), { key: 'Enter' });
    expect(fixture.place.fetchFields).not.toHaveBeenCalled();
    expect(submitButton()).toBeDisabled();
  });

  it('debounces requests and closes suggestions when focus leaves the address field', async () => {
    await showForm();
    change('Venue Address', '12');
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(getSuggestions).not.toHaveBeenCalled();
    await searchVenue();
    expect(getSuggestions).toHaveBeenCalledWith({ input: '123 Main', sessionToken: expect.any(Object) });
    fireEvent.blur(screen.getByLabelText('Venue Address'), { relatedTarget: screen.getByLabelText('Full Name') });
    expect(screen.queryByRole('option', { name: address })).not.toBeInTheDocument();
  });

  it('shows a helpful error when there are no matching addresses', async () => {
    getSuggestions.mockResolvedValue({ suggestions: [{}] });
    await showForm();
    await searchVenue();
    expect(screen.getByText(/No addresses found/)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('provides a booking email when the artist key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_BROWSER_KEY', '');
    await showForm();
    expect(loadPlacesLibrary).not.toHaveBeenCalled();
    expect(screen.getByText(/Address suggestions are unavailable/)).toBeInTheDocument();
    expect(screen.getByLabelText('Venue Address')).toBeDisabled();
  });

  it('handles script-loading failure', async () => {
    vi.mocked(loadPlacesLibrary).mockRejectedValue(new Error('Unavailable'));
    await showForm();
    expect(screen.getByText(/Address suggestions are unavailable/)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it('handles autocomplete request failure', async () => {
    getSuggestions.mockRejectedValue(new Error('Unavailable'));
    await showForm();
    await searchVenue();
    expect(screen.getByText(/Address suggestions are unavailable/)).toBeInTheDocument();
  });

  it.each(['missing address', 'lookup failure'])('rejects a selection with %s', async failure => {
    if (failure === 'missing address') delete fixture.place.formattedAddress;
    else vi.mocked(fixture.place.fetchFields).mockRejectedValue(new Error('Unavailable'));
    await showForm();
    await searchVenue();
    await act(async () => { fireEvent.click(screen.getByRole('option', { name: address })); });
    expect(screen.getByRole('status')).toHaveTextContent(/street address|unavailable/);
    expect(submitButton()).toBeDisabled();
  });

  it('ignores an old address lookup after the customer edits the field', async () => {
    const lookup = Promise.withResolvers<void>();
    vi.mocked(fixture.place.fetchFields).mockReturnValue(lookup.promise);
    await showForm();
    await searchVenue();
    fireEvent.click(screen.getByRole('option', { name: address }));
    change('Venue Address', 'New address');
    await act(async () => { lookup.resolve(); });
    expect(screen.getByLabelText('Venue Address')).toHaveValue('New address');
    expect(submitButton()).toBeDisabled();
  });

  it('ignores old autocomplete results after a newer search', async () => {
    const search = Promise.withResolvers<{ suggestions: [] }>();
    getSuggestions.mockReturnValueOnce(search.promise);
    await showForm();
    await searchVenue('Old query');
    await searchVenue('New query');
    expect(screen.getByRole('option', { name: address })).toHaveTextContent(address);
    await act(async () => { search.resolve({ suggestions: [] }); });
    expect(screen.getByRole('option', { name: address })).toHaveTextContent(address);
  });
});
