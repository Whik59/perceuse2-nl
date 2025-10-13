'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import Reviews from '../../components/Reviews';
import { Button } from '../../components/ui/Button';
import { Product, Category, CartState } from '../../lib/types';
import { getString, formatCurrency } from '../../lib/utils';
import { siteConfig } from '../../lib/config';

// Get site name from environment with fallback
const getSiteName = () => {
  return getString('common.siteName');
};
import { redirectToAmazonCart } from '../../lib/cart';
import { Star, Truck, Shield, RefreshCw, Award, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryWithImage extends Category {
  imageUrl?: string;
  hasImage?: boolean;
}

interface HomeClientProps {
  products: Product[];
  categories: Category[];
}

const HomeClient: React.FC<HomeClientProps> = ({ products, categories }) => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });
  const [categoriesWithImages, setCategoriesWithImages] = useState<CategoryWithImage[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

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

   // Slider functions
   const itemsPerSlide = 4;
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
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Hero Content */}
            <div className="space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-yellow-400 font-bold">{getString('hero.trust.rating')}</span>
                <span className="text-white/60">•</span>
                <span className="text-white font-medium">{getString('hero.trust.badge')}</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {getString('hero.expertise.title')}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                  {getString('hero.expertise.subtitle')}
                </p>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href="/categories">
                  <Button 
                    size="lg" 
                    className="bg-white hover:bg-white/90 text-orange-600 px-12 py-4 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    {getString('hero.expertise.cta')}
                  </Button>
                </Link>
              </div>
            </div>

             {/* Right Column - Category Cards */}
             <div className="space-y-6">
               <h2 className="text-2xl font-bold text-white text-center mb-8">
                 {getString('categories.title')}
               </h2>
               
               {/* Slider Container */}
               <div className="relative">
                 {/* Navigation Arrows */}
                 {totalSlides > 1 && (
                   <>
                     <button
                       onClick={prevSlide}
                       className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                       disabled={currentSlide === 0}
                     >
                       <ChevronLeft className="w-4 h-4 text-white" />
                     </button>
                     <button
                       onClick={nextSlide}
                       className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                       disabled={currentSlide === totalSlides - 1}
                     >
                       <ChevronRight className="w-4 h-4 text-white" />
                     </button>
                   </>
                 )}

                 {/* Categories Grid */}
                 <div className="overflow-hidden mx-8">
                   {isLoadingCategories ? (
                     <div className="text-center py-8">
                       <p className="text-white/70">{getString('categories.loading')}</p>
                     </div>
                   ) : categoriesWithImages.length > 0 ? (
                     <div 
                       className="flex transition-transform duration-500 ease-in-out"
                       style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                     >
                       {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                         <div key={slideIndex} className="w-full flex-shrink-0">
                           <div className="grid grid-cols-2 gap-4 px-2">
                             {categoriesWithImages
                               .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                               .map((category, index) => (
                               <Link key={category.slug} href={`/category/${category.slug}`}>
                                 <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                                   <div className="text-center space-y-3">
                                     {/* Round Image Frame */}
                                     <div className="relative mx-auto w-16 h-16">
                                       <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ring-2 ring-white group-hover:ring-white/80">
                                         {category.hasImage && category.imageUrl ? (
                                           <Image
                                             src={category.imageUrl}
                                             alt={category.categoryNameCanonical || category.name || 'Category image'}
                                             width={64}
                                             height={64}
                                             className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                           />
                                         ) : (
                                           <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
                                             <span className="text-white font-bold text-xl">🍳</span>
                                           </div>
                                         )}
                                       </div>
                                       {/* Hover Overlay */}
                                       <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900/0 via-slate-900/0 to-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                     </div>
                                     <h3 className="text-white font-semibold text-sm line-clamp-2">
                                       {category.categoryNameCanonical}
                                     </h3>
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
                       <p className="text-white/70">{getString('categories.noProducts')}</p>
                     </div>
                   )}
                 </div>

                 {/* Dots Indicator */}
                 {totalSlides > 1 && (
                   <div className="flex justify-center mt-6 space-x-2">
                     {Array.from({ length: totalSlides }).map((_, index) => (
                       <button
                         key={index}
                         onClick={() => setCurrentSlide(index)}
                         className={`w-2 h-2 rounded-full transition-all duration-300 ${
                           index === currentSlide
                             ? 'bg-white scale-125'
                             : 'bg-white/40 hover:bg-white/60'
                         }`}
                       />
                     ))}
                   </div>
                 )}
               </div>
               
               {/* View All Categories Button */}
               <div className="text-center pt-4">
                 <Link href="/categories">
                   <Button 
                     size="sm"
                     className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300"
                   >
                     {getString('categories.viewAllCategories')}
                   </Button>
                 </Link>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getString('homepage.hero.featured.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getString('homepage.hero.featured.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {products && products.length > 0 ? (
              products
                .sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0)) // Sort by price descending
                .slice(0, 18) // Get top 18 most expensive
                .map((product, index) => (
                <Link key={product.slug} href={`/product/${product.slug}`}>
                  <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-square bg-white flex items-center justify-center p-3">
                      <Image
                        src={product.imagePaths?.[0] || '/placeholder-product.jpg'}
                        alt={product.title || 'Product'}
                        width={150}
                        height={150}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(product.basePrice)}
                      </p>
                      {/* Amazon CTA Section */}
                      <a
                        href={product.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block mt-4"
                      >
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 p-3 rounded-lg border border-orange-200">
                          {/* Amazon Logo and Price Info */}
                          <div className="flex items-center space-x-2 mb-2">
                            {/* Amazon Logo */}
                            <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                              <svg className="w-4 h-4" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                                <g fill="none" fillRule="evenodd">
                                  <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fill="#FF9900" fillRule="nonzero"/>
                                  <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095" fill="#000000"/>
                                </g>
                              </svg>
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 text-xs">Amazon</div>
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(product.basePrice)}</span>
                                {product.onSale && (
                                  <span className="bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded">
                                    -30%
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5">
                                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-red-600 font-medium">{getString('product.offer24h')}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Orange Buy Button */}
                          <div className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded-lg transition-colors duration-200 group-hover:scale-105 text-center text-xs">
                            {getString('amazon.buyOnAmazon')}
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">{getString('homepage.hero.featured.loading')}</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/categories">
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