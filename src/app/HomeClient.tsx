'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/ProductCard';
import FeaturedProducts from '../../components/FeaturedProducts';
import FeaturedCategories from '../../components/FeaturedCategories';
import AboutSection from '../../components/AboutSection';
import WhyChooseUs from '../../components/WhyChooseUs';
import Reviews from '../../components/Reviews';
import { Button } from '../../components/ui/Button';
import { Product, Category, CartState } from '../../lib/types';
import { getString, formatCurrency } from '../../lib/utils';
import { siteConfig } from '../../lib/config';

// Get site name from environment with fallback
const getSiteName = () => {
  return process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || siteConfig.siteName;
};
import { redirectToAmazonCart } from '../../lib/cart';
import { Star, Truck, Shield, RefreshCw, Award, ArrowRight } from 'lucide-react';

interface HomeClientProps {
  products: Product[];
  categories: Category[];
}

const HomeClient: React.FC<HomeClientProps> = ({ products, categories }) => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });

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
    console.log('Search:', query);
  };

  const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Layout
      categories={categories}
      showFloatingButtons={true}
    >
      {/* Luxury Hero Section */}
      <section className="relative bg-gradient-to-br from-stone-100 via-neutral-50 to-stone-100 overflow-hidden min-h-[60vh] md:min-h-[75vh] flex items-center">
        {/* Hero Background Image - Responsive */}
        <div className="absolute inset-0">
          {/* Mobile Image */}
          <Image
            src="/hero-mobile.png" 
            alt={getString('hero.expertise.title')}
            fill
            className="object-cover object-center md:hidden"
            priority
            sizes="(max-width: 768px) 100vw, 0px"
            onError={(e) => {
              console.log('Mobile hero image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Desktop Image */}
          <Image
            src="/hero.png" 
            alt={getString('hero.expertise.title')}
            fill
            className="object-cover object-center hidden md:block"
            priority
            sizes="(min-width: 768px) 100vw, 0px"
            onError={(e) => {
              console.log('Desktop hero image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center max-w-5xl mx-auto space-y-10 md:space-y-12">
            
            {/* Trust Badge */}
            <div className="inline-flex items-center space-x-3 text-sm font-semibold text-white bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-amber-400 font-bold">{getString('hero.trust.rating')}</span>
              <span className="text-white/60">•</span>
              <span>{getString('hero.trust.badge')}</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-8">
              <div className="relative">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-2xl">
                    {getString('hero.expertise.title')}
                  </span>
                </h1>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent blur-sm opacity-50 -z-10">
                  {getString('hero.expertise.title')}
                </div>
              </div>
              <div className="relative bg-black/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 max-w-3xl mx-auto">
                <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed font-medium tracking-wide">
                  {getString('hero.expertise.subtitle')}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 md:pt-6">
              <Link href="/categories">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-white to-white/95 hover:from-white/95 hover:to-white text-stone-900 px-12 py-4 md:px-14 md:py-5 text-base md:text-lg font-bold tracking-[2px] md:tracking-[3px] transition-all duration-500 hover:shadow-2xl hover:scale-105 uppercase border-none rounded-full"
                >
                  {getString('hero.expertise.cta')}
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-8 md:pt-12 border-t border-white/30">
              <div className="text-center space-y-3 md:space-y-4 group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-xs md:text-sm font-bold text-white tracking-wider uppercase">
                  {getString('hero.features.quality.title')}
                </p>
                <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">
                  {getString('hero.features.quality.description')}
                </p>
              </div>
              <div className="text-center space-y-3 md:space-y-4 group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                  <Award className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-xs md:text-sm font-bold text-white tracking-wider uppercase">
                  {getString('hero.features.design.title')}
                </p>
                <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">
                  {getString('hero.features.design.description')}
                </p>
              </div>
              <div className="text-center space-y-3 md:space-y-4 group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                  <Truck className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-xs md:text-sm font-bold text-white tracking-wider uppercase">
                  {getString('hero.trust.delivery')}
                </p>
                <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">
                  {getString('hero.features.innovation.description')}
                </p>
              </div>
              <div className="text-center space-y-3 md:space-y-4 group">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                  <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-xs md:text-sm font-bold text-white tracking-wider uppercase">
                  {getString('hero.trust.guarantee')}
                </p>
                <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">
                  {getString('hero.features.innovation.title')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 mb-4 tracking-wide">
              {getString('homepage.hero.featured.title')}
            </h2>
            <p className="text-lg text-stone-600 font-light max-w-2xl mx-auto">
              {getString('homepage.hero.featured.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.slice(0, 4).map((product, index) => (
                <div key={product.slug} className="group">
                  <div className="bg-white border border-stone-200/50 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={product.imagePaths?.[0] || '/placeholder-product.jpg'}
                        alt={product.title || 'Product'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-light text-stone-900 text-sm mb-2 tracking-wide">
                        {product.title}
                      </h3>
                      <p className="text-lg font-medium text-stone-900">
                        {formatCurrency(product.basePrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-stone-500">{getString('homepage.hero.featured.loading')}</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/categories">
              <Button 
                variant="outline" 
                className="border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white px-8 py-3 text-sm font-medium tracking-wide transition-all duration-300"
              >
{getString('homepage.hero.featured.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>



      {/* Featured Categories Section */}
      <FeaturedCategories categories={categories} />

      {/* Featured Products Section */}
      <FeaturedProducts products={products} onAddToCart={handleBuyOnAmazon} />

      {/* About Section */}
      <AboutSection />

      {/* Reviews Section */}
      <Reviews limit={6} showTitle={true} />

      {/* Why Choose Us Section */}
      <WhyChooseUs />
      
    </Layout>
  );
};

export default HomeClient; 