'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { getString } from '../lib/utils';

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  productTitle?: string;
  verified: boolean;
  date: string;
  helpful: number;
}

interface ReviewsData {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

interface ReviewsProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

const Reviews: React.FC<ReviewsProps> = ({ 
  limit = 6, 
  showTitle = true, 
  className = "" 
}) => {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await import('../data/reviews.json');
        const data = response.default as ReviewsData;
        setReviewsData(data);
        
        // Shuffle and limit reviews
        const shuffled = [...data.reviews].sort(() => Math.random() - 0.5);
        setDisplayedReviews(shuffled.slice(0, limit));
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    loadReviews();
  }, [limit]);

  const handleHelpful = (reviewId: number) => {
    setDisplayedReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      )
    );
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              index < rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!reviewsData) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">
              {getString('reviews.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {getString('reviews.subtitle')}
            </p>
            
            {/* Overall Rating */}
            <div className="inline-flex items-center space-x-4 bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {reviewsData.averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(reviewsData.averageRating), 'lg')}
              </div>
              <div className="w-px h-16 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">
                  {reviewsData.totalReviews.toLocaleString('fr-FR')}
                </div>
                <div className="text-sm text-gray-600">
                  avis clients
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Review Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-900 to-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {review.author}
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating, 'sm')}
                      {review.verified && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">
                            {getString('reviews.verifiedPurchase')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(review.date)}
                </div>
              </div>

              {/* Product Title */}
              {review.productTitle && (
                <div className="text-sm font-medium text-gray-700 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                  &ldquo;{review.productTitle}&rdquo;
                </div>
              )}

              {/* Review Text */}
              <p className="text-gray-700 leading-relaxed mb-4">
                {review.text}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{getString('reviews.helpful')} ({review.helpful})</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-light mb-4">
              Rejoignez nos {reviewsData.totalReviews.toLocaleString('fr-FR')}+ clients satisfaits
            </h3>
            <p className="text-gray-300 mb-6">
              Découvrez pourquoi tant de familles nous font confiance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">4.6★</div>
                <div className="text-sm text-gray-300">Note moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-gray-300">Clients satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">24h</div>
                <div className="text-sm text-gray-300">Expédition</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews; 