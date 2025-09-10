import React from 'react';
import LatestNewsCard from './LatestNewsCard';
import FiveDayForecastCard from './FiveDayForecastCard';

interface User {
  name: string;
}

function Dashboard({ user }: { user: User }) {
  return (
    <>
      {/* Full-bleed wrapper so cards can expand close to screen edges */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-2 sm:px-4 lg:px-8 py-8">

        {/* Welcome */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-all duration-300 ease-in-out relative group">
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
        </div> */}

        {/* Two cards: Weather (left) + News (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          {/* Left: merged current + 5-day */}
          <div className="lg:col-span-1 h-full">
            <FiveDayForecastCard
              apiKey="0dded06259918d09bb53a2782513f05b"  // replace with env in prod
              useMyLocation
              heightClassName="h-[550px]"               // compact height per your request
            />
          </div>

          {/* Right: Latest News (scrolls internally if tall) */}
          <div className="lg:col-span-1 h-full">
            <LatestNewsCard
              country="us"
              // you can pass mood="neutral" | "cold" | "hot" | "cool" if you want a bias
              mood="neutral"
              heightClassName="h-[550px]"               // match left height for a tidy row
              apiKey="9f983265846e40e297d1c8e71a058c32" // replace with env in prod
            />
          </div>
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
              <span>🌧️</span>
              <span>OpenWeather</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
              <span>📰</span>
              <span>NewsAPI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
