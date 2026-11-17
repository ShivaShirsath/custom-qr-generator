import { useCallback, useEffect, useRef } from 'react';

import { useToast } from '@/components/feedback';

export interface Coordinates {
  latitude: string;
  longitude: string;
}

/** Offer at most once per page session, so declining isn't nagged on every visit to the tab. */
let offeredThisSession = false;

const format = (n: number) => n.toFixed(5);

function locate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    }),
  );
}

function reason(error: unknown): string {
  if (error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) return 'Location access was blocked for this site.';
    if (error.code === error.TIMEOUT) return 'Finding your location took too long.';
  }
  return 'Your location is not available right now.';
}

/**
 * Detects the device location (the browser asks for permission first) and offers it in a
 * popup. Coordinates stay in the browser; nothing is sent anywhere.
 */
export function useLocationOffer(isEmpty: boolean, apply: (coords: Coordinates) => void) {
  const toast = useToast();
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const offer = useCallback(
    (position: GeolocationPosition) => {
      const coords = {
        latitude: format(position.coords.latitude),
        longitude: format(position.coords.longitude),
      };
      const accuracy = Math.round(position.coords.accuracy);
      toast.show({
        key: 'location-offer',
        tone: 'info',
        title: 'Use your current location?',
        description: `Your location is ${coords.latitude}, ${coords.longitude} (±${accuracy} m).`,
        duration: 15000,
        actions: [
          { label: 'Not now', onClick: () => undefined },
          {
            label: 'Use location',
            primary: true,
            onClick: () => applyRef.current(coords),
          },
        ],
      });
    },
    [toast],
  );

  // Ask automatically the first time an empty location form is opened.
  useEffect(() => {
    if (!supported || !isEmpty || offeredThisSession) return;
    offeredThisSession = true;
    locate()
      .then(offer)
      .catch(() => undefined);
  }, [supported, isEmpty, offer]);

  /** Explicit request from the "Use my current location" button: fills in directly. */
  const requestCurrent = useCallback(async () => {
    try {
      const position = await locate();
      applyRef.current({
        latitude: format(position.coords.latitude),
        longitude: format(position.coords.longitude),
      });
      toast.show({
        tone: 'success',
        title: 'Location added',
        description: `Accurate to about ${Math.round(position.coords.accuracy)} m.`,
      });
    } catch (error) {
      toast.show({
        tone: 'error',
        title: "Couldn't get your location",
        description: reason(error),
      });
    }
  }, [toast]);

  return { supported, requestCurrent };
}
