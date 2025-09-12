'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Shield, Truck, RefreshCw, Lock, CheckCircle } from 'lucide-react';
import { getString } from '../../lib/utils';
import { siteConfig, getDynamicString } from '../../lib/config';

// Get site name from environment with fallback
const getSiteName = () => {
  return process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || siteConfig.siteName;
};

const Footer: React.FC = () => {
  const siteName = getSiteName();
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* Premium Trust Signals */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="font-medium text-lg text-white mb-2">{getString('footer.trustSignals.freeShipping')}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{getString('footer.trustSignals.freeShippingDesc')}</p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="font-medium text-lg text-white mb-2">{getString('footer.trustSignals.easyReturns')}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{getString('footer.trustSignals.easyReturnsDesc')}</p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="font-medium text-lg text-white mb-2">{getString('footer.trustSignals.securePayment')}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{getString('footer.trustSignals.securePaymentDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-lg">{siteName.charAt(0)}</span>
                </div>
                <div>
                  <span className="font-bold text-2xl text-white">{siteName}</span>
                  <div className="text-gray-400 text-sm -mt-1">Premium</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                {getString('footer.brand.description')}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">{siteConfig.business.address}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">{siteConfig.business.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">{siteConfig.business.email}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-6">
            <h3 className="font-medium text-lg text-white">{getString('footer.navigation.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/categories" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.navigation.products')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.navigation.about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.navigation.contact')}
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.navigation.reviews')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h3 className="font-medium text-lg text-white">{getString('footer.legal.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-gray-400 hover:text-white transition-colors duration-200">
                  {getString('footer.legal.legalNotices')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-400">
              <span>{getDynamicString(getString('footer.bottom.copyright'))}</span>
            </div>
            
            {/* Payment Methods */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-gray-300">{getString('footer.bottom.securePayment')}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Image
                  src="/payments/visa-svgrepo-com.svg"
                  alt="Visa"
                  width={32}
                  height={20}
                  className="h-5 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/payments/mastercard-full-svgrepo-com.svg"
                  alt="Mastercard"
                  width={32}
                  height={20}
                  className="h-5 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/payments/paypal-svgrepo-com.svg"
                  alt="PayPal"
                  width={32}
                  height={20}
                  className="h-5 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/payments/apple-pay-svgrepo-com.svg"
                  alt="Apple Pay"
                  width={32}
                  height={20}
                  className="h-5 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/payments/google-pay-svgrepo-com.svg"
                  alt="Google Pay"
                  width={32}
                  height={20}
                  className="h-5 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
            
            {/* Security Badges */}
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>{getString('footer.bottom.encryption')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>{getString('footer.bottom.dataProtected')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 