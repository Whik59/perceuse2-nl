'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Gift, Clock, Zap, Tag } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../lib/utils';
import { CartItem } from '../lib/types';

interface ExitIntentPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
  cartItems: CartItem[];
  cartTotal: number;
}

const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({
  isVisible,
  onClose,
  onContinueShopping,
  onCheckout,
  cartItems,
  cartTotal
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isAnimating, setIsAnimating] = useState(false);

  // Countdown timer for urgency
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Animation effect
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const discountAmount = Math.min(cartTotal * 0.15, 50); // 15% discount, max 50€
  const finalPrice = cartTotal - discountAmount;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header with close button */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="px-6 pb-6">
          {/* Attention-grabbing header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Zap className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Attendez ! Ne partez pas les mains vides
            </h2>
            <p className="text-gray-600">
              Vous avez {cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier
            </p>
          </div>

          {/* Special offer */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <Tag className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-lg font-bold text-red-600">OFFRE SPÉCIALE LIMITÉE</span>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                15% DE RÉDUCTION
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Économisez {formatCurrency(discountAmount)} sur votre commande
              </div>
              
              {/* Price comparison */}
              <div className="flex items-center justify-center space-x-4 mb-3">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Prix actuel</div>
                  <div className="text-lg font-medium line-through text-gray-500">
                    {formatCurrency(cartTotal)}
                  </div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-sm text-green-600 font-medium">Nouveau prix</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(finalPrice)}
                  </div>
                </div>
              </div>

              {/* Urgency timer */}
              <div className="bg-white border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Cette offre expire dans :</span>
                </div>
                <div className="text-xl font-bold text-red-600">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </div>

          {/* Cart preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Vos articles sélectionnés
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cartItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-gray-200 rounded flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{item.title}</div>
                    <div className="text-gray-500">Qté: {item.quantity}</div>
                  </div>
                  <div className="font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
              {cartItems.length > 3 && (
                <div className="text-sm text-gray-500 text-center pt-2">
                  +{cartItems.length - 3} autre{cartItems.length - 3 > 1 ? 's' : ''} article{cartItems.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center">
              <div className="text-xs text-gray-500">Livraison</div>
              <div className="text-sm font-medium text-green-600">Gratuite</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Retours</div>
              <div className="text-sm font-medium text-green-600">30 jours</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Garantie</div>
              <div className="text-sm font-medium text-green-600">2 ans</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onCheckout}
              className="w-full bg-red-600 text-white hover:bg-red-700 py-4 text-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              <Gift className="w-5 h-5 mr-2" />
              Profiter de l&apos;offre • {formatCurrency(finalPrice)}
            </Button>
            
            <Button
              onClick={onContinueShopping}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
            >
              Continuer mes achats
            </Button>
          </div>

          {/* Additional incentive */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Code promo automatiquement appliqué au checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup; 