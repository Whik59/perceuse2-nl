'use client';

import React from 'react';
import Link from 'next/link';
import { getString } from '../../lib/utils';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#232F3E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Affiliate Disclaimer */}
        <div className="text-center mb-6">
          <div className="text-[#DDD6C1] text-xs leading-relaxed max-w-4xl mx-auto">
            {getString('footer.affiliateDisclaimer')}
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-600 pt-6">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
            <Link 
              href={`/${getString('footer.legal.routes.mentionsLegales')}`}
              className="hover:text-white transition-colors"
            >
              {getString('footer.legal.mentionsLegales')}
            </Link>
            <Link 
              href={`/${getString('footer.legal.routes.politiqueConfidentialite')}`}
              className="hover:text-white transition-colors"
            >
              {getString('footer.legal.politiqueConfidentialite')}
            </Link>
            <Link 
              href={`/${getString('footer.legal.routes.cgu')}`}
              className="hover:text-white transition-colors"
            >
              {getString('footer.legal.cgu')}
            </Link>
            <Link 
              href={`/${getString('footer.legal.routes.cookies')}`}
              className="hover:text-white transition-colors"
            >
              {getString('footer.legal.cookies')}
            </Link>
            <Link 
              href={`/${getString('footer.legal.routes.contact')}`}
              className="hover:text-white transition-colors"
            >
              {getString('footer.legal.contact')}
            </Link>
          </div>
          
          {/* Copyright */}
          <div className="text-center mt-4 text-xs text-gray-400">
            © {new Date().getFullYear()} {getString('common.companyName')}. {getString('footer.legal.allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 