import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ForecastDay = {
  date: string;
  temperature: number;
  weather_code: number;
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

const FiveDayForecastCard: React.FC<FiveDayForecastCardProps> = ({
  apiKey = '0dded06259918d09bb53a2782513f05b',
  useMyLocation = true,
  lat = 28.6139,
  lon = 77.2090,
  heightClassName = 'h-[460px] lg:h-[460px]',
  className = '',
  title = '5-Day Forecast',
}) => {
  const [days, setDays] = useState<ForecastDay[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async (plat: number, plon: number): Promise<ForecastDay[]> => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${plat}&lon=${plon}&units=metric&appid=${apiKey}`
    );
    const daily = data.list
      .filter((_: any, idx: number) => idx % 8 === 0)
      .slice(0, 5)
      .map((entry: any) => ({
        date: entry.dt_txt,
        temperature: entry.main.temp,
        weather_code: normalizeWeatherCode(entry.weather?.[0]?.id),
      }));
    return daily;
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let plat = lat, plon = lon;

        if (useMyLocation && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
              )
            );
            plat = position.coords.latitude;
            plon = position.coords.longitude;
          } catch {}
        }

        const result = await fetchForecast(plat, plon);
        if (!cancelled) setDays(result);
      } catch (e) {
        if (!cancelled) setError('Failed to fetch forecast data. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [apiKey, useMyLocation, lat, lon]);

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

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">📍</span>
        {title}
      </h2>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : days && days.length > 0 ? (
        <div className="flex-1 space-y-4">
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
                  {day.temperature}°C
                </span>
                <span className="text-xl">{getWeatherIcon(day.weather_code)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No forecast data available</p>
        </div>
      )}
    </div>
  );
};

export default FiveDayForecastCard;
