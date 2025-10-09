'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';

interface InternalLink {
  text: string;
  url: string;
}

interface InternalLinksProps {
  links: InternalLink[];
  title?: string;
}

const InternalLinks: React.FC<InternalLinksProps> = ({ links, title = "Découvrez aussi" }) => {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <LinkIcon className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          {title}
        </h3>
      </div>

      {/* Links */}
      <div className="space-y-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.url}
            className="group flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
              {link.text}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          Explorez nos autres catégories pour trouver exactement ce dont vous avez besoin
        </p>
      </div>
    </div>
  );
};

export default InternalLinks;
