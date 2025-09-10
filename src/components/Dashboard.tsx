import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LatestNewsCard, { Mood } from './LatestNewsCard';
import FiveDayForecastCard from './FiveDayForecastCard';

interface User {
  name: string;
}

interface Location {
  name: string;
  lat: number;
  lon: number;
}

interface Weather {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

interface City {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}



function Dashboard({ user }: { user: User }) {
  const getMoodFromTemp = (t?: number): Mood => {
    if (t == null) return 'neutral';
    if (t <= 15) return 'cold';
    if (t >= 32) return 'hot';
    return 'cool';
  };

  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);


  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Initial weather (Open-Meteo current)
  const fetchData = async () => {
    try {
      setLoading(true);
      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&current=temperature_2m,weather_code&timezone=auto`
      );
      const weatherData: Weather = weatherResponse.data;
      setWeather(weatherData);
      setError(null);
    } catch {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Map OpenWeather codes -> your icon/description codes
  const normalizeWeatherCode = (owmId: number): number => {
    if (owmId === 800) return 0;                 // clear sky
    if (owmId === 801) return 2;                 // few clouds -> partly cloudy
    if (owmId >= 802 && owmId <= 804) return 3;  // broken/overcast -> overcast
    const group = Math.floor(owmId / 100);
    switch (group) {
      case 2: return 95; // thunderstorm
      case 3: return 53; // drizzle
      case 5: return 63; // rain
      case 6: return 73; // snow
      case 7: return 45; // mist/fog/etc
      default: return 2; // fallback partly cloudy
    }
  };

  const fetchWeatherForLocation = async (location: Location) => {
    try {
      setWeatherLoading(true);
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=0dded06259918d09bb53a2782513f05b`
      );
      const code = normalizeWeatherCode(data.weather[0].id);
      setWeather({
        current: {
          temperature_2m: data.main.temp,
          weather_code: code,
        },
      });
      setCurrentLocation(location);
      setError(null);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setWeatherLoading(false);
    }
  };
  useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherForLocation({
          name: 'My Location',
          lat: latitude,
          lon: longitude,
        });
      },
      (err) => {
        console.error('Geolocation failed, falling back to New Delhi:', err);
        // fallback to New Delhi if user denies
        fetchWeatherForLocation({
          name: 'New Delhi',
          lat: 28.6139,
          lon: 77.2090,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  } else {
    // fallback if browser doesn't support geolocation
    fetchWeatherForLocation({
      name: 'New Delhi',
      lat: 28.6139,
      lon: 77.2090,
    });
  }
}, []);


  useEffect(() => {
    fetchData();
  }, []);

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const response = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      if (response.data.results) setSearchResults(response.data.results);
      else setSearchResults([]);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchCities(query);
  };

  const handleLocationSelect = (city: City) => {
    setSearchQuery('');
    setSearchResults([]);
    fetchWeatherForLocation({
      name: city.name,
      lat: city.latitude,
      lon: city.longitude,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setWeatherLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          let cityName = 'Current Location';
          try {
            const geocodingResponse = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            if (geocodingResponse.data && geocodingResponse.data.display_name) {
              const address = geocodingResponse.data.address;
              if (address.city) cityName = `${address.city}, ${address.country}`;
              else if (address.town) cityName = `${address.town}, ${address.country}`;
              else if (address.village) cityName = `${address.village}, ${address.country}`;
              else if (address.county) cityName = `${address.county}, ${address.country}`;
              else {
                const parts = geocodingResponse.data.display_name.split(', ');
                if (parts.length >= 2) cityName = `${parts[0]}, ${parts[parts.length - 1]}`;
              }
            }
          } catch { /* ignore reverse geocode errors */ }

          await fetchWeatherForLocation({
            name: cityName,
            lat: latitude,
            lon: longitude,
          });
        } catch {
          setError('Failed to get location weather. Please try again.');
          setWeatherLoading(false);
        }
      },
      (err) => {
        let errorMessage = 'Failed to get your location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setWeatherLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm',
    };
    return weatherCodes[code] || 'Unknown';
  };

  const getWeatherIcon = (code: number): string => {
    const weatherIcons: { [key: number]: string } = {
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
    return weatherIcons[code] || '🌤️';
  };


  const mood = getMoodFromTemp(weather?.current?.temperature_2m);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-all duration-300 ease-in-out relative group">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 text-6xl opacity-10 pointer-events-none">🎉</div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <span className="text-white text-lg font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Here's what's happening today</p>
            </div>
          </div>
        </div>

        {/* Forecast + Latest News */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          <div className="lg:col-span-1 h-full">
            <FiveDayForecastCard
              apiKey="0dded06259918d09bb53a2782513f05b" 
              useMyLocation
              heightClassName="h-[460px] lg:h-[460px]"
            />
          </div>
          <div className="lg:col-span-1 h-full">
            <LatestNewsCard
              country="us"
              mood={mood}
              heightClassName="h-[460px] lg:h-[460px]"
              apiKey="9f983265846e40e297d1c8e71a058c32"
            />
          </div>
        </div>

        {/* Current Weather (single card) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-full min-h-[400px] hover:shadow-lg transition-all duration-300 ease-in-out relative group">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🌤️</span>
            Current Weather
          </h2>
          {error ? (
            <div className="flex flex-col h-full">
              <div className={`flex-1 transition-opacity duration-200 ${weatherLoading ? 'opacity-75' : 'opacity-100'}`}>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : weather ? (
            <div className="flex flex-col h-full">
              <div className={`flex-1 transition-all duration-500 ${weatherLoading ? 'opacity-75 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="flex items-center mb-3 relative">
                  <span className="text-3xl sm:text-4xl font-display font-bold text-gray-900 dark:text-white">
                    {weather.current?.temperature_2m}°C
                  </span>
                  <span className="text-2xl sm:text-3xl ml-3 opacity-80">
                    {weather.current?.weather_code !== undefined &&
                      getWeatherIcon(weather.current.weather_code)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium text-lg">
                  {weather.current?.weather_code !== undefined &&
                    getWeatherDescription(weather.current?.weather_code)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                  {currentLocation ? currentLocation.name : 'Detecting location...'}
                </p>


                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Search Location:</p>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search for any city..."
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}

                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {searchResults.map((city, index) => (
                            <button
                              key={index}
                              onClick={() => handleLocationSelect(city)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
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
                    <button
                      onClick={getCurrentLocation}
                      disabled={weatherLoading}
                      className={`text-white px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 ${weatherLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                      {weatherLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <span>📍</span>
                          <span>My Location</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-8 ml-3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className={`flex-1 transition-opacity duration-200 ${weatherLoading ? 'opacity-75' : 'opacity-100'}`}>
                <p className="text-gray-500">Weather data unavailable</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 dark:border-gray-600 w-full bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
          <div className="mb-2 sm:mb-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Made for Assignment Purpose</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
              <span>🌤️</span>
              <span>Open-Meteo</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
              <span>🌧️</span>
              <span>OpenWeather</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
