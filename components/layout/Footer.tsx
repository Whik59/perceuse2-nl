'use client';

import React from 'react';
import Link from 'next/link';
import { getString } from '../../lib/utils';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#232F3E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-white">{getString('common.companyName')}</h3>
            <p className="text-[#DDD6C1] text-sm mb-6 max-w-2xl mx-auto">
              Spezialisten für hochwertige Massagegeräte. Präzise Entspannung und Experten-Support.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#37475A] pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0">
            <div className="text-[#DDD6C1] text-sm text-center">
              © {new Date().getFullYear()} Massagegeräte. Alle Rechte vorbehalten.
            </div>
          </div>
          
          {/* Affiliate Disclaimer */}
          <div className="mt-6 pt-6 border-t border-[#37475A]">
            <div className="text-[#DDD6C1] text-xs text-center leading-relaxed max-w-4xl mx-auto">
              Als Amazon-Partner verdienen wir an qualifizierten Verkäufen. Diese Website ist Teilnehmer des Amazon-Partnerprogramms, einem Affiliate-Werbeprogramm, das Websites die Möglichkeit bietet, durch die Bewerbung und Verlinkung zu Amazon.de Werbekostenerstattung zu verdienen.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 