'use client';

import React from 'react';
import Link from 'next/link';
import { getString } from '../../lib/utils';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#232F3E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Affiliate Disclaimer */}
        <div className="text-center">
          <div className="text-[#DDD6C1] text-xs leading-relaxed max-w-4xl mx-auto">
            {getString('footer.affiliateDisclaimer')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 