'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Category } from '../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getString } from '../lib/utils';

interface SubcategoryWithImage extends Category {
  imageUrl?: string;
  hasImage?: boolean;
}

interface SubcategoryCardsProps {
  categories: Category[];
  parentCategoryId: number;
  title?: string;
}

const SubcategoryCards: React.FC<SubcategoryCardsProps> = ({ 
  categories, 
  parentCategoryId, 
  title = getString('subcategoryCards.title') 
}) => {
  const [subcategoriesWithImages, setSubcategoriesWithImages] = useState<SubcategoryWithImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Memoize filtered subcategories to prevent unnecessary re-filtering
  const subcategories = useMemo(() => 
    categories.filter(cat => cat.parentCategoryId === parentCategoryId),
    [categories, parentCategoryId]
  );

  // Memoize the dependency string to prevent unnecessary effect runs
  const subcategoriesKey = useMemo(() => 
    subcategories.map(c => c.categoryId).sort().join(','),
    [subcategories]
  );

  // Load category images with stable dependencies
  useEffect(() => {
    // Skip if no subcategories
    if (subcategories.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadSubcategoryImages = async () => {
      setIsLoading(true);
      const subcategoriesWithImages: SubcategoryWithImage[] = [];

      for (const subcategory of subcategories) {
        try {
          let imageUrl = '';
          let hasImage = false;
          
          // Try to find a product image from this subcategory
          try {
            const response = await fetch(`/api/products/by-category/${subcategory.categoryId}`);
            
            if (response.ok) {
              const products = await response.json();
              
              if (products.length > 0 && products[0].imagePaths?.length > 0) {
                imageUrl = products[0].imagePaths[0];
                hasImage = true;
              }
            }
          } catch (error) {
            console.error(`Error loading products for subcategory ${subcategory.categoryId}:`, error);
          }
          
          subcategoriesWithImages.push({
            ...subcategory,
            imageUrl,
            hasImage
          });
        } catch (error) {
          console.error(`Error loading image for subcategory ${subcategory.categoryId}:`, error);
          subcategoriesWithImages.push({
            ...subcategory,
            imageUrl: '',
            hasImage: false
          });
        }
      }

      setSubcategoriesWithImages(subcategoriesWithImages);
      setIsLoading(false);
    };

    loadSubcategoryImages();
  }, [subcategoriesKey]); // Only depend on the stable key

  // Don't render if no subcategories
  if (subcategories.length === 0) {
    return null;
  }

  // Slider functions with useCallback to prevent unnecessary re-renders
  const itemsPerSlide = 4;
  const totalSlides = Math.ceil(subcategoriesWithImages.length / itemsPerSlide);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}

          {/* Subcategories Grid */}
          <div className="overflow-hidden mx-12">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-gray-500 mt-4">{getString('subcategoryCards.loading')}</p>
              </div>
            ) : subcategoriesWithImages.length > 0 ? (
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
                      {subcategoriesWithImages
                        .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                        .map((subcategory) => (
                        <Link key={subcategory.slug} href={`/category/${subcategory.slug}`}>
                          <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 text-center">
                            <div className="space-y-4">
                              {/* Round Image Frame */}
                              <div className="relative mx-auto w-20 h-20">
                                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ring-2 ring-gray-100 group-hover:ring-orange-200">
                                  {subcategory.hasImage && subcategory.imageUrl ? (
                                    <Image
                                      src={subcategory.imageUrl}
                                      alt={subcategory.categoryNameCanonical || subcategory.name || 'Subcategory image'}
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
                                      <span className="text-orange-500 font-bold text-2xl">🔧</span>
                                    </div>
                                  )}
                                </div>
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-900/0 via-orange-900/0 to-orange-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                              </div>
                              
                              {/* Category Info */}
                              <div className="space-y-2">
                                <h3 className="text-gray-900 font-semibold text-lg line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                                  {subcategory.categoryNameCanonical}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {subcategory.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{getString('subcategoryCards.noSubcategories')}</p>
              </div>
            )}
          </div>

          {/* Dots Indicator */}
          {totalSlides > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-orange-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SubcategoryCards;
