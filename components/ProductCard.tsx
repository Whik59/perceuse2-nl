'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../lib/types';
import { Button } from './ui/Button';
import { cn, formatCurrency, getString, slugToReadableTitle } from '../lib/utils';
import ReviewSnippet from './ReviewSnippet';

interface ProductCardProps {
  product: Product;
  className?: string;
  onAddToCart?: (product: Product) => Promise<void> | void;
  isLoading?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  onAddToCart,
  isLoading: externalLoading = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handle product name fallback for JSON structure compatibility
  const productData = product as Product & { 
    productNameCanonical?: string; 
    shortDescription?: string; 
  };
  const productName = slugToReadableTitle(product.slug) || product.title || productData.productNameCanonical || 'Product';
  const productDescription = product.shortDescription || productData.shortDescription || '';

  const handleBuyOnAmazon = () => {
    if (product.amazonUrl) {
      window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isButtonLoading = isLoading || externalLoading;

  return (
    <div className={cn(
      "group relative bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/60 overflow-hidden hover:border-gray-300/60 hover:-translate-y-2",
      className
    )}>

      {/* Product Image */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-square rounded-t-2xl bg-white flex items-center justify-center p-3">
        <Image
          src={product.imagePaths[0]}
          alt={productName}
          width={300}
          height={300}
          loading="lazy"
          className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-2xl border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <span className="text-gray-800 font-semibold text-sm tracking-wide">{getString('product.quickPreview')}</span>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Product Title - Amazon Theme */}
        <Link href={`/product/${product.slug}`} className="block group">
          <h3 className="font-bold text-orange-600 text-sm leading-tight line-clamp-2 min-h-[2rem] hover:text-orange-700 transition-colors duration-200 group-hover:underline">
            {productName}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <ReviewSnippet 
            productSlug={product.slug}
            productTitle={productName}
            size="xs"
          />
        </div>

        {/* Amazon CTA Section */}
        {onAddToCart && (
          <a
            href={product.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
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
        )}
      </div>
    </div>
  );
};

export default ProductCard; 