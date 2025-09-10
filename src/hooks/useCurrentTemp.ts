import { useEffect, useState } from 'react';
import axios from 'axios';

type UseCurrentTempResult = {
  tempC: number | null;
  loading: boolean;
  error: string | null;
  locationName: string | null;
};

const OPENWEATHER_KEY = '0dded06259918d09bb53a2782513f05b'; // replace with env in prod

export function useCurrentTemp(): UseCurrentTempResult {
  const [tempC, setTempC] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const getTemp = async () => {
      setLoading(true);
      setError(null);

      let lat = 28.6139;  // New Delhi fallback
      let lon = 77.2090;  // New Delhi fallback
      let name = 'New Delhi';

      // try geolocation first
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            })
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          name = 'My Location';
        } catch {
          // ignore; will use fallback
        }
      }

      try {
        // current weather
        const { data } = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`
        );
        if (!cancelled) {
          setTempC(data?.main?.temp ?? null);
          setLocationName(name);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to fetch current temperature');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getTemp();
    return () => { cancelled = true; };
  }, []);

  return { tempC, loading, error, locationName };
}
