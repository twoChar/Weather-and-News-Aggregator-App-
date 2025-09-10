import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ForecastDay = { date: string; temperature: number; weather_code: number; };
export type Unit = 'metric' | 'imperial';

type FiveDayForecastCardProps = {
  apiKey?: string;
  useMyLocation?: boolean;
  lat?: number;
  lon?: number;
  heightClassName?: string;
  className?: string;
  title?: string;
  onTempChange?: (temp: number | null, unit: Unit) => void; // <-- keep this
};

const normalizeWeatherCode = (owmId: number): number => {
  if (owmId === 800) return 0;
  if (owmId === 801) return 2;
  if (owmId >= 802 && owmId <= 804) return 3;
  const g = Math.floor(owmId / 100);
  switch (g) { case 2: return 95; case 3: return 53; case 5: return 63; case 6: return 73; case 7: return 45; default: return 2; }
};
const getWeatherIcon = (c: number) => ({0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',56:'🌨️',57:'🌨️',61:'🌧️',63:'🌧️',65:'🌧️',66:'🌨️',67:'🌨️',71:'🌨️',73:'🌨️',75:'🌨️',77:'🌨️',80:'🌦️',81:'🌧️',82:'🌧️',85:'🌨️',86:'🌨️',95:'⛈️',96:'⛈️',99:'⛈️'})[c] ?? '🌤️';
const getWeatherDescription = (c: number) => ({0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Depositing rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Dense drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',95:'Thunderstorm'})[c] ?? 'Unknown';

async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
  try {
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    );
    const a = data?.address;
    if (!a) return data?.display_name;
    return a.city || a.town || a.village || a.county || data?.display_name;
  } catch { return undefined; }
}

const FiveDayForecastCard: React.FC<FiveDayForecastCardProps> = ({
  apiKey = '0dded06259918d09bb53a2782513f05b',
  useMyLocation = true,
  lat = 28.6139,
  lon = 77.2090,
  heightClassName = 'h-[420px]',
  className = '',
  title = 'Weather & 5-Day Forecast',
  onTempChange,                // <-- DESTRUCTURE IT
}) => {
  const [unit, setUnit] = useState<Unit>(() => (localStorage.getItem('unit') as Unit) || 'metric');
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentCode, setCurrentCode] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting location…');
  const [days, setDays] = useState<ForecastDay[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number }>({ lat, lon });
  const degreeSymbol = unit === 'metric' ? '°C' : '°F';

  const fetchCurrent = async (plat: number, plon: number, u: Unit): Promise<string | undefined> => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${plat}&lon=${plon}&units=${u}&appid=${apiKey}`
    );
    const t = data.main?.temp ?? null;
    setCurrentTemp(t);
    setCurrentCode(normalizeWeatherCode(data.weather?.[0]?.id));
    if (onTempChange) onTempChange(t, u);   // <-- NOTIFY PARENT
    return data?.name as string | undefined;
  };

  const fetchForecast = async (plat: number, plon: number, u: Unit): Promise<ForecastDay[]> => {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${plat}&lon=${plon}&units=${u}&appid=${apiKey}`
    );
    return data.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5).map((e: any) => ({
      date: e.dt_txt, temperature: e.main.temp, weather_code: normalizeWeatherCode(e.weather?.[0]?.id),
    }));
  };

  const loadAll = async (plat: number, plon: number, fallbackLabel?: string, u: Unit = unit) => {
    setLoading(true); setError(null);
    try {
      const apiName = await fetchCurrent(plat, plon, u);
      setDays(await fetchForecast(plat, plon, u));
      setLastCoords({ lat: plat, lon: plon });
      const finalLabel = apiName || fallbackLabel || (await reverseGeocode(plat, plon)) || 'My Location';
      setLocationName(finalLabel);
    } catch {
      setDays(null); setError('Failed to fetch weather data. Please try again later.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      let plat = lat, plon = lon, label: string | undefined = 'My Location';
      if (useMyLocation && 'geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
          );
          plat = pos.coords.latitude; plon = pos.coords.longitude;
        } catch { label = 'New Delhi'; }
      } else { label = 'New Delhi'; }
      await loadAll(plat, plon, label, unit);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, useMyLocation, lat, lon, unit]);

  useEffect(() => { localStorage.setItem('unit', unit); }, [unit]);

  const onToggleUnit = (u: Unit) => {
    if (u === unit) return;
    setUnit(u);
    loadAll(lastCoords.lat, lastCoords.lon, locationName, u);
  };

  const searchCities = async (q: string) => {
    if (q.length < 2) return setSearchResults([]);
    try {
      setIsSearching(true);
      const { data } = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
      );
      setSearchResults(data?.results ?? []);
    } finally { setIsSearching(false); }
  };

  const onSelectCity = async (city: any) => {
    setSearchQuery(''); setSearchResults([]);
    const fallback = city.admin1 ? `${city.name}, ${city.admin1}` : `${city.name}`;
    await loadAll(city.latitude, city.longitude, fallback, unit);
  };

  const onMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await loadAll(pos.coords.latitude, pos.coords.longitude, 'My Location', unit); },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className={['bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col overflow-hidden',
                     'hover:shadow-lg transition-all duration-300 ease-in-out relative group',
                     heightClassName, className].join(' ')}>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10" />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🌦️</span>{title}
        </h2>
        <div className="inline-flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <button onClick={() => onToggleUnit('metric')}
                  className={`px-3 py-1 text-xs font-medium ${unit==='metric'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>°C</button>
          <button onClick={() => onToggleUnit('imperial')}
                  className={`px-3 py-1 text-xs font-medium border-l border-gray-200 dark:border-gray-700 ${unit==='imperial'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>°F</button>
        </div>
      </div>

      <div className="mb-3">
        {error ? <p className="text-red-600">{error}</p> : (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentTemp != null ? `${Math.round(currentTemp)}${degreeSymbol}` : '--'}
                </span>
                <span className="text-2xl ml-3">{currentCode != null ? getWeatherIcon(currentCode) : '🌤️'}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {currentCode != null ? getWeatherDescription(currentCode) : '—'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{locationName}</p>
            </div>
            <button onClick={onMyLocation} className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">📍 My Location</button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); searchCities(e.target.value); }}
            placeholder="Search city…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && <div className="absolute right-3 top-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div></div>}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {searchResults.map((city, i) => (
                <button key={`${city.name}-${i}`} onClick={() => onSelectCity(city)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0">
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-500">{city.country} {city.admin1 && `• ${city.admin1}`}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading && !days ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : days && days.length > 0 ? (
          <div className="space-y-3">
            {days.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{Math.round(d.temperature)}{degreeSymbol}</span>
                  <span className="text-xl">{getWeatherIcon(d.weather_code)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-center">No forecast data available</p>}
      </div>
    </div>
  );
};

export default FiveDayForecastCard;
