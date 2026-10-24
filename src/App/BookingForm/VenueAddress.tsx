import { useEffect, useRef, useState, type KeyboardEvent, type ChangeEvent, type FocusEvent } from 'react';
import { loadPlacesLibrary, type PlacesLibrary, type VenuePrediction } from './places';

const unavailableNote = "Address suggestions are unavailable. Type the venue's full street address.";

export function VenueAddress({
  placeId,
  venueAddress = '',
  onSelect,
  onAddressChange,
  disabled,
}: {
  placeId: string;
  venueAddress?: string;
  onSelect: (placeId: string) => void;
  onAddressChange?: (address: string) => void;
  disabled: boolean;
}) {
  const [address, setAddress] = useState(venueAddress);
  const [isFallback, setIsFallback] = useState(false);
  const [places, setPlaces] = useState<PlacesLibrary>();
  const [suggestions, setSuggestions] = useState<VenuePrediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionToken = useRef<object | undefined>(undefined);
  const selectionVersion = useRef(0);
  const addressRef = useRef(address);
  addressRef.current = address;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onAddressChangeRef = useRef(onAddressChange);
  onAddressChangeRef.current = onAddressChange;

  useEffect(() => {
    let cancelled = false;
    const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) {
      setIsFallback(true);
      return;
    }
    loadPlacesLibrary(key).then(library => {
      if (!cancelled) setPlaces(library);
    }).catch(() => {
      if (!cancelled) {
        setIsFallback(true);
        if (addressRef.current) {
          onSelectRef.current('');
          onAddressChangeRef.current?.(addressRef.current);
        }
      }
    });
    return () => {
      cancelled = true;
      selectionVersion.current += 1;
    };
  }, []);

  useEffect(() => {
    if (isFallback || !places || placeId || address.trim().length < 3) return;
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
        if (!cancelled && version === selectionVersion.current) {
          setIsFallback(true);
          setSuggestions([]);
          setActiveIndex(-1);
          setError('');
          onSelectRef.current('');
          onAddressChangeRef.current?.(address);
        }
      } finally {
        if (!cancelled && version === selectionVersion.current) setIsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [address, isFallback, placeId, places]);

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
      onSelectRef.current(place.id);
    } catch {
      if (version === selectionVersion.current) {
        setIsFallback(true);
        setSuggestions([]);
        setActiveIndex(-1);
        setError('');
        onSelectRef.current('');
        onAddressChangeRef.current?.(addressRef.current);
      }
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

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const val = event.target.value;
    selectionVersion.current += 1;
    setAddress(val);
    if (isFallback) {
      onAddressChangeRef.current?.(val);
    } else {
      onSelectRef.current('');
      setSuggestions([]);
      setActiveIndex(-1);
      setIsLoading(false);
      setError('');
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  const isValid = Boolean(isFallback ? address.trim() : placeId);

  return (
    <div className="form-group full-width venue-address">
      <label htmlFor="venueAddress" className="form-label">
        Venue Address <span className="required-asterisk">*</span>
      </label>
      <input
        aria-label="Venue Address"
        id="venueAddress"
        role={isFallback ? undefined : 'combobox'}
        aria-autocomplete={isFallback ? undefined : 'list'}
        aria-expanded={isFallback ? undefined : suggestions.length > 0}
        aria-controls={isFallback ? undefined : 'venue-suggestions'}
        aria-activedescendant={!isFallback && activeIndex >= 0 ? `venue-option-${activeIndex}` : undefined}
        aria-describedby="venue-help venue-status"
        aria-invalid={Boolean(error)}
        autoComplete="off"
        className={`form-input ${isValid ? 'is-valid' : ''}`}
        placeholder="Start typing a venue name or street address"
        value={address}
        required
        disabled={disabled || (!isFallback && !places)}
        onKeyDown={isFallback ? undefined : handleKeyDown}
        onChange={handleChange}
        onBlur={isFallback ? undefined : handleBlur}
      />
      <span id="venue-help" className="field-help">
        {isFallback ? unavailableNote : "Choose your venue's physical address from the suggestions."}
      </span>
      {!isFallback && (
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
      )}
      {!isFallback && suggestions.length > 0 && (
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
