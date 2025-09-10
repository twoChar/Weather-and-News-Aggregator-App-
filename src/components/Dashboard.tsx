import React, { useState } from 'react';
import LatestNewsCard, { Mood } from './LatestNewsCard';
import FiveDayForecastCard, { Unit } from './FiveDayForecastCard';

interface User { name: string; }

function Dashboard({ user }: { user: User }) {
  const [mood, setMood] = useState<Mood>('neutral');
  const LEFT_CARD_HEIGHT = 'h-[560px]';

  const getMoodFromTemp = (t?: number | null): Mood => {
    if (t == null) return 'neutral';
    if (t <= 15) return 'cold';
    if (t >= 32) return 'hot';
    return 'cool';
  };

  const handleTempChange = (temp: number | null, unit: Unit) => {
    if (temp == null) { setMood('neutral'); return; }
    const tempC = unit === 'metric' ? temp : (temp - 32) * (5 / 9);
    setMood(getMoodFromTemp(tempC));
  };

  return (
    <>
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-2 sm:px-4 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name}! 👋</h1>
              <p className="text-gray-600 dark:text-gray-300">News mood: {mood.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="lg:col-span-1">
            <FiveDayForecastCard
              apiKey="0dded06259918d09bb53a2782513f05b"
              useMyLocation
              heightClassName={LEFT_CARD_HEIGHT}
              onTempChange={handleTempChange}
            />
          </div>

          <div className="lg:col-span-1">
            <LatestNewsCard
              country="us"
              mood={mood}
              heightClassName="h-[70vh]"
              apiKey="9f983265846e40e297d1c8e71a058c32"
            />
          </div>
        </div>
      </div>

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
