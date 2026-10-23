// Only the Places (New) surface used by this form; no extra runtime dependency.
export interface VenuePlace {
  id: string;
  formattedAddress?: string;
  fetchFields: (options: { fields: string[] }) => Promise<unknown>;
}

export interface VenuePrediction {
  placeId: string;
  text: { toString: () => string };
  toPlace: () => VenuePlace;
}

export interface PlacesLibrary {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: { input: string; sessionToken: object }) => Promise<{
      suggestions: { placePrediction?: VenuePrediction }[];
    }>;
  };
}

const loader: { promise?: Promise<PlacesLibrary> } = {};

export function loadPlacesLibrary(apiKey: string): Promise<PlacesLibrary> {
  if (loader.promise) return loader.promise;
  const mapsWindow = window as typeof window & {
    __timBookingMapsReady?: () => void;
    google?: { maps: { importLibrary: (name: string) => Promise<PlacesLibrary> } };
  };
  loader.promise = new Promise<PlacesLibrary>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timeout);
      delete mapsWindow.__timBookingMapsReady;
      delete loader.promise;
      script.remove();
      reject(new Error('Address suggestions unavailable'));
    };
    const timeout = setTimeout(fail, 15000);
    mapsWindow.__timBookingMapsReady = () => {
      clearTimeout(timeout);
      delete mapsWindow.__timBookingMapsReady;
      const maps = mapsWindow.google?.maps;
      if (!maps) {
        fail();
        return;
      }
      maps.importLibrary('places').then(resolve).catch(fail);
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
      + '&loading=async&libraries=places&v=weekly&callback=__timBookingMapsReady';
    script.async = true;
    script.addEventListener('error', fail, { once: true });
    document.head.append(script);
  });
  return loader.promise;
}
