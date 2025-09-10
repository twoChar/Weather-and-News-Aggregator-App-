import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export type Mood = 'neutral' | 'cold' | 'hot' | 'cool';

type LatestNewsCardProps = {
  apiKey?: string;
  country?: string;            // ISO 3166-1 (e.g., 'us', 'in')
  heightClassName?: string;    // Tailwind height class
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
  hot: [
    'fear','threat','panic','risk','warning','alert','attack','terror',
    'violence','scare','outbreak','cyberattack','breach','storm'
  ],
  cool: [
    'win','wins','winner','victory','champion','record','breakthrough','award',
    'medal','celebrates','celebration','happiness','happy','joy','success',
    'surge','growth','profit'
  ],
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
        setError(null);

        // Base URL — no complex q. We’ll filter client-side.
        const base = `https://newsapi.org/v2/top-headlines?country=${country}&language=en&pageSize=50&apiKey=${apiKey}`;

        // OPTIONAL: If you want to bias the results a bit, uncomment the next lines
        // to send only ONE simple keyword (no OR/parentheses).
        // const firstKw = keywordMap[mood][0];
        // const url = firstKw ? `${base}&q=${encodeURIComponent(firstKw)}` : base;

        const url = base;

        const { data } = await axios.get(url);

        // NewsAPI returns {status:"ok"} or {status:"error", message:"..."}
        if (data?.status !== 'ok') {
          throw new Error(data?.message || 'NewsAPI returned an error.');
        }

        setAllNews(Array.isArray(data?.articles) ? data.articles : []);
      } catch (e: any) {
        console.error('News fetch error:', e?.message || e);
        setAllNews([]);
        setError('Failed to fetch news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [apiKey, country, mood]);

  // Client-side filter (safety net)
  const filteredNews = useMemo(() => {
    const kws = keywordMap[mood];
    if (!kws.length) return allNews;

    const terms = kws.map(k => k.toLowerCase());
    const matches = allNews.filter(a => {
      const text = `${a?.title ?? ''} ${a?.description ?? ''} ${a?.content ?? ''}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });

    // if nothing matched, fall back to unfiltered list so the card isn’t empty
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
                {article.title || 'Untitled'}
              </a>
              {article.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {article.description}
                </p>
              )}
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
