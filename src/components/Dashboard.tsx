import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  name: string;
}

interface Location {
  name: string;
  lat: number;
  lon: number;
}

interface Joke {
  category: string;
  joke: string;
}

interface Weather {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

interface CryptoData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

interface City {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface ForecastDay {
  date: string;
  temperature: number;
  weather_code: number;
}

interface Forecast {
  daily: ForecastDay[];
}

function Dashboard({ user }: { user: User }) {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [jokeLoading, setJokeLoading] = useState<boolean>(false);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location>({
    name: 'New Delhi',
    lat: 28.6139,
    lon: 77.2090,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [cryptoLoading, setCryptoLoading] = useState<boolean>(false);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const jokeResponse = await axios.get('https://v2.jokeapi.dev/joke/Programming?safe-mode&type=single');
      const jokeData: Joke = jokeResponse.data;

      const weatherResponse = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&current=temperature_2m,weather_code&timezone=auto`
      );
      const weatherData: Weather = weatherResponse.data;

      setJoke(jokeData);
      setWeather(weatherData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoData = async () => {
    setCryptoLoading(true);

    try {
      const mockData: CryptoData = {
        bitcoin: { usd: Math.floor(Math.random() * 10000) + 40000, usd_24h_change: parseFloat((Math.random() * 10 - 5).toFixed(2)) },
        ethereum: { usd: Math.floor(Math.random() * 1000) + 2500, usd_24h_change: parseFloat((Math.random() * 10 - 5).toFixed(2)) },
        dogecoin: { usd: parseFloat((Math.random() * 0.1).toFixed(3)), usd_24h_change: parseFloat((Math.random() * 20 - 10).toFixed(2)) },
        cardano: { usd: parseFloat((Math.random() * 1).toFixed(3)), usd_24h_change: parseFloat((Math.random() * 10 - 5).toFixed(2)) },
      };

      setCryptoData(mockData);
    } catch (err) {
      setCryptoData({
        bitcoin: { usd: 45000, usd_24h_change: 2.5 },
        ethereum: { usd: 3200, usd_24h_change: -1.2 },
        dogecoin: { usd: 0.08, usd_24h_change: 5.7 },
        cardano: { usd: 0.45, usd_24h_change: -0.8 },
      });
    } finally {
      setCryptoLoading(false);
    }
  };

  const fetchNewJoke = async () => {
    try {
      setJokeLoading(true);

      const jokeResponse = await axios.get('https://v2.jokeapi.dev/joke/Programming?safe-mode&type=single');
      const jokeData: Joke = jokeResponse.data;

      setJoke(jokeData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch joke. Please try again later.');
    } finally {
      setJokeLoading(false);
    }
  };

  const fetchWeatherForLocation = async (location: Location) => {
    try {
      setWeatherLoading(true);

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=0dded06259918d09bb53a2782513f05b`
      );
      console.log('Weather API Response:', response.data);

      const weatherData = response.data;
      setWeather({
        current: {
          temperature_2m: weatherData.main.temp,
          weather_code: weatherData.weather[0].id,
        },
      });
      setCurrentLocation(location);
      setError(null);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchForecast = async (lat: number, lon: number): Promise<Forecast> => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=0dded06259918d09bb53a2782513f05b`
      );
      console.log('Forecast API Response:', response.data);

      const data = response.data;
      const dailyData = data.list.filter((entry: any, index: number) => index % 8 === 0).map((entry: any) => ({
        date: entry.dt_txt,
        temperature: entry.main.temp,
        weather_code: entry.weather[0].id,
      }));

      return { daily: dailyData };
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  };

  const fetchUserForecast = async () => {
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
          const forecastData = await fetchForecast(latitude, longitude);
          setForecast(forecastData);
        } catch (err) {
          setError('Failed to fetch forecast data. Please try again later.');
        } finally {
          setWeatherLoading(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setWeatherLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  useEffect(() => {
    fetchData();
    fetchCryptoData();
    fetchUserForecast();
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

      if (response.data.results) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
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
              if (address.city) {
                cityName = `${address.city}, ${address.country}`;
              } else if (address.town) {
                cityName = `${address.town}, ${address.country}`;
              } else if (address.village) {
                cityName = `${address.village}, ${address.country}`;
              } else if (address.county) {
                cityName = `${address.county}, ${address.country}`;
              } else {
                const displayName = geocodingResponse.data.display_name;
                const parts = displayName.split(', ');
                if (parts.length >= 2) {
                  cityName = `${parts[0]}, ${parts[parts.length - 1]}`;
                }
              }
            }
          } catch (geocodingErr) {}

          await fetchWeatherForLocation({
            name: cityName,
            lat: latitude,
            lon: longitude,
          });
        } catch (err) {
          setError('Failed to get location weather. Please try again.');
          setWeatherLoading(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setWeatherLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const getCurrentLocationForecast = async () => {
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
          const forecastData = await fetchForecast(latitude, longitude);
          setForecast(forecastData);
        } catch (err) {
          setError('Failed to fetch forecast data. Please try again later.');
        } finally {
          setWeatherLoading(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setWeatherLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
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

  const formatJoke = (jokeText: string): { setup: string; punchline: string } => {
    const separators = ['—', '--', '-', '...', '..', '.'];
    let setup = jokeText;
    let punchline = '';

    for (const separator of separators) {
      if (jokeText.includes(separator)) {
        const parts = jokeText.split(separator);
        if (parts.length >= 2) {
          setup = parts[0].trim();
          punchline = parts.slice(1).join(separator).trim();
          break;
        }
      }
    }

    return { setup, punchline };
  };

  const getJokeIcon = (): string => {
    const icons = ['😄', '😂', '🤣', '😆', '😅', '😁', '😊', '😉', '😋', '😎'];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const getWeatherIcon = (code: number): string => {
    const weatherIcons: { [key: number]: string } = {
      0: '☀️',
      1: '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌧️',
      55: '🌧️',
      56: '🌨️',
      57: '🌨️',
      61: '🌧️',
      63: '🌧️',
      65: '🌧️',
      66: '🌨️',
      67: '🌨️',
      71: '🌨️',
      73: '🌨️',
      75: '🌨️',
      77: '🌨️',
      80: '🌦️',
      81: '🌧️',
      82: '🌧️',
      85: '🌨️',
      86: '🌨️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️',
    };
    return weatherIcons[code] || '🌤️';
  };

  const JokeButton = () => (
    <button
      onClick={fetchNewJoke}
      disabled={jokeLoading}
      className={`w-full text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center justify-center space-x-2 ${
        jokeLoading
          ? 'bg-blue-400 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600'
      }`}
    >
      {jokeLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          <span>🔄</span>
          <span>Shuffle</span>
        </>
      )}
    </button>
  );

  const ForecastCard = () => {
    const [forecast, setForecast] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserForecast = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const forecastData = await fetchForecast(latitude, longitude);
            setForecast(forecastData);
          } catch (err) {
            setError('Failed to fetch forecast data. Please try again later.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          let errorMessage = 'Failed to get your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access in your browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    };

    useEffect(() => {
      fetchUserForecast();
    }, []);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-full min-h-[400px] hover:shadow-lg transition-all duration-300 ease-in-out relative group">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
        <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">📍</span>
          5-Day Forecast
        </h2>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : forecast && Array.isArray(forecast.daily) ? (
          <div className="flex-1 space-y-4">
            {forecast.daily.map((day, index) => (
              <div
                key={index}
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
                  <span className="text-xl">
                    {getWeatherIcon(day.weather_code)}
                  </span>
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

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-all duration-300 ease-in-out relative group">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 text-6xl opacity-10 pointer-events-none">
            🎉
          </div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <span className="text-white text-lg font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Here's what's happening today
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-full min-h-[400px] hover:shadow-lg transition-all duration-300 ease-in-out relative group">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2 animate-pulse">😁</span>
              Random Joke
            </h2>
            {error ? (
              <div className="flex flex-col h-full">
                <div className={`flex-1 transition-opacity duration-200 ${jokeLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <p className="text-red-600">{error}</p>
                </div>
                <div className="mt-auto pt-4">
                  <JokeButton />
                </div>
              </div>
            ) : joke ? (
              <div className="flex flex-col h-full">
                <div className={`flex-1 transition-opacity duration-200 ${jokeLoading ? 'opacity-75' : 'opacity-100'}`}>
                  {(() => {
                    const { setup, punchline } = formatJoke(joke.joke)
                    const isShortJoke = joke.joke.length < 100
                    
                    return (
                      <div className={`${isShortJoke ? 'text-center' : ''}`}>
                        <blockquote className="border-l-4 border-green-400 pl-4 py-2 mb-4 relative">
                          <div className="absolute -top-2 -right-2 text-2xl opacity-60 animate-bounce">
                            {getJokeIcon()}
                          </div>
                          <p className="text-gray-700 dark:text-gray-200 leading-relaxed italic font-medium">
                            "{setup}"
                          </p>
                          {punchline && (
                            <>
                              <div className="flex justify-center my-4">
                                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-500 to-transparent"></div>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic font-medium text-center">
                                "{punchline}"
                              </p>
                            </>
                          )}
                        </blockquote>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">Category: {joke.category}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="mt-auto pt-4">
                  <JokeButton />
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <JokeButton />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className={`flex-1 transition-opacity duration-200 ${jokeLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <p className="text-gray-500">No joke available</p>
                </div>
                <div className="mt-auto pt-4">
                  <JokeButton />
                </div>
              </div>
            )}
        </div>

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
                    <span className="text-3xl sm:text-4xl font-display font-bold text-gray-900 dark:text-white transition-all duration-300 hover:text-blue-600 hover:drop-shadow-lg">
                      {weather.current?.temperature_2m}°C
                    </span>
                    <span className="text-2xl sm:text-3xl ml-3 opacity-80 animate-pulse">
                      {weather.current?.weather_code !== undefined &&
                        getWeatherIcon(weather.current.weather_code)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium text-lg transition-all duration-300">
                    {weather.current?.weather_code !== undefined &&
                      getWeatherDescription(weather.current.weather_code)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium transition-all duration-300">
                    {currentLocation.name}
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
                        className={`text-white px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 ${
                          weatherLoading ? 'cursor-not-allowed opacity-75' : ''
                        }`}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
          <ForecastCard />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col min-h-[500px] hover:shadow-lg transition-all duration-300 ease-in-out relative group">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
        <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">₿</span>
          Crypto Prices
        </h2>
        {loading ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[300px]">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <button
                onClick={fetchCryptoData}
                disabled={cryptoLoading}
                className={`w-full text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center space-x-2 ${
                  cryptoLoading 
                    ? 'bg-orange-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {cryptoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh Prices</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : cryptoData ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[300px]">
              <div className="space-y-3">
                {Object.entries(cryptoData).map(([coin, data]) => {
                  try {
                    return (
                      <div key={coin} className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-opacity duration-200 ${cryptoLoading ? 'opacity-75' : 'opacity-100'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {coin.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white capitalize">{coin}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              ${data.usd?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${data.usd_24h_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.usd_24h_change >= 0 ? '+' : ''}{data.usd_24h_change?.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    )
                  } catch (err) {
                    return null
                  }
                })}
              </div>
            </div>
            <div className="mt-auto pt-4">
              <button
                onClick={fetchCryptoData}
                disabled={cryptoLoading}
                className={`w-full text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center space-x-2 ${
                  cryptoLoading 
                    ? 'bg-orange-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {cryptoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
              ) : (
                <>
                
                  <span>Refresh </span>
                </>
              )}
            </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[300px]">
              <p className={`text-gray-500 transition-opacity duration-200 ${cryptoLoading ? 'opacity-75' : 'opacity-100'}`}>Crypto data unavailable</p>
            </div>
            <div className="mt-auto pt-4">
              <button
                onClick={fetchCryptoData}
                disabled={cryptoLoading}
                className={`w-full text-white px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center space-x-2 ${
                  cryptoLoading 
                    ? 'bg-orange-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {cryptoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh Prices</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

            <div className="border-t border-gray-300 dark:border-gray-600 w-full bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
        <div className="mb-2 sm:mb-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Made for Assignment Purpose 
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <span>🌤️</span>
            <span>Open-Meteo</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <span>₿</span>
            <span>CoinGecko</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <span>😄</span>
            <span>JokeAPI</span>
          </div>
        </div>
      </div>
    </div>

    </>
  )
}

export default Dashboard