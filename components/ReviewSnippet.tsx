'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { generateProductReviewSnippet, getString } from '../lib/utils';

interface ReviewSnippetProps {
  productSlug: string;
  productTitle: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCount?: boolean;
}

const ReviewSnippet: React.FC<ReviewSnippetProps> = ({
  productSlug,
  productTitle,
  size = 'md',
  className = '',
  showCount = true
}) => {
  const reviewData = generateProductReviewSnippet(productSlug, productTitle);
  
  const sizeClasses = {
    sm: {
      star: 'w-3 h-3',
      text: 'text-xs',
      rating: 'text-xs'
    },
    md: {
      star: 'w-4 h-4',
      text: 'text-sm',
      rating: 'text-sm'
    },
    lg: {
      star: 'w-5 h-5',
      text: 'text-base',
      rating: 'text-base'
    }
  };
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          
          if (starValue <= Math.floor(rating)) {
            // Full star
            return (
              <Star
                key={index}
                className={`${sizeClasses[size].star} text-yellow-400 fill-yellow-400`}
              />
            );
          } else if (starValue === Math.ceil(rating) && rating % 1 !== 0) {
            // Partial star
            const fillPercentage = (rating % 1) * 100;
            return (
              <div key={index} className="relative">
                <Star className={`${sizeClasses[size].star} text-gray-300`} />
                <div 
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={`${sizeClasses[size].star} text-yellow-400 fill-yellow-400`} />
                </div>
              </div>
            );
          } else {
            // Empty star
            return (
              <Star
                key={index}
                className={`${sizeClasses[size].star} text-gray-300`}
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {renderStars(reviewData.averageRating)}
      <span className={`${sizeClasses[size].rating} font-medium text-gray-700`}>
        {reviewData.averageRating.toFixed(1)}
      </span>
      {showCount && (
        <>
          <span className={`${sizeClasses[size].text} text-gray-400`}>•</span>
          <span className={`${sizeClasses[size].text} text-gray-600`}>
            {reviewData.reviewCount} {getString('product.reviews')}
          </span>
        </>
      )}
    </div>
  );
};

export default ReviewSnippet; 