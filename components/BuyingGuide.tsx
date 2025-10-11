'use client';

import React from 'react';
import { CheckCircle, Lightbulb, Target, Shield, TrendingUp } from 'lucide-react';
import { getString } from '../lib/utils';

interface BuyingGuideSection {
  heading: string;
  content: string;
}

interface BuyingGuideProps {
  title: string;
  sections: BuyingGuideSection[];
}

const BuyingGuide: React.FC<BuyingGuideProps> = ({ title, sections }) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  const getIcon = (index: number) => {
    const icons = [CheckCircle, Lightbulb, Target, Shield, TrendingUp];
    return icons[index % icons.length];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
        <h2 className="text-2xl font-bold text-white text-center">
          {title}
        </h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-8">
          {sections.map((section, index) => {
            const IconComponent = getIcon(index);
            
            return (
              <div key={index} className="flex items-start space-x-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {section.heading}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Lightbulb className="w-4 h-4" />
          <span>{getString('buyingGuide.footer')}</span>
        </div>
      </div>
    </div>
  );
};

export default BuyingGuide;
