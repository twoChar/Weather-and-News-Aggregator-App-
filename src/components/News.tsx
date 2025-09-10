import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

interface NewsProps {
  currentTemperature: number;
}

const News: React.FC<NewsProps> = ({ currentTemperature }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get<NewsAPIResponse>(
          `https://newsapi.org/v2/top-headlines?country=us&apiKey=9f983265846e40e297d1c8e71a058c32`
        );

        let filteredArticles: NewsArticle[] = [];

        if (currentTemperature <= 10) {
          filteredArticles = response.data.articles.filter((article) =>
            article.title.toLowerCase().includes('depress') ||
            article.description?.toLowerCase().includes('depress')
          );
        } else if (currentTemperature >= 30) {
          filteredArticles = response.data.articles.filter((article) =>
            article.title.toLowerCase().includes('fear') ||
            article.description?.toLowerCase().includes('fear')
          );
        } else {
          filteredArticles = response.data.articles.filter((article) =>
            article.title.toLowerCase().includes('happy') ||
            article.description?.toLowerCase().includes('win')
          );
        }

        setNews(filteredArticles);
        setError(null);
      } catch (err) {
        setError('Failed to fetch news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentTemperature]);

  if (loading) {
    return <div>Loading news...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="news-container">
      {news.length > 0 ? (
        news.map((article, index) => (
          <div key={index} className="news-card">
            <h3 className="news-title">{article.title}</h3>
            <p className="news-description">{article.description}</p>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-link">
              Read more
            </a>
          </div>
        ))
      ) : (
        <div>No news articles match the criteria.</div>
      )}
    </div>
  );
};

export default News;
