'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../lib/types';
import { Button } from './ui/Button';
import { cn, formatCurrency, getString } from '../lib/utils';
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
  const productName = product.title || productData.productNameCanonical || 'Product';
  const productDescription = product.shortDescription || productData.shortDescription || '';

  const handleAddToCart = async () => {
    if (!onAddToCart) return;
    
    setIsLoading(true);
    try {
      await onAddToCart(product);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonLoading = isLoading || externalLoading;
  const hasDiscount = product.onSale && product.compareAtPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className={cn(
      "group relative bg-gradient-to-br from-white via-slate-50/30 to-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/60 overflow-hidden hover:border-slate-300/60 hover:-translate-y-2",
      className
    )}>
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl backdrop-blur-sm border border-white/10">
            -{discountPercentage}%
          </span>
        </div>
      )}

      {/* Product Image */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-square rounded-t-2xl bg-white flex items-center justify-center p-4">
        <Image
          src={product.imagePaths[0]}
          alt={productName}
          width={300}
          height={300}
          className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-2xl border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <span className="text-slate-800 font-semibold text-sm tracking-wide">{getString('product.quickPreview')}</span>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5 space-y-4">
        {/* Product Title */}
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-2 min-h-[3rem] hover:text-slate-700 transition-colors tracking-wide">
            {productName}
          </h3>
        </Link>

        {/* Description */}
        {productDescription && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 font-light">
            {productDescription}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center justify-between">
          <ReviewSnippet 
            productSlug={product.slug}
            productTitle={productName}
            size="sm"
          />
        </div>

        {/* Price and Add to Cart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-slate-900 tracking-wide">
                  {formatCurrency(product.basePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through font-medium">
                    {formatCurrency(product.compareAtPrice!)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                  {getString('product.saveAmount').replace('{amount}', formatCurrency(product.compareAtPrice! - product.basePrice))}
                </span>
              )}
            </div>
          </div>

                     {/* Add to Cart Button */}
           {onAddToCart && (
             <Button
               onClick={handleAddToCart}
               loading={isButtonLoading}
               className="w-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 hover:from-slate-900 hover:via-slate-800 hover:to-slate-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-xl tracking-wide"
             >
               {getString('cart.addToCart')}
             </Button>
           )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 