import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export type Mood = 'neutral' | 'cold' | 'hot' | 'cool';

type LatestNewsCardProps = {
  apiKey?: string;
  /** ISO 3166-1 (e.g., 'us', 'in') */
  country?: string;
  /** Tailwind height class */
  heightClassName?: string;
  /** Extra classes for the outer card */
  className?: string;
  /** Mood coming from Dashboard (computed from live temperature) */
  mood?: Mood;
  /** Card title */
  title?: string;
  /** If true, add a single mood keyword to the NewsAPI query for better results */
  biasApiWithMood?: boolean;
  /** If true, when mood ≠ neutral show ONLY matching items (no fallback) */
  exactMoodOnly?: boolean;
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

const moodStyles: Record<Mood, { bg: string; text: string; label: string; emoji: string }> = {
  neutral: { bg: 'bg-gray-100 dark:bg-gray-700',        text: 'text-gray-700 dark:text-gray-200',     label: 'Neutral', emoji: '😐' },
  cold:    { bg: 'bg-blue-100 dark:bg-blue-900/40',     text: 'text-blue-800 dark:text-blue-200',     label: 'Cold',    emoji: '🥶' },
  hot:     { bg: 'bg-red-100 dark:bg-red-900/40',       text: 'text-red-800 dark:text-red-200',       label: 'Hot',     emoji: '🥵' },
  cool:    { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200', label: 'Cool',  emoji: '😎' },
};

const LatestNewsCard: React.FC<LatestNewsCardProps> = ({
  apiKey = '9f983265846e40e297d1c8e71a058c32',
  country = 'us',
  heightClassName = 'h-[460px] lg:h-[460px]',
  className = '',
  mood = 'neutral',
  title = 'Latest News',
  biasApiWithMood = true,
  exactMoodOnly = true,
}) => {
  const [allNews, setAllNews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const base = `https://newsapi.org/v2/top-headlines?country=${country}&language=en&pageSize=50&apiKey=${apiKey}`;

        // Lightly bias the API toward the mood (keep it to ONE keyword; NewsAPI dislikes long boolean queries)
        const firstKw = biasApiWithMood ? keywordMap[mood]?.[0] : undefined;
        const url = firstKw ? `${base}&q=${encodeURIComponent(firstKw)}` : base;

        const { data } = await axios.get(url);
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
  }, [apiKey, country, mood, biasApiWithMood]);

  // Mood filter
  const filteredNews = useMemo(() => {
    const kws = keywordMap[mood];
    if (!kws.length) {
      // neutral → show everything
      return allNews;
    }

    const terms = kws.map(k => k.toLowerCase());
    const matches = allNews.filter(a => {
      const text = `${a?.title ?? ''} ${a?.description ?? ''} ${a?.content ?? ''}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });

    // exactMoodOnly true → NEVER fall back to all when mood is set
    return exactMoodOnly ? matches : (matches.length ? matches : allNews);
  }, [allNews, mood, exactMoodOnly]);

  const moodClass = moodStyles[mood];

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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">📰</span>
          {title}
        </h2>

        {/* Mood pill */}
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
            moodClass.bg,
            moodClass.text,
          ].join(' ')}
          title={`Mood filter: ${moodClass.label}`}
          aria-label={`Mood: ${moodClass.label}`}
        >
          <span className="mr-1">{moodClass.emoji}</span>
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
        // Clear empty state when mood is set but we didn’t find matches
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">
            No {moodClass.label.toLowerCase()}-mood headlines right now.
          </p>
        </div>
      )}
    </div>
  );
};

export default LatestNewsCard;
