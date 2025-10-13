'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Clock, Star, Truck, CheckCircle, Award } from 'lucide-react';
import { getString } from '../lib/utils';

interface BannerItem {
  id: string;
  icon: React.ReactNode;
  text: string;
  badge?: string;
  color: string;
}

const DynamicBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const bannerItems: BannerItem[] = [
    {
      id: 'amazon-partner',
      icon: (
        <svg className="w-4 h-4" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd">
            <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fill="currentColor" fillRule="nonzero"/>
            <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095" fill="currentColor"/>
          </g>
        </svg>
      ),
      text: getString('banner.amazonPartner'),
      badge: 'VERIFIED',
      color: 'text-orange-400'
    },
    {
      id: 'made-in-germany',
      icon: <img src="/germanlogo.png" alt="Germany" className="w-4 h-4" />,
      text: getString('banner.madeInGermany'),
      badge: 'QUALITY',
      color: 'text-red-500'
    },
    {
      id: 'quality-assured',
      icon: <Award className="w-4 h-4" />,
      text: getString('banner.qualityAssured'),
      badge: 'GUARANTEED',
      color: 'text-green-400'
    },
    {
      id: 'fast-delivery',
      icon: <Truck className="w-4 h-4" />,
      text: getString('banner.fastDelivery'),
      badge: '24H',
      color: 'text-blue-400'
    },
    {
      id: 'secure-payment',
      icon: <Shield className="w-4 h-4" />,
      text: getString('banner.securePayment'),
      badge: 'SSL',
      color: 'text-purple-400'
    },
    {
      id: 'customer-support',
      icon: <CheckCircle className="w-4 h-4" />,
      text: getString('banner.customerSupport'),
      badge: '24/7',
      color: 'text-cyan-400'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerItems.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [bannerItems.length]);

  const currentItem = bannerItems[currentIndex];

  return (
    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white py-3 px-4 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
            <div className={`${currentItem.color} transition-colors duration-500`}>
              {currentItem.icon}
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">{currentItem.text}</span>
              {currentItem.badge && (
                <span className="bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {currentItem.badge}
                </span>
              )}
            </div>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center space-x-1 ml-4">
            {bannerItems.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicBanner;
