'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { getString } from '../lib/utils';

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  verified: boolean;
  date: string;
  helpful: number;
}

interface ReviewsData {
  reviews: Review[];
}

interface ReviewsProps {
  limit?: number;
  className?: string;
}

const Reviews: React.FC<ReviewsProps> = ({ 
  limit = 6, 
  className = "" 
}) => {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await import('../locales/reviews.json');
        const data = response.default as ReviewsData;
        setReviewsData(data);
        // Shuffle and limit reviews
        const shuffled = [...data.reviews].sort(() => Math.random() - 0.5);
        setDisplayedReviews(shuffled.slice(0, limit));
      } catch (error) {
        setReviewsData({ reviews: [] });
      }
    };
    loadReviews();
  }, [limit]);

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!reviewsData) {
    return <div className={`animate-pulse ${className}`}></div>;
  }

  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayedReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-700 text-lg">{review.author}</span>
              {review.verified && (
                <span className="flex items-center text-green-600 text-xs font-semibold ml-2">
                  <CheckCircle className="w-4 h-4 mr-1" /> {getString('product.verifiedPurchase')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-xs text-gray-400">{formatDate(review.date)}</span>
            </div>
            <div className="text-gray-700 text-base">{review.text}</div>
            <div className="flex items-center gap-2 mt-2">
              <ThumbsUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">{review.helpful} útil</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Reviews; 