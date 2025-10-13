'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { getString } from '../lib/utils';

const EmergencyBanner: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.seconds > 0) {
          return { ...prevTime, seconds: prevTime.seconds - 1 };
        } else if (prevTime.minutes > 0) {
          return { ...prevTime, minutes: prevTime.minutes - 1, seconds: 59 };
        } else if (prevTime.hours > 0) {
          return { hours: prevTime.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 24 hours when countdown reaches 0
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-2 sm:py-3 px-3 sm:px-4 sticky top-0 z-40 shadow-lg animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-center space-x-4">
          {/* Emergency Icon */}
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300 animate-bounce" />
            <span className="font-bold text-lg">{getString('banner.emergencyDiscount')}</span>
          </div>
          
          {/* Separator */}
          <div className="text-white/60">•</div>
          
          {/* Countdown Timer */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{getString('banner.timeLeft')}:</span>
            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="font-bold text-lg">
                {timeLeft.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-xs">{getString('banner.hours')}</span>
              <span className="text-white/60">:</span>
              <span className="font-bold text-lg">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-xs">{getString('banner.minutes')}</span>
              <span className="text-white/60">:</span>
              <span className="font-bold text-lg">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-xs">{getString('banner.seconds')}</span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span className="font-bold text-sm">{getString('banner.emergencyDiscount')}</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">{getString('banner.timeLeft')}:</span>
            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="font-bold text-sm">
                {timeLeft.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-xs">{getString('banner.hours')}</span>
              <span className="text-white/60">:</span>
              <span className="font-bold text-sm">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-xs">{getString('banner.minutes')}</span>
              <span className="text-white/60">:</span>
              <span className="font-bold text-sm">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </span>
              <span className="text-xs">{getString('banner.seconds')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;
