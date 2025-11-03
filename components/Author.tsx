'use client';

import React from 'react';
import Image from 'next/image';
import { getString } from '../lib/utils';
import { getAuthor } from '../lib/getAuthor';

interface AuthorProps {
  productCategory: string;
  publishedDate?: string;
  updatedDate?: string;
}

const Author: React.FC<AuthorProps> = ({ productCategory, publishedDate, updatedDate }) => {
  const displayAuthor = getAuthor();

  // Use provided dates or fallback to dates from getAuthor()
  const finalPublishedDate = publishedDate || displayAuthor.publishedDate;
  const finalUpdatedDate = updatedDate || displayAuthor.updatedDate;

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formattedPublishedDate = formatDate(finalPublishedDate);
  const formattedUpdatedDate = formatDate(finalUpdatedDate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
            <Image
              src="/author.png"
              alt={`${displayAuthor.name} - ${displayAuthor.title}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a placeholder if author image doesn't exist
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Ccircle cx="256" cy="256" r="256" fill="%23e5e7eb"/%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {/* Name and Title */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {displayAuthor.name}
              </h3>
              <p className="text-sm font-medium text-green-600">
                {displayAuthor.title}
              </p>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {displayAuthor.bio}
            </p>

            {/* Expertise and Experience */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {displayAuthor.expertise}
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                {displayAuthor.experience}
              </span>
            </div>

            {/* Dates */}
            {(formattedPublishedDate || formattedUpdatedDate) && (
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                {formattedPublishedDate && (
                  <span>Gepubliceerd op {formattedPublishedDate}</span>
                )}
                {formattedPublishedDate && formattedUpdatedDate && (
                  <span> • </span>
                )}
                {formattedUpdatedDate && (
                  <span>Bijgewerkt op {formattedUpdatedDate}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Author;
