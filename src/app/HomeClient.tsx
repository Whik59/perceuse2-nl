'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import Reviews from '../../components/Reviews';
import { Button } from '../../components/ui/Button';
import ProductCard from '../../components/ProductCard';
import { Product, Category, CartState } from '../../lib/types';
import { getString, formatCurrency } from '../../lib/utils';
import { siteConfig } from '../../lib/config';

// Get site name from environment with fallback
const getSiteName = () => {
  return getString('common.siteName');
};
import { redirectToAmazonCart } from '../../lib/cart';
import { Star, Truck, Shield, RefreshCw, Award, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategories, useCategoryProducts } from '../../lib/useDataCache';

interface CategoryWithImage extends Category {
  imageUrl?: string;
  hasImage?: boolean;
}

interface HomeClientProps {
  products: Product[];
  categories: Category[];
}

const HomeClient: React.FC<HomeClientProps> = ({ products, categories: propCategories }) => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });
  const [categoriesWithImages, setCategoriesWithImages] = useState<CategoryWithImage[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use cached categories data
  const { data: cachedCategories, fetchData: fetchCategories } = useCategories();
  const categories = cachedCategories || propCategories;

  // Fetch categories if not cached and not provided as props
  useEffect(() => {
    if (!cachedCategories && propCategories.length === 0) {
      fetchCategories(async () => {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
      });
    }
  }, [cachedCategories, propCategories.length, fetchCategories]);

  // Debug: Log products to console
  useEffect(() => {
    console.log('Products received in HomeClient:', products);
    console.log('Products length:', products.length);
    if (products.length > 0) {
      console.log('First product:', products[0]);
    }
  }, [products]);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  // Load category images
  useEffect(() => {
    const loadCategoryImages = async () => {
      setIsLoadingCategories(true);
       const topCategories = categories.slice(0, 20); // Get first 20 categories
      const categoriesWithImages: CategoryWithImage[] = [];

      for (const category of topCategories) {
        try {
          let imageUrl = '';
          let hasImage = false;
          
          // Try to find a product image from this category
          try {
            const response = await fetch(`/api/products/by-category/${category.categoryId}`);
            
            if (response.ok) {
              const products = await response.json();
              
              if (products.length > 0 && products[0].imagePaths?.length > 0) {
                imageUrl = products[0].imagePaths[0];
                hasImage = true;
              }
            }
          } catch (error) {
            console.error(`Error loading products for category ${category.categoryId}:`, error);
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
      setIsLoadingCategories(false);
    };

    if (categories.length > 0) {
      loadCategoryImages();
    }
  }, [categories]);

  // Save cart to localStorage whenever cart changes
  const saveCart = (newCart: CartState) => {
    try {
      localStorage.setItem('cart', JSON.stringify(newCart));
      setCart(newCart);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const handleBuyOnAmazon = (product: Product) => {
    try {
      // Redirect directly to Amazon with affiliate link
      window.open(product.amazonUrl, '_blank');
      
    } catch (error) {
      console.error('Error redirecting to Amazon:', error);
    }
  };

  const handleCartClick = () => {
    if (typeof window !== 'undefined') {
      const openCartDrawer = (window as Window & { openCartDrawer?: () => void }).openCartDrawer;
      if (openCartDrawer) {
        openCartDrawer();
      } else {
        window.location.href = '/cart';
      }
    }
  };

  const handleSearch = (query: string) => {
    // Redirect to search page
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

   const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

   // Responsive items per slide
   const [itemsPerSlide, setItemsPerSlide] = useState(2); // Default to 2 for mobile
   
   useEffect(() => {
     const updateItemsPerSlide = () => {
       if (window.innerWidth < 640) {
         setItemsPerSlide(2); // 2 columns on mobile
       } else {
         setItemsPerSlide(3); // 3 columns on desktop
       }
     };
     
     updateItemsPerSlide();
     window.addEventListener('resize', updateItemsPerSlide);
     return () => window.removeEventListener('resize', updateItemsPerSlide);
   }, []);
   
   const totalSlides = Math.ceil(categoriesWithImages.length / itemsPerSlide);

   const nextSlide = () => {
     setCurrentSlide((prev) => (prev + 1) % totalSlides);
   };

   const prevSlide = () => {
     setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
   };

  return (
    <Layout
      categories={categories}
      showFloatingButtons={true}
      showBanner={false}
    >
      {/* Hero Section with Two Columns */}
      <section className="relative pt-0 pb-8 md:pb-12 overflow-hidden -mt-16 lg:-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-1">
            {/* Top Image - Mobile */}
            <div className="bg-white p-1 flex items-center justify-center overflow-hidden">
                <div className="w-full h-[300px] overflow-hidden">
                  <Image
                    src="/hero2.png"
                    alt="Professional Massagegeräte 2"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center 15%' }}
                    priority={true}
                    sizes="100vw"
                  />
                </div>
            </div>

            {/* Orange Background - Mobile */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-4 py-8 flex flex-col justify-center items-center space-y-2 rounded-full relative z-10 w-fit mx-auto min-w-[280px] max-w-sm shadow-xl border border-orange-400/20 transform hover:scale-102 transition-all duration-300">
              {/* Trust Badge */}
              <div className="inline-flex items-center justify-center space-x-1 bg-orange-100 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-orange-200 shadow-lg w-fit mx-auto">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-orange-500 text-orange-500" />
                  ))}
                </div>
                <span className="text-orange-600 font-bold text-sm">{getString('hero.trust.rating')}</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-1 text-center">
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight tracking-tight">
                  {getString('hero.expertise.title')}
                </h1>
                <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium px-1">
                  {getString('hero.expertise.subtitle')}
                </p>
              </div>

              {/* CTA Button */}
              <div className="pt-0">
                <Link href="#category-cards">
                  <Button 
                    size="sm" 
                    className="bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 px-8 py-2.5 text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 transform border border-orange-200/50 hover:border-orange-300/50"
                  >
                    {getString('hero.expertise.cta')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bottom Image - Mobile */}
            <div className="bg-white p-1 flex items-center justify-center overflow-hidden">
              <div className="w-full h-[300px] overflow-hidden">
                  <Image
                    src="/hero1.png"
                    alt="Professional Massagegeräte"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center 40%' }}
                    loading="lazy"
                    sizes="100vw"
                  />
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            {/* Background Images */}
            <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch z-0">
              {/* Left Background Image */}
              <div className="bg-white p-2 lg:p-4 flex items-center justify-center">
                <Image
                  src="/hero2.png"
                  alt="Professional Massagegeräte 2"
                  width={800}
                  height={600}
                  className="w-auto h-auto max-w-lg"
                  priority={true}
                  sizes="33vw"
                />
              </div>
              
              {/* Center Background */}
              <div className="bg-transparent"></div>
              
              {/* Right Background Image */}
              <div className="bg-white p-2 lg:p-4 flex items-center justify-center">
                <Image
                  src="/hero1.png"
                  alt="Professional Massagegeräte"
                  width={800}
                  height={600}
                  className="w-auto h-auto max-w-lg"
                  loading="lazy"
                  sizes="33vw"
                />
              </div>
            </div>
            
            {/* Foreground Content */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch">
              {/* Left Column - Empty */}
              <div className="bg-transparent"></div>

              {/* Middle Column - Orange Background */}
              <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-6 py-10 flex flex-col justify-center items-center space-y-3 rounded-full mx-4 my-16 w-fit mx-auto min-w-[320px] max-w-md shadow-xl border border-orange-400/20 transform hover:scale-102 transition-all duration-300">
                {/* Trust Badge */}
                <div className="inline-flex items-center justify-center space-x-1 bg-orange-100 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-orange-200 shadow-lg w-fit mx-auto">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-orange-500 text-orange-500" />
                    ))}
                  </div>
                  <span className="text-orange-600 font-bold text-sm">{getString('hero.trust.rating')}</span>
                </div>

                {/* Main Headline */}
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                    {getString('hero.expertise.title')}
                  </h1>
                  <p className="text-base md:text-lg text-white/90 leading-relaxed font-medium px-2">
                    {getString('hero.expertise.subtitle')}
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-1">
                  <Link href="#category-cards">
                    <Button 
                      size="lg" 
                      className="bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 px-10 py-3 text-base font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102 transform border border-orange-200/50 hover:border-orange-300/50"
                    >
                      {getString('hero.expertise.cta')}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column - Empty */}
              <div className="bg-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards Section */}
      <section id="category-cards" className="py-8 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 bg-clip-text text-transparent mb-4">
              {getString('categories.title')}
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
              {getString('categories.subtitle')}
            </p>
          </div>
          
          {/* Slider Container */}
          <div className="relative">
            {/* Navigation Arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg hover:shadow-xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-gray-200"
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg hover:shadow-xl rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-gray-200"
                  disabled={currentSlide === totalSlides - 1}
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </>
            )}

            {/* Categories Grid */}
            <div className="overflow-hidden mx-16">
              {isLoadingCategories ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{getString('categories.loading')}</p>
                </div>
              ) : categoriesWithImages.length > 0 ? (
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-2">
                        {categoriesWithImages
                          .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                          .map((category, index) => (
                          <Link key={category.slug} href={`/category/${category.slug}`}>
                            <div className="group">
                              {/* Image Container */}
                              <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 aspect-[4/3] mb-3">
                                {/* Full-space Background Image */}
                                <div className="absolute inset-0">
                                  {category.hasImage && category.imageUrl ? (
                                    <Image
                                      src={category.imageUrl}
                                      alt={category.categoryNameCanonical || category.name || 'Category image'}
                                      fill
                                      className="object-contain p-2"
                                      sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center">
                                      <svg className="w-16 h-16 text-white opacity-80" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                                        <g fill="currentColor" fillRule="evenodd">
                                          <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fillRule="nonzero"/>
                                          <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095"/>
                                        </g>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Amazon Icon */}
                                <div className="absolute top-3 right-3 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-5 h-5 text-white" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" fillRule="evenodd">
                                      <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fill="#FF9900" fillRule="nonzero"/>
                                      <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095" fill="#000000"/>
                                    </g>
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Button Below Image */}
                              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-400/50 group-hover:scale-105">
                                <div className="flex items-center justify-center">
                                  <span className="text-xs font-bold text-center leading-tight line-clamp-3">
                                    {category.categoryNameCanonical}
                                  </span>
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
                  <p className="text-gray-500">{getString('categories.noProducts')}</p>
                </div>
              )}
            </div>

            {/* Dots Indicator */}
            {totalSlides > 1 && (
              <div className="flex justify-center mt-8 space-x-3">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-orange-500 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {products && products.length > 0 ? (
              products
                .sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0)) // Sort by price descending
                .slice(0, 18) // Get top 18 most expensive
                .map((product, index) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    onAddToCart={() => redirectToAmazonCart({ items: [{ productId: product.productId || 0, slug: product.slug, title: product.title, price: product.basePrice, imagePath: product.imagePaths[0], amazonUrl: product.amazonUrl, quantity: 1 }], subtotal: product.basePrice })}
                  />
                ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">{getString('homepage.hero.featured.loading')}</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/">
              <Button 
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300"
              >
                {getString('homepage.hero.featured.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews limit={6} />
      
    </Layout>
  );
};

export default HomeClient; 