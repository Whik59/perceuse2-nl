import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Category } from '../lib/types';
import { getString } from '../lib/utils';
import { ChevronLeft, ChevronRight, Gamepad2, Rabbit, Baby, Crown, Sparkles } from 'lucide-react';

interface CategoryWithImage extends Category {
  imageUrl?: string;
  hasImage?: boolean;
}

interface FeaturedCategoriesProps {
  categories: Category[];
}

const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories }) => {
  const [categoriesWithImages, setCategoriesWithImages] = useState<CategoryWithImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get top 5 categories with most subcategories
  const parentCategories = categories
    .filter(cat => cat.parentCategoryId === null)
    .map(parent => ({
      ...parent,
      subcategoryCount: categories.filter(sub => sub.parentCategoryId === parent.categoryId).length
    }))
    .sort((a, b) => b.subcategoryCount - a.subcategoryCount)
    .slice(0, 8);

  // Get category icon and gradient based on category name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('jeu') || name.includes('video') || name.includes('kirby')) {
      return <Gamepad2 className="w-12 h-12 text-purple-600" />;
    }
    if (name.includes('animaux') || name.includes('pieuvre') || name.includes('poulpe')) {
      return <Rabbit className="w-12 h-12 text-blue-600" />;
    }
    if (name.includes('bébé') || name.includes('enfant')) {
      return <Baby className="w-12 h-12 text-pink-600" />;
    }
    return <Crown className="w-12 h-12 text-amber-600" />;
  };

  const getCategoryGradient = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('jeu') || name.includes('video') || name.includes('kirby')) {
      return 'from-purple-100 via-indigo-100 to-purple-200';
    }
    if (name.includes('animaux') || name.includes('pieuvre') || name.includes('poulpe')) {
      return 'from-blue-100 via-cyan-100 to-blue-200';
    }
    if (name.includes('bébé') || name.includes('enfant')) {
      return 'from-pink-100 via-rose-100 to-pink-200';
    }
    return 'from-amber-100 via-yellow-100 to-amber-200';
  };

  useEffect(() => {
    const loadCategoryImages = async () => {
      setIsLoading(true);
      const categoriesWithImages: CategoryWithImage[] = [];

      for (const category of parentCategories) {
        try {
          // Try to get products for this category and subcategories
          const categoryIds = [category.categoryId];
          
          // Also check subcategories
          const subcategories = categories.filter(cat => cat.parentCategoryId === category.categoryId);
          subcategories.forEach(subcat => categoryIds.push(subcat.categoryId));
          
          let imageUrl = '';
          let hasImage = false;
          
          // Try to find a product image from any of the category IDs
          for (const categoryId of categoryIds) {
            try {
              const response = await fetch(`/api/products/by-category/${categoryId}`);
              
              if (response.ok) {
                const products = await response.json();
                
                if (products.length > 0 && products[0].imagePaths?.length > 0) {
                  imageUrl = products[0].imagePaths[0];
                  hasImage = true;
                  break; // Found an image, stop looking
                }
              }
            } catch (error) {
              console.error(`Error loading products for category ${categoryId}:`, error);
            }
          }
          
          categoriesWithImages.push({
            ...category,
            imageUrl,
            hasImage
          });
        } catch (error) {
          console.error(`Error loading image for category ${category.categoryId}:`, error);
          categoriesWithImages.push({
            ...category,
            imageUrl: '',
            hasImage: false
          });
        }
      }

      setCategoriesWithImages(categoriesWithImages);
      setIsLoading(false);
    };

    if (parentCategories.length > 0) {
      loadCategoryImages();
    }
  }, [categories]);

  const itemsPerSlide = 5; // Show 3 on mobile, 4 on sm, 5 on lg+
  const totalSlides = Math.ceil(categoriesWithImages.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Ensure we have categories to show
  const hasMultipleSlides = totalSlides > 1;

  if (isLoading) {
    return (
      <section className="py-16 lg:py-20 bg-gradient-to-br from-white via-slate-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-slate-200 rounded-2xl px-6 py-3 mb-6 animate-pulse">
              <div className="w-20 h-4 bg-slate-300 rounded"></div>
            </div>
            <div className="w-80 h-8 bg-slate-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="w-96 h-6 bg-slate-200 rounded mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 justify-items-center px-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-slate-200 rounded-full animate-pulse mb-3 sm:mb-4 lg:mb-6"></div>
                <div className="w-16 sm:w-20 h-3 sm:h-4 bg-slate-200 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categoriesWithImages.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-white via-slate-50/30 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-slate-100/20 to-stone-100/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-stone-100/20 to-slate-100/10 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-slate-100/80 via-white/90 to-slate-100/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-slate-200/50 mb-6">
            <Sparkles className="w-4 h-4 text-slate-600 mr-2" />
            <span className="text-sm font-semibold text-slate-700 tracking-wider uppercase">{getString('categories.collections')}</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extralight text-slate-900 mb-4 tracking-wide">
            {getString('categories.mostPopularCategories')}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            {getString('categories.discoverCollections')}
          </p>
        </div>

        {/* Categories Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          {hasMultipleSlides && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-slate-200/50"
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-6 h-6 text-slate-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-slate-200/50"
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="w-6 h-6 text-slate-700" />
              </button>
            </>
          )}

          {/* Categories Grid */}
          <div className="overflow-hidden mx-4 sm:mx-8 lg:mx-12">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 justify-items-center px-2">
                    {categoriesWithImages
                      .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                      .map((category) => (
                        <Link
                          key={category.categoryId}
                          href={`/category/${category.slug}`}
                          className="group text-center transition-all duration-300 hover:-translate-y-2"
                        >
                          {/* Round Image Frame */}
                          <div className="relative mb-3 sm:mb-4 lg:mb-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ring-2 sm:ring-4 ring-white group-hover:ring-slate-100">
                              {category.hasImage && category.imageUrl ? (
                                <Image
                                  src={category.imageUrl}
                                  alt={category.categoryNameCanonical || category.name || 'Category image'}
                                  width={128}
                                  height={128}
                                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(category.categoryNameCanonical || category.name || 'default')} flex items-center justify-center transition-all duration-700 group-hover:scale-110`}>
                                  <div className="scale-75 sm:scale-100">
                                    {getCategoryIcon(category.categoryNameCanonical || category.name || 'default')}
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900/0 via-slate-900/0 to-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          </div>

                          {/* Category Name */}
                          <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors duration-300 tracking-wide capitalize leading-tight">
                            {category.categoryNameCanonical}
                          </h3>
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {hasMultipleSlides && (
            <div className="flex justify-center mt-8 lg:mt-12 space-x-3">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-slate-900 scale-125'
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Categories Link */}
        <div className="text-center mt-12 lg:mt-16">
          <Link
            href="/categories"
            className="inline-flex items-center text-slate-700 hover:text-slate-900 font-semibold transition-all duration-300 group bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/50 hover:border-slate-300/50"
          >
            <span className="tracking-wide">{getString('categories.viewAllCategories')}</span>
            <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories; 