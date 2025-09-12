'use client';

import React, { useState } from 'react';
import { X, Gift, Clock } from 'lucide-react';
import { cn, getString } from '../lib/utils';

interface BannerProps {
  message?: string;
  type?: 'discount' | 'shipping' | 'announcement';
  dismissible?: boolean;
  urgency?: boolean;
  className?: string;
}

const Banner: React.FC<BannerProps> = ({
  message = getString('promotions.discountBanner'),
  type = 'discount',
  dismissible = true,
  urgency = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const getBannerStyles = () => {
    switch (type) {
      case 'discount':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'shipping':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'announcement':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'discount':
        return <Gift className="w-4 h-4" />;
      case 'shipping':
        return <Clock className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn(
      'relative py-3 px-4 text-center text-sm font-medium',
      getBannerStyles(),
      urgency && 'animate-pulse-slow',
      className
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        {getIcon()}
        <span>{message}</span>
        {urgency && (
          <span className="ml-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
            {getString('promotions.limitedOffer')}
          </span>
        )}
      </div>
      
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Fermer la bannière"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Banner; 