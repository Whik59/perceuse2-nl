'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/Button';
import { CartState } from '../lib/types';
import { 
  updateCartItemQuantity, 
  removeFromCart, 
  calculateCartTotals,
  redirectToAmazonCart
} from '../lib/cart';
import { formatCurrency, getString } from '../lib/utils';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

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

  const saveCart = (newCart: CartState) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
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

  const handleBuyOnAmazon = () => {
    redirectToAmazonCart(cart);
    onClose();
  };

  const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Ma sélection ({cartItemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {cart.items.length === 0 ? (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Votre sélection est vide</h3>
              <p className="text-gray-600 mb-6">Ajoutez des friteuses à votre sélection</p>
              <Button onClick={onClose} className="bg-gray-900 text-white hover:bg-gray-800">
                Découvrir nos friteuses
              </Button>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${JSON.stringify(item.selectedVariation || {})}`} 
                         className="flex items-start space-x-4">
                      
                      <div className="flex-shrink-0">
                        <Image
                          src={item.imagePath}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        {item.selectedVariation && (
                          <div className="mt-1 text-xs text-gray-600">
                            {Object.entries(item.selectedVariation).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.price)}
                            </span>
                            {item.compareAtPrice && item.compareAtPrice > item.price && (
                              <span className="text-xs text-gray-500 line-through">
                                {formatCurrency(item.compareAtPrice)}
                              </span>
                            )}
                          </div>

                          <a
                            href={item.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 p-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.selectedVariation)}
                              className="p-1 hover:bg-gray-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 py-1 text-sm">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.selectedVariation)}
                              className="p-1 hover:bg-gray-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.productId, item.selectedVariation)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total estimé</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700">
                    Prix final et frais de livraison sur Amazon
                  </p>
                </div>

                <Button
                  onClick={handleBuyOnAmazon}
                  className="w-full bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center space-x-2"
                >
                  <span>Acheter sur Amazon</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Link href="/cart" onClick={onClose}>
                  <Button variant="outline" className="w-full">
                    Voir ma sélection complète
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer; 