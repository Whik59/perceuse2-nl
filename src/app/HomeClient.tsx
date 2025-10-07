'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import FeaturedCategories from '../../components/FeaturedCategories';
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
      {/* Clean Hero Section - Mobile Phones for Seniors */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            
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
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-4xl mx-auto">
                {getString('hero.expertise.subtitle')}
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link href="/categories">
                <Button 
                  size="lg" 
                  className="bg-white hover:bg-white/90 text-blue-700 px-12 py-4 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {getString('hero.expertise.cta')}
                </Button>
              </Link>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-12 border-t border-white/20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold">{getString('hero.features.quality.title')}</h3>
                <p className="text-white/80 text-sm">{getString('hero.features.quality.description')}</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold">{getString('hero.features.design.title')}</h3>
                <p className="text-white/80 text-sm">{getString('hero.features.design.description')}</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold">{getString('hero.trust.delivery')}</h3>
                <p className="text-white/80 text-sm">{getString('hero.features.innovation.description')}</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold">{getString('hero.trust.guarantee')}</h3>
                <p className="text-white/80 text-sm">{getString('hero.features.innovation.title')}</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products && products.length > 0 ? (
              products.slice(0, 4).map((product, index) => (
                <Link key={product.slug} href={`/product/${product.slug}`}>
                  <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-square bg-white flex items-center justify-center p-4">
                      <Image
                        src={product.imagePaths?.[0] || '/placeholder-product.jpg'}
                        alt={product.title || 'Product'}
                        width={200}
                        height={200}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 text-lg mb-3 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(product.basePrice)}
                      </p>
                      <Link 
                        href={`/product/${product.slug}`}
                        className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-center transition-colors duration-200"
                      >
                        Ver
                      </Link>
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300"
              >
                {getString('homepage.hero.featured.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top 5 Categories Section */}
      <FeaturedCategories categories={categories} />

      {/* Reviews Section */}
      <Reviews limit={6} />
      
    </Layout>
  );
};

export default HomeClient; 