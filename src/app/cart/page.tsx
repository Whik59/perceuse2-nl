'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../../components/layout/Layout';
import { Button } from '../../../components/ui/Button';
import Author from '../../../components/Author';
import { CartState, Category } from '../../../lib/types';
import { 
  updateCartItemQuantity, 
  removeFromCart, 
  calculateCartTotals,
  clearCart,
  redirectToAmazonCart
} from '../../../lib/cart';
import { getString, formatCurrency } from '../../../lib/utils';
import { getAuthor } from '../../../lib/getAuthor';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight,
  ExternalLink,
  Gift
} from 'lucide-react';

const CartPage: React.FC = () => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [author, setAuthor] = useState(getAuthor());

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          const recalculatedCart = calculateCartTotals(parsedCart);
          setCart(recalculatedCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    const loadCategories = async () => {
      try {
        const categoriesData = await import('../../../data/categories.json');
        setCategories(categoriesData.default);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCart();
    loadCategories();
  }, []);

  const saveCart = (newCart: CartState) => {
    setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Dispatch cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleQuantityChange = (productId: number, newQuantity: number, selectedVariation?: Record<string, string>) => {
    const updatedCart = updateCartItemQuantity(cart, productId, newQuantity, selectedVariation);
    saveCart(updatedCart);
  };

  const handleRemoveItem = (productId: number, selectedVariation?: Record<string, string>) => {
    const updatedCart = removeFromCart(cart, productId, selectedVariation);
    saveCart(updatedCart);
  };

  const handleClearCart = () => {
    const clearedCart = clearCart();
    saveCart(clearedCart);
  };

  const handleBuyOnAmazon = () => {
    redirectToAmazonCart(cart);
  };

  if (!cart || cart.items.length === 0) {
  return (
      <Layout categories={categories}>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-8" />
              <h1 className="text-3xl font-light text-gray-900 mb-4">{getString('cart.empty.title')}</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {getString('cart.empty.description')}
              </p>
              <Link href="/">
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                  {getString('cart.empty.button')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout categories={categories}>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 mb-2">{getString('cart.pageTitle')}</h1>
            <p className="text-gray-600">{getString('cart.pageSubtitle')}</p>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="space-y-8">
              {cart.items.map((item) => (
                    <div key={`${item.productId}-${JSON.stringify(item.selectedVariation || {})}`} 
                         className="flex items-center space-x-6 pb-8 border-b border-gray-100 last:border-b-0">
                      
                      {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Image
                          src={item.imagePath}
                        alt={item.title}
                        width={120}
                        height={120}
                          className="rounded-xl object-cover"
                      />
                    </div>
                    
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                              {item.title}
                          </h3>
                          
                        {item.selectedVariation && (
                          <div className="flex flex-wrap gap-2 mb-3">
                              {Object.entries(item.selectedVariation).map(([key, value]) => (
                              <span key={key} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-semibold text-gray-900">
                              {formatCurrency(item.price)}
                            </span>
                            {item.compareAtPrice && item.compareAtPrice > item.price && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(item.compareAtPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.selectedVariation)}
                              className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 font-medium">{item.quantity}</span>
                        <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.selectedVariation)}
                              className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
                        >
                              <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.selectedVariation)}
                            className="text-red-500 hover:text-red-700 p-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <a
                            href={item.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 p-2 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                      <button
                    onClick={handleClearCart}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                    {getString('cart.clearCart')}
                      </button>
                </div>
                    </div>
                  </div>
                  
            {/* Summary Sidebar */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{getString('cart.summary')}</h2>
                
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                    <span className="text-gray-600">{getString('cart.subtotal')} ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} {getString('cart.items')})</span>
                    <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{getString('cart.total')}</span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {getString('cart.amazonNotice')}
                  </p>
                  </div>

                {/* Amazon Notice */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">{getString('cart.amazonPartner')}</span>
                  </div>
                  <p className="text-xs text-orange-700">
                    {getString('cart.amazonPartnerText')}
                  </p>
                </div>

                {/* Buy on Amazon Button */}
                  <Button 
                  onClick={handleBuyOnAmazon}
                    size="lg" 
                  className="w-full bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center space-x-2 mb-4"
                  >
                  <span>{getString('cart.buyOnAmazon')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                <div className="mt-4">
                  <Link href="/">
                    <Button variant="outline" size="lg" className="w-full">
                      {getString('cart.continueShopping')}
                    </Button>
                  </Link>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Author Section */}
          <div className="mt-16 bg-slate-50 py-16 border-t border-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Author 
                author={author}
                productCategory="boormachines"
              />
            </div>
          </div>
      </div>
    </Layout>
  );
};

export default CartPage; 