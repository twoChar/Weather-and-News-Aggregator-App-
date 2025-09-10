import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ForecastDay = {
  date: string;
  temperature: number;
  weather_code: number; // normalized code (Open-Meteo style)
};

type FiveDayForecastCardProps = {
  /** OpenWeather API key (use env in prod) */
  apiKey?: string;
  /** If true, tries browser geolocation first */
  useMyLocation?: boolean;
  /** Fallback (or explicit) coordinates */
  lat?: number;
  lon?: number;
  /** Tailwind height class for the outer card */
  heightClassName?: string;
  /** Extra classes */
  className?: string;
  /** Card title */
  title?: string;
};

const normalizeWeatherCode = (owmId: number): number => {
  if (owmId === 800) return 0;               // clear
  if (owmId === 801) return 2;               // few clouds -> partly cloudy
  if (owmId >= 802 && owmId <= 804) return 3;// broken/overcast -> overcast
  const group = Math.floor(owmId / 100);
  switch (group) {
    case 2: return 95; // thunderstorm
    case 3: return 53; // drizzle
    case 5: return 63; // rain
    case 6: return 73; // snow
    case 7: return 45; // mist/fog/etc
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

const FiveDayForecastCard: React.FC<FiveDayForecastCardProps> = ({
  apiKey = '0dded06259918d09bb53a2782513f05b', // <- replace with env var
  useMyLocation = true,
  lat = 28.6139,   // New Delhi fallback
  lon = 77.2090,   // New Delhi fallback
  heightClassName = 'h-[420px]', // keep small as requested
  className = '',
  title = 'Weather & 5-Day Forecast',
}) => {
  // current weather section (merged in this card)
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentCode, setCurrentCode] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting location...');

  // forecast
  const [days, setDays] = useState<ForecastDay[] | null>(null);

  // search UI (moved from Current Weather card)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { name: string; latitude: number; longitude: number; country?: string; admin1?: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrent = async (plat: number, plon: number) => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${plat}&lon=${plon}&units=metric&appid=${apiKey}`
    );
    setCurrentTemp(data.main?.temp ?? null);
    setCurrentCode(normalizeWeatherCode(data.weather?.[0]?.id));
  };

  const fetchForecast = async (plat: number, plon: number): Promise<ForecastDay[]> => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${plat}&lon=${plon}&units=metric&appid=${apiKey}`
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

  const loadAll = async (plat: number, plon: number, prettyName?: string) => {
    setLoading(true);
    setError(null);
    try {
      await fetchCurrent(plat, plon);
      const f = await fetchForecast(plat, plon);
      setDays(f);
      if (prettyName) setLocationName(prettyName);
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
      setLoading(true);
      setError(null);
      try {
        let plat = lat, plon = lon, label = 'My Location';
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
          } catch { /* ignore */ }
        } else {
          label = 'New Delhi';
        }
        if (!cancelled) {
          setLocationName(label);
          await loadAll(plat, plon, label);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, useMyLocation, lat, lon]);

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
    const label = city.admin1 ? `${city.name}, ${city.admin1}` : `${city.name}`;
    setLocationName(label);
    await loadAll(city.latitude, city.longitude, label);
  };

  const onMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const plat = pos.coords.latitude;
        const plon = pos.coords.longitude;
        setLocationName('My Location');
        await loadAll(plat, plon, 'My Location');
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

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
        <span className="mr-2">🌦️</span>
        {title}
      </h2>

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
                  {currentTemp != null ? `${Math.round(currentTemp)}°C` : '--'}
                </span>
                <span className="text-2xl ml-3">
                  {currentCode != null ? getWeatherIcon(currentCode) : '🌤️'}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {currentCode != null ? getWeatherDescription(currentCode) : '—'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{locationName}</p>
            </div>

            {/* Quick actions */}
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
                    {Math.round(day.temperature)}°C
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
