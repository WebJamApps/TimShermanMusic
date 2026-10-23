import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { loadPlacesLibrary, type PlacesLibrary, type VenuePrediction } from './places';

const unavailableMessage = 'Address suggestions are unavailable. Please try again later or email timsherman75@gmail.com to book.';

export function VenueAddress({ placeId, onSelect, disabled }: {
  placeId: string;
  onSelect: (placeId: string) => void;
  disabled: boolean;
}) {
  const [address, setAddress] = useState('');
  const [places, setPlaces] = useState<PlacesLibrary>();
  const [suggestions, setSuggestions] = useState<VenuePrediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionToken = useRef<object | undefined>(undefined);
  const selectionVersion = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) {
      setError(unavailableMessage);
      return;
    }
    loadPlacesLibrary(key).then(library => {
      if (!cancelled) setPlaces(library);
    }).catch(() => {
      if (!cancelled) setError(unavailableMessage);
    });
    return () => {
      cancelled = true;
      selectionVersion.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!places || placeId || address.trim().length < 3) return;
    let cancelled = false;
    const version = selectionVersion.current;
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        sessionToken.current ??= new places.AutocompleteSessionToken();
        const result = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: address,
          sessionToken: sessionToken.current,
        });
        if (cancelled || version !== selectionVersion.current) return;
        const predictions = result.suggestions.flatMap(item => item.placePrediction ? [item.placePrediction] : []);
        setSuggestions(predictions);
        setActiveIndex(-1);
        setError(predictions.length > 0 ? '' : 'No addresses found. Please try a street address or venue name.');
      } catch {
        if (!cancelled && version === selectionVersion.current) setError(unavailableMessage);
      } finally {
        if (!cancelled && version === selectionVersion.current) setIsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [address, placeId, places]);

  async function chooseVenue(prediction: VenuePrediction) {
    const version = ++selectionVersion.current;
    setSuggestions([]);
    setIsLoading(true);
    setError('');
    try {
      const place = prediction.toPlace();
      const details = place.fetchFields({ fields: ['formattedAddress'] });
      sessionToken.current = undefined;
      await details;
      if (version !== selectionVersion.current) return;
      if (!place.id || !place.formattedAddress) {
        setError('Please choose a suggestion with a street address.');
        return;
      }
      setAddress(place.formattedAddress);
      onSelect(place.id);
    } catch {
      if (version === selectionVersion.current) setError(unavailableMessage);
    } finally {
      if (version === selectionVersion.current) setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setSuggestions([]);
      setActiveIndex(-1);
    } else if (suggestions.length > 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(index => {
        if (index < 0) return step > 0 ? 0 : suggestions.length - 1;
        return (index + step + suggestions.length) % suggestions.length;
      });
    } else if (event.key === 'Enter' && suggestions.length > 0) {
      event.preventDefault();
      if (activeIndex >= 0) void chooseVenue(suggestions[activeIndex]);
    }
  }

  return (
    <div className="form-group full-width venue-address">
      <label htmlFor="venueAddress" className="form-label">
        Venue Address <span className="required-asterisk">*</span>
      </label>
      <input
        aria-label="Venue Address"
        id="venueAddress"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls="venue-suggestions"
        aria-activedescendant={activeIndex >= 0 ? `venue-option-${activeIndex}` : undefined}
        aria-describedby="venue-help venue-status"
        aria-invalid={Boolean(error)}
        autoComplete="off"
        className={`form-input ${placeId ? 'is-valid' : ''}`}
        placeholder="Start typing a venue name or street address"
        value={address}
        required
        disabled={disabled || !places}
        onKeyDown={handleKeyDown}
        onChange={event => {
          selectionVersion.current += 1;
          setAddress(event.target.value);
          onSelect('');
          setSuggestions([]);
          setActiveIndex(-1);
          setIsLoading(false);
          setError('');
        }}
        onBlur={event => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
            setSuggestions([]);
            setActiveIndex(-1);
          }
        }}
      />
      <span id="venue-help" className="field-help">Choose your venue's physical address from the suggestions.</span>
      <div id="venue-suggestions" role="listbox" aria-label="Venue address suggestions" className="venue-suggestions">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.placeId} role="presentation">
            <button
              id={`venue-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              disabled={disabled}
              // Keep focus on the combobox until the selection click completes.
              onMouseDown={event => { event.preventDefault(); }}
              onClick={() => { void chooseVenue(suggestion); }}
            >
              {suggestion.text.toString()}
            </button>
          </div>
        ))}
      </div>
      {suggestions.length > 0 && (
        <img
          className="google-attribution"
          src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
          alt="Powered by Google"
        />
      )}
      <span id="venue-status" role="status" className={error ? 'field-error-msg' : 'field-help'}>
        {isLoading ? 'Looking up address…' : error}
      </span>
    </div>
  );
}
