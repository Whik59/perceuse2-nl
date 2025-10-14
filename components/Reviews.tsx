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
          className={`w-4 h-4 ${index < rating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`}
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
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedReviews.map((review) => (
          <div key={review.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
            {/* Header with name and verified badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{review.author}</span>
                {review.verified && (
                  <span className="flex items-center bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {getString('product.verifiedPurchase')}
                  </span>
                )}
              </div>
            </div>

            {/* Rating and date */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center">
                {renderStars(review.rating)}
              </div>
              <span className="text-xs text-gray-500">{formatDate(review.date)}</span>
            </div>

            {/* Review text */}
            <div className="text-gray-800 text-sm leading-relaxed mb-4">{review.text}</div>

            {/* Helpful votes */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors duration-200">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-medium">{review.helpful}</span>
              </button>
              <span className="text-xs text-gray-500">nützlich</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Reviews; 