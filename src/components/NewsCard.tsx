import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export type Mood = 'neutral' | 'cold' | 'hot' | 'cool';

type LatestNewsCardProps = {
 
  apiKey?: string;
  
  country?: string;
  heightClassName?: string;
  className?: string;
  mood?: Mood;
  title?: string;
};

const keywordMap: Record<Mood, string[]> = {
  neutral: [],
  cold: [
    'recession','layoff','bankruptcy','decline','crash','loss','pollution',
    'war','conflict','death','dies','killed','fatal','flood','earthquake',
    'drought','inflation','corruption','shortage','poverty'
  ],
  // hot → fear
  hot: [
    'fear','threat','panic','risk','warning','alert','attack','terror',
    'violence','scare','outbreak','cyberattack','breach','storm alert'
  ],
  // cool → winning / happiness
  cool: [
    'win','wins','winner','victory','champion','record','breakthrough','award',
    'medal','celebrates','celebration','happiness','happy','joy','success',
    'surge','growth','profit'
  ],
};

const buildQueryForMood = (mood: Mood) => {
  const kws = keywordMap[mood];
  if (!kws.length) return '';
  // keep it short to avoid hitting query limits
  const orChunk = kws.slice(0, 6).map(k => `"${k}"`).join(' OR ');
  return `(${orChunk})`;
};

const LatestNewsCard: React.FC<LatestNewsCardProps> = ({
  apiKey = '9f983265846e40e297d1c8e71a058c32',
  country = 'us',
  heightClassName = 'h-[460px] lg:h-[460px]',
  className = '',
  mood = 'neutral',
  title = 'Latest News',
}) => {
  const [allNews, setAllNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const q = buildQueryForMood(mood);
        const url = q
          ? `https://newsapi.org/v2/top-headlines?country=${country}&q=${encodeURIComponent(q)}&apiKey=${apiKey}`
          : `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`;
        const { data } = await axios.get(url);
        setAllNews(data?.articles ?? []);
        setError(null);
      } catch (e) {
        setError('Failed to fetch news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [apiKey, country, mood]);

  // Client-side filter safety net (if API query still brings unrelated items)
  const filteredNews = useMemo(() => {
    const kws = keywordMap[mood];
    if (!kws.length) return allNews;
    const toks = kws.map(k => k.toLowerCase());
    const matches = allNews.filter(a => {
      const text = `${a?.title ?? ''} ${a?.description ?? ''} ${a?.content ?? ''}`.toLowerCase();
      return toks.some(t => text.includes(t));
    });
    return matches.length ? matches : allNews;
  }, [allNews, mood]);

  return (
    <div
      className={[
        'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-full overflow-hidden',
        'hover:shadow-lg transition-all duration-300 ease-in-out relative group',
        heightClassName,
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10" />

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">📰</span>
        {title}
      </h2>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
          {filteredNews.map((article, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {article.title}
              </a>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {article.description || 'No description available.'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No news available</p>
        </div>
      )}
    </div>
  );
};

export default LatestNewsCard;

