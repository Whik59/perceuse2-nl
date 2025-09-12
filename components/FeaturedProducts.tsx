'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '../lib/types';
import { getString } from '../lib/utils';
import ProductCard from './ProductCard';
import { ArrowRight } from 'lucide-react';

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart?: (product: Product) => Promise<void> | void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, onAddToCart }) => {
  // Take the first 4 products as featured (in a real app, these would be marked as featured)
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 tracking-tight">
            {getString('homepage.featured.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {getString('homepage.featured.subtitle')}
          </p>
        </div>

        {/* Products Grid */}
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {featuredProducts.map((product) => (
              <div key={product.slug} className="group">
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <p className="text-lg text-gray-600 mb-8">
              {getString('homepage.featured.noProducts')}
            </p>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link 
            href="/categories" 
            className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            {getString('homepage.featured.viewAll')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts; 