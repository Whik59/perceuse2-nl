'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { getString, generateProductReviews, generateProductReviewSnippet } from '../lib/utils';

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
  productSlug?: string; // For product-specific reviews
  productName?: string; // For product-specific reviews
}

const Reviews: React.FC<ReviewsProps> = ({ 
  limit = 6, 
  className = "",
  productSlug,
  productName
}) => {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        if (productSlug && productName) {
          // Try to load the actual product data to get AI-generated reviews
          try {
            const productResponse = await import(`../data/products/${productSlug}.json`);
            const productData = productResponse.default;
            
            // Use AI-generated customer reviews if available
            if (productData.customerReviews && productData.customerReviews.length > 0) {
              const productSpecificData: ReviewsData = {
                reviews: productData.customerReviews.slice(0, limit)
              };
              
              setReviewsData(productSpecificData);
              setDisplayedReviews(productSpecificData.reviews);
              return;
            }
            
            // Fallback: Use AI-generated review analysis if available
            if (productData.reviewAnalysis) {
              const reviewAnalysis = productData.reviewAnalysis;
              
              // Create reviews from the AI-generated analysis
              const aiReviews = [];
              
              // Add main detailed review
              if (reviewAnalysis.detailed_review) {
                aiReviews.push({
                  id: 1,
                  author: "Expert Reviewer",
                  rating: reviewAnalysis.overall_rating || 4.5,
                  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  text: reviewAnalysis.detailed_review,
                  verified: true,
                  helpful: Math.floor(Math.random() * 15) + 10
                });
              }
              
              // Add feature step reviews
              if (reviewAnalysis.feature_steps && reviewAnalysis.feature_steps.length > 0) {
                reviewAnalysis.feature_steps.slice(0, limit - 1).forEach((step, index) => {
                  aiReviews.push({
                    id: index + 2,
                    author: `Customer Review ${index + 1}`,
                    rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                    date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    text: `${step.title}: ${step.description}`,
                    verified: true,
                    helpful: Math.floor(Math.random() * 20) + 5
                  });
                });
              }
              
              const productSpecificData: ReviewsData = {
                reviews: aiReviews
              };
              
              setReviewsData(productSpecificData);
              setDisplayedReviews(productSpecificData.reviews);
              return;
            }
          } catch (error) {
            // If product file not found, fall back to generated reviews
          }
          
          // Fallback: Generate product-specific reviews using the same system as product pages
          const productReviews = generateProductReviews(productSlug, productName, limit);
          
          const productSpecificData: ReviewsData = {
            reviews: productReviews.map((review, index) => ({
              id: index + 1,
              author: review.author.name || review.author,
              rating: review.reviewRating?.ratingValue || 5,
              date: review.datePublished || new Date().toISOString().split('T')[0],
              text: review.reviewBody || '',
              verified: true,
              helpful: Math.floor(Math.random() * 20) + 5
            }))
          };
          
          setReviewsData(productSpecificData);
          setDisplayedReviews(productSpecificData.reviews);
        } else {
          // Fallback to static reviews for backward compatibility
          const response = await import('../locales/reviews.json');
          const data = response.default as ReviewsData;
          setReviewsData(data);
          // Shuffle and limit reviews
          const shuffled = [...data.reviews].sort(() => Math.random() - 0.5);
          setDisplayedReviews(shuffled.slice(0, limit));
        }
      } catch (error) {
        setReviewsData({ reviews: [] });
      }
    };
    loadReviews();
  }, [limit, productSlug, productName]);

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