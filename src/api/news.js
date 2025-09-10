import type { VercelRequest, VercelResponse } from '@vercel/node';

const KEY = process.env.NEWS_API_KEY!;

// Optional: keep your client-side keyword map in sync with this one
const moodKeywords: Record<string, string[]> = {
  neutral: [],
  cold: ['recession','layoff','bankruptcy','decline','crash','loss','pollution','war','conflict','death','dies','killed','fatal','flood','earthquake','drought','inflation','corruption','shortage','poverty'],
  hot: ['fear','threat','panic','risk','warning','alert','attack','terror','violence','scare','outbreak','cyberattack','breach','storm'],
  cool: ['win','wins','winner','victory','champion','record','breakthrough','award','medal','celebrates','celebration','happiness','happy','joy','success','surge','growth','profit'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const country = (req.query.country as string) || 'us';
    const mood = (req.query.mood as string) || 'neutral';
    const keywords = moodKeywords[mood] || [];

    // Use ONE keyword to avoid NewsAPI rejecting complex queries
    const q = keywords[0] || '';

    const url = new URL('https://newsapi.org/v2/top-headlines');
    url.searchParams.set('country', country);
    url.searchParams.set('language', 'en');
    url.searchParams.set('pageSize', '50');
    if (q) url.searchParams.set('q', q);

    const r = await fetch(url.toString(), {
      headers: { 'X-Api-Key': KEY },
    });

    const data = await r.json();
    if (!r.ok || data.status !== 'ok') {
      return res.status(r.status || 500).json({ status: 'error', message: data?.message || 'News API error' });
    }

    // Optionally: do extra filtering here based on keywords array

    return res.status(200).json({ status: 'ok', articles: data.articles });
  } catch (e: any) {
    return res.status(500).json({ status: 'error', message: e?.message || 'Server error' });
  }
}
