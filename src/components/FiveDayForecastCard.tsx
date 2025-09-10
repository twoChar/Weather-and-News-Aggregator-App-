import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ForecastDay = {
  date: string;
  temperature: number;
  weather_code: number; // normalized code
};

type FiveDayForecastCardProps = {
  apiKey?: string;
  useMyLocation?: boolean;
  lat?: number;
  lon?: number;
  heightClassName?: string;
  className?: string;
  title?: string;
};

type Unit = 'metric' | 'imperial'; // metric = °C, imperial = °F

const normalizeWeatherCode = (owmId: number): number => {
  if (owmId === 800) return 0;
  if (owmId === 801) return 2;
  if (owmId >= 802 && owmId <= 804) return 3;
  const group = Math.floor(owmId / 100);
  switch (group) {
    case 2: return 95;
    case 3: return 53;
    case 5: return 63;
    case 6: return 73;
    case 7: return 45;
    default: return 2;
  }
};

const getWeatherIcon = (code: number): string => {
  const icons: Record<number, string> = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    56: '🌨️', 57: '🌨️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    66: '🌨️', 67: '🌨️',
    71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    85: '🌨️', 86: '🌨️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  };
  return icons[code] ?? '🌤️';
};

const getWeatherDescription = (code: number): string => {
  const map: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    95: 'Thunderstorm',
  };
  return map[code] ?? 'Unknown';
};

async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
  try {
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    );
    const a = data?.address;
    if (!a) return data?.display_name;
    return a.city || a.town || a.village || a.county || data?.display_name;
  } catch {
    return undefined;
  }
}

const FiveDayForecastCard: React.FC<FiveDayForecastCardProps> = ({
  apiKey = '0dded06259918d09bb53a2782513f05b',
  useMyLocation = true,
  lat = 28.6139,
  lon = 77.2090,
  heightClassName = 'h-[420px]',
  className = '',
  title = 'Weather & 5-Day Forecast',
}) => {
  // unit toggle (persisted)
  const [unit, setUnit] = useState<Unit>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unit') as Unit | null;
      if (saved === 'metric' || saved === 'imperial') return saved;
    }
    return 'metric';
  });

  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentCode, setCurrentCode] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting location…');

  const [days, setDays] = useState<ForecastDay[] | null>(null);

  // search UI
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { name: string; latitude: number; longitude: number; country?: string; admin1?: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // keep last coords so we can refetch on unit switch
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number }>({ lat, lon });

  const degreeSymbol = unit === 'metric' ? '°C' : '°F';

  const fetchCurrent = async (plat: number, plon: number, u: Unit): Promise<string | undefined> => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${plat}&lon=${plon}&units=${u}&appid=${apiKey}`
    );
    setCurrentTemp(data.main?.temp ?? null);
    setCurrentCode(normalizeWeatherCode(data.weather?.[0]?.id));
    return data?.name as string | undefined;
  };

  const fetchForecast = async (plat: number, plon: number, u: Unit): Promise<ForecastDay[]> => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${plat}&lon=${plon}&units=${u}&appid=${apiKey}`
    );
    return data.list
      .filter((_: any, idx: number) => idx % 8 === 0)
      .slice(0, 5)
      .map((entry: any) => ({
        date: entry.dt_txt,
        temperature: entry.main.temp,
        weather_code: normalizeWeatherCode(entry.weather?.[0]?.id),
      }));
  };

  const loadAll = async (plat: number, plon: number, fallbackLabel?: string, u: Unit = unit) => {
    setLoading(true);
    setError(null);
    try {
      const apiName = await fetchCurrent(plat, plon, u);
      const f = await fetchForecast(plat, plon, u);
      setDays(f);
      setLastCoords({ lat: plat, lon: plon });

      let finalLabel = apiName || fallbackLabel;
      if (!finalLabel) {
        const rev = await reverseGeocode(plat, plon);
        finalLabel = rev || 'My Location';
      }
      setLocationName(finalLabel);
    } catch {
      setDays(null);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // initial load (geolocation → fallback)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        let plat = lat, plon = lon;
        let label: string | undefined = 'My Location';

        if (useMyLocation && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(
                resolve, reject,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
              )
            );
            plat = pos.coords.latitude;
            plon = pos.coords.longitude;
          } catch {
            label = 'New Delhi';
          }
        } else {
          label = 'New Delhi';
        }
        if (!cancelled) await loadAll(plat, plon, label, unit);
      } catch {
        /* no-op */
      }
    };
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, useMyLocation, lat, lon, unit]); // include `unit` so first render respects saved unit

  // persist unit choice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unit', unit);
    }
  }, [unit]);

  // re-fetch when unit toggles (using last coords)
  const onToggleUnit = (u: Unit) => {
    if (u === unit) return;
    setUnit(u);
    // Refetch in the new unit but keep the same location label
    loadAll(lastCoords.lat, lastCoords.lon, locationName, u);
  };

  // search helpers
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const { data } = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      setSearchResults(data?.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onSelectCity = async (city: any) => {
    setSearchQuery('');
    setSearchResults([]);
    const fallback = city.admin1 ? `${city.name}, ${city.admin1}` : `${city.name}`;
    await loadAll(city.latitude, city.longitude, fallback, unit);
  };

  const onMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const plat = pos.coords.latitude;
        const plon = pos.coords.longitude;
        await loadAll(plat, plon, 'My Location', unit);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div
      className={[
        'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-full overflow-hidden',
        'hover:shadow-lg transition-all duration-300 ease-in-out relative group',
        heightClassName,
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10" />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🌦️</span>
          {title}
        </h2>

        {/* Unit switch */}
        <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onToggleUnit('metric')}
            className={`px-3 py-1 text-xs font-medium ${
              unit === 'metric'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
            aria-pressed={unit === 'metric'}
          >
            °C
          </button>
          <button
            onClick={() => onToggleUnit('imperial')}
            className={`px-3 py-1 text-xs font-medium border-l border-gray-200 dark:border-gray-700 ${
              unit === 'imperial'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
            aria-pressed={unit === 'imperial'}
          >
            °F
          </button>
        </div>
      </div>

      {/* CURRENT WEATHER */}
      <div className="mb-3">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : loading && currentTemp == null ? (
          <div className="flex items-center justify-center h-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentTemp != null ? `${Math.round(currentTemp)}${degreeSymbol}` : '--'}
                </span>
                <span className="text-2xl ml-3">
                  {currentCode != null ? getWeatherIcon(currentCode) : '🌤️'}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {currentCode != null ? getWeatherDescription(currentCode) : '—'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {locationName}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onMyLocation}
                className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                📍 My Location
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchCities(e.target.value);
            }}
            placeholder="Search city…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {searchResults.map((city, idx) => (
                <button
                  key={`${city.name}-${idx}`}
                  onClick={() => onSelectCity(city)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-500">
                    {city.country} {city.admin1 && `• ${city.admin1}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5-DAY FORECAST */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading && !days ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : days && days.length > 0 ? (
          <div className="space-y-3">
            {days.map((day, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {Math.round(day.temperature)}{degreeSymbol}
                  </span>
                  <span className="text-xl">{getWeatherIcon(day.weather_code)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No forecast data available</p>
        )}
      </div>
    </div>
  );
};

export default FiveDayForecastCard;
