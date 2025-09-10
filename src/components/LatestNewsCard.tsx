import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export type Mood = 'neutral' | 'cold' | 'hot' | 'cool';

type LatestNewsCardProps = {
  apiKey?: string;
  country?: string;            // used for top-headlines fallback
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
    'drought','inflation','corruption','shortage','poverty','tragedy','debt','crisis'
  ],
  hot: [
    'fear','threat','panic','risk','warning','alert','attack','terror',
    'violence','scare','outbreak','cyberattack','breach','storm','heatwave','wildfire'
  ],
  cool: [
    'win','wins','winner','victory','champion','record','breakthrough','award',
    'medal','celebrates','celebration','happiness','happy','joy','success',
    'surge','growth','profit','uplifting','inspiring'
  ],
};

const moodStyles: Record<Mood, {bg: string; text: string; label: string}> = {
  neutral: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-200', label: 'Neutral' },
  cold:    { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200', label: 'Cold' },
  hot:     { bg: 'bg-red-100 dark:bg-red-900/40',  text: 'text-red-800 dark:text-red-200',   label: 'Hot' },
  cool:    { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200', label: 'Cool' },
};

function buildMoodQuery(mood: Mood): string | null {
  const terms = keywordMap[mood];
  if (!terms?.length) return null;
  // Use OR inside quotes to let NewsAPI `everything` match any of them
  // Also bias to last few days to keep things relevant.
  const quoted = terms.slice(0, 8).map(t => `"${t}"`); // cap to keep query compact
  return `(${quoted.join(' OR ')})`;
}

const LatestNewsCard: React.FC<LatestNewsCardProps> = ({
  apiKey = '9f983265846e40e297d1c8e71a058c32',
  country = 'us',
  heightClassName = 'h-[460px] lg:h-[460px]',
  className = '',
  mood = 'neutral',
  title = 'Latest News',
}) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const q = buildMoodQuery(mood);

        if (q) {
          // 1) Try mood-targeted search first (everything supports OR/quotes)
          const everythingURL =
            `https://newsapi.org/v2/everything?language=en&sortBy=publishedAt&pageSize=50&q=${encodeURIComponent(q)}&apiKey=${apiKey}`;
          const { data } = await axios.get(everythingURL);

          if (!cancelled && data?.status === 'ok' && Array.isArray(data.articles) && data.articles.length) {
            setArticles(data.articles);
            return;
          }
          // 2) Fallback to top-headlines if nothing matched
        }

        const topURL =
          `https://newsapi.org/v2/top-headlines?country=${country}&language=en&pageSize=50&apiKey=${apiKey}`;
        const { data: top } = await axios.get(topURL);

        if (!cancelled) {
          if (top?.status !== 'ok') throw new Error(top?.message || 'NewsAPI error');
          setArticles(Array.isArray(top.articles) ? top.articles : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('News fetch error:', e?.message || e);
          setArticles([]);
          setError('Failed to fetch news. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNews();
    return () => { cancelled = true; };
  }, [apiKey, country, mood]);

  // If we used `everything` with mood terms, the server already filtered for us.
  // But for the top-headlines fallback, we still do a light client-side filter to bias results.
  const filtered = useMemo(() => {
    const q = buildMoodQuery(mood);
    if (q) return articles; // already filtered server-side

    const terms = keywordMap[mood]?.map(t => t.toLowerCase()) ?? [];
    if (!terms.length) return articles;

    const matches = articles.filter(a => {
      const text = `${a?.title ?? ''} ${a?.description ?? ''} ${a?.content ?? ''}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });

    return matches.length ? matches : articles;
  }, [articles, mood]);

  const moodClass = moodStyles[mood];

  return (
    <div
      className={[
        'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col overflow-hidden',
        'hover:shadow-lg transition-all duration-300 ease-in-out relative group',
        heightClassName,
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-gray-800 -z-10" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">📰</span>
          {title}
        </h2>
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
            moodClass.bg,
            moodClass.text,
          ].join(' ')}
          title={`Mood filter: ${moodClass.label}`}
          aria-label={`Mood: ${moodClass.label}`}
        >
          {moodClass.label}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
          {filtered.map((article, index) => (
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
          <p className="text-gray-500">No news matched this mood. Showing top headlines instead might help.</p>
        </div>
      )}
    </div>
  );
};

export default LatestNewsCard;
