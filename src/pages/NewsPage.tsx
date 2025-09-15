import React, { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { Calendar, ArrowRight } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  date: Date;
}

const generateNews = (count: number): NewsArticle[] => {
  const categories = ['Industry Updates', 'Association Events', 'Regulatory News', 'Member Spotlight'];
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(6),
    excerpt: faker.lorem.paragraph(2),
    imageUrl: faker.image.urlLoremFlickr({ category: 'business', width: 640, height: 480 }),
    category: categories[Math.floor(Math.random() * categories.length)],
    date: faker.date.recent({ days: 90 }),
  }));
};

const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    const news = generateNews(9).sort((a, b) => b.date.getTime() - a.date.getTime());
    setFeaturedArticle(news[0]);
    setArticles(news.slice(1));
  }, []);

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            News & Announcements
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with the latest updates from KMDA and the medical distribution industry.
          </p>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-gray-50 rounded-lg p-8">
            <div className="w-full">
              <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="rounded-lg shadow-lg object-cover w-full h-80" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700 uppercase">{featuredArticle.category}</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {featuredArticle.title}
              </h2>
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{featuredArticle.date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <p className="mt-4 text-lg text-gray-600">{featuredArticle.excerpt}</p>
              <a href="#" className="mt-6 inline-flex items-center font-semibold text-emerald-700 hover:text-emerald-800">
                Read More <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {/* Article Grid */}
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-shrink-0">
                <img className="h-48 w-full object-cover" src={article.imageUrl} alt={article.title} />
              </div>
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-600">
                    <a href="#" className="hover:underline">{article.category}</a>
                  </p>
                  <a href="#" className="block mt-2">
                    <p className="text-xl font-semibold text-gray-900">{article.title}</p>
                    <p className="mt-3 text-base text-gray-500">{article.excerpt.substring(0, 100)}...</p>
                  </a>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="text-sm text-gray-500">
                    <time dateTime={article.date.toISOString()}>
                      {article.date.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
