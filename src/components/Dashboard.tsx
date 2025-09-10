import React from 'react';
import LatestNewsCard, { Mood } from './LatestNewsCard';
import FiveDayForecastCard from './FiveDayForecastCard';
import { useCurrentTemp } from '../hooks/useCurrentTemp';

interface User { name: string; }

function Dashboard({ user }: { user: User }) {
  // left stack height knobs
  const LEFT_CARD_HEIGHT = 'h-[550px]'; // keep compact as you wanted

  const { tempC, loading: tempLoading, locationName } = useCurrentTemp();

  const getMoodFromTemp = (t?: number | null): Mood => {
    if (t == null) return 'neutral';
    if (t <= 15) return 'cold';   // depressing news
    if (t >= 32) return 'hot';    // fear news
    return 'cool';                // happy/winning news
  };

  const mood = getMoodFromTemp(tempC);

  return (
    <>
      {/* Full-bleed wrapper */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-2 sm:px-4 lg:px-8 py-6">

        {/* Welcome */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-all duration-300 ease-in-out relative group">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10"></div>
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <span className="text-white text-lg font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {tempLoading ? 'Checking local weather…' : `Mood from weather: ${mood.toUpperCase()}${locationName ? ` • ${locationName}` : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Left: single Weather/Forecast card | Right: Latest News spans height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT: your 5-day forecast (can also show current in its header) */}
          <div className="lg:col-span-1">
            <FiveDayForecastCard
              apiKey="0dded06259918d09bb53a2782513f05b"
              useMyLocation
              heightClassName={LEFT_CARD_HEIGHT}
              // You can optionally also show the same current temp inside this card’s header if you want:
              className=""
            />
          </div>

          {/* RIGHT: Latest News — mood strictly filters results */}
          <div className="lg:col-span-1">
            <LatestNewsCard
              country="us"
              mood={mood}
              heightClassName="h-[70vh]"      // tall news column
              apiKey="9f983265846e40e297d1c8e71a058c32"
              className=""
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 dark:border-gray-600 w-full bg-gray-50 dark:bg-gray-900">

        <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">Made for Assignment Purpose</p>
          <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
            <span>🌧️ OpenWeather</span>
            <span>📰 NewsAPI</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
