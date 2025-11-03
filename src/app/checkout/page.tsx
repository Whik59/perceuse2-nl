'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import { Button } from '../../../components/ui/Button';
import Author from '../../../components/Author';
import { CartState, Category } from '../../../lib/types';
import { redirectToAmazonCart, calculateCartTotals } from '../../../lib/cart';
import { formatCurrency, getString } from '../../../lib/utils';
import { getAuthor } from '../../../lib/getAuthor';
import { 
  ExternalLink,
  ShoppingBag,
  ArrowLeft,
  Shield,
  Truck,
  CreditCard
} from 'lucide-react';

const CheckoutPage: React.FC = () => {
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

  const handleRedirectToAmazon = () => {
    redirectToAmazonCart(cart);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <Layout categories={categories}>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-8" />
              <h1 className="text-3xl font-light text-gray-900 mb-4">{getString('checkout.empty.title')}</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {getString('checkout.empty.description')}
              </p>
              <Link href="/">
                <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                  {getString('checkout.empty.button')}
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="mb-8">
            <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {getString('checkout.backToCart')}
                </Link>
            <h1 className="text-3xl font-light text-gray-900">{getString('checkout.pageTitle')}</h1>
            <p className="text-gray-600 mt-2">{getString('checkout.pageSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column - Amazon Information */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <ExternalLink className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{getString('checkout.securePurchase.title')}</h2>
                    <p className="text-gray-600">{getString('checkout.securePurchase.subtitle')}</p>
                  </div>
                  </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{getString('checkout.benefits.securePayment')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{getString('checkout.benefits.fastShipping')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{getString('checkout.benefits.allPayments')}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">{getString('checkout.amazonGuarantee.title')}</h3>
                  <p className="text-sm text-blue-700">
                    {getString('checkout.amazonGuarantee.description')}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-medium text-orange-800 mb-2">{getString('checkout.partnerInfo.title')}</h3>
                <p className="text-sm text-orange-700">
                  {getString('checkout.partnerInfo.description')}
                </p>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{getString('checkout.orderSummary.title')}</h2>
                
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${JSON.stringify(item.selectedVariation || {})}`} 
                         className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">{getString('checkout.orderSummary.quantity')}: {item.quantity}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{getString('checkout.orderSummary.subtotal')}</span>
                    <span className="font-semibold">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{getString('checkout.orderSummary.shipping')}</span>
                    <span>{getString('checkout.orderSummary.shippingNote')}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>{getString('checkout.orderSummary.total')}</span>
                      <span>{formatCurrency(cart.subtotal)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{getString('checkout.orderSummary.finalPrice')}</p>
                  </div>
                </div>

                <Button
                  onClick={handleRedirectToAmazon}
                  className="w-full mt-6 bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center space-x-2"
                  size="lg"
                >
                  <span>{getString('checkout.buttons.continueToAmazon')}</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <div className="mt-4 text-center">
                  <Link href="/cart">
                    <Button variant="outline" className="w-full">
                      {getString('checkout.buttons.modifySelection')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Author Section */}
          <div className="mt-16 bg-slate-50 py-16 border-t border-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Author 
                productCategory={getString('common.defaultProductCategory')}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage; 