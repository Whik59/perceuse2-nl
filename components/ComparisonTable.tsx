'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Award } from 'lucide-react';

interface ComparisonProduct {
  rank: number;
  name: string;
  price: string;
  rating: string;
  productUrl?: string;
  amazonUrl?: string; // Keep for backward compatibility
  image: string;
  // Flexible field mapping - can contain any field names
  [key: string]: any;
}

interface ComparisonTableProps {
  title: string;
  columns: string[];
  products: ComparisonProduct[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ title, columns, products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  // Limit to maximum 5 products to avoid inventing non-existent products
  const limitedProducts = products.slice(0, 5);

  const renderCellContent = (product: ComparisonProduct, column: string, index: number) => {
    // Debug: Log available fields for troubleshooting
    if (column.toLowerCase() === 'modèle') {
      console.log('Available product fields:', Object.keys(product));
    }
    // Handle special cases first
    if (column.toLowerCase() === 'modèle') {
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Award className={`w-6 h-6 text-yellow-500 ${product.image ? 'hidden' : ''}`} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {product.name}
            </h3>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500">#{product.rank || index + 1}</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (column.toLowerCase().includes('prix')) {
      // Clean the price to remove any existing € symbols and format properly
      const cleanPrice = product.price?.toString().replace(/[€,]/g, '').trim() || '0';
      const formattedPrice = parseFloat(cleanPrice).toFixed(2);
      return (
        <span className="text-lg font-bold text-green-600">
          {formattedPrice}€
        </span>
      );
    }
    
    if (column.toLowerCase().includes('note')) {
      return (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-semibold text-gray-900">
            {product.rating}
          </span>
        </div>
      );
    }
    
    // For all other columns, try to find the matching field in the product data
    // First try exact column name match
    let fieldValue = product[column];
    
    // If not found, try common field mappings
    if (!fieldValue) {
      const columnLower = column.toLowerCase();
      
      // Map common column names to possible field names
      const fieldMappings: { [key: string]: string[] } = {
        'puissance': ['power', 'puissanceAspiration', 'puissance', 'aspiration', 'puissance_aspiration'],
        'autonomie': ['autonomy', 'autonomieEstimée', 'autonomie', 'batterie', 'autonomie_max'],
        'navigation': ['navigation', 'navigationEvitement', 'nav', 'système', 'systeme_navigation'],
        'connectivité': ['connectivity', 'controleConnectivite', 'connectivité', 'app'],
        'réservoir': ['tank', 'réservoir', 'reservoir', 'eau'],
        'fonctionnalités': ['keyFeatures', 'fonctionnalitesNettoyage', 'features', 'fonctionnalités', 'fonctionnalites_lavage'],
        'station': ['stationToutEnUn', 'station', 'dock', 'station_tout_en_un'],
        'seuils': ['seuilsFranchissables', 'seuils', 'hauteur'],
        'hauteur': ['hauteur', 'height', 'épaisseur'],
        'lavage': ['lavage', 'fonctionnalites_lavage', 'wash'],
        'système': ['systeme_navigation', 'navigation', 'nav']
      };
      
      // Find matching field
      for (const [key, possibleFields] of Object.entries(fieldMappings)) {
        if (columnLower.includes(key)) {
          for (const field of possibleFields) {
            if (product[field]) {
              fieldValue = product[field];
              break;
            }
          }
          if (fieldValue) break;
        }
      }
    }
    
    // If still not found, try to find any field that contains part of the column name
    if (!fieldValue) {
      const columnWords = column.toLowerCase().split(/[\s\-_]+/);
      for (const [key, value] of Object.entries(product)) {
        if (typeof value === 'string' && value !== 'N/A' && value !== '') {
          const keyWords = key.toLowerCase().split(/[\s\-_]+/);
          // More aggressive matching - check if any column word matches any key word
          if (columnWords.some(word => 
            keyWords.some(kw => 
              kw.includes(word) || word.includes(kw) || 
              kw.startsWith(word) || word.startsWith(kw)
            )
          )) {
            fieldValue = value;
            break;
          }
        }
      }
    }
    
    return (
      <span className="text-sm text-gray-700">
        {fieldValue || 'N/A'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
        <h2 className="text-2xl font-bold text-white text-center">
          {title}
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {limitedProducts.map((product, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  const url = product.productUrl || product.amazonUrl || '#';
                  if (url !== '#') {
                    if (product.amazonUrl) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      window.location.href = url;
                    }
                  }
                }}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-4 whitespace-nowrap">
                    {renderCellContent(product, column, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Vergleich der {limitedProducts.length} besten Produkte basierend auf Spezifikationen und Kundenbewertungen. Klicken Sie auf eine Zeile, um das Produkt zu sehen. Preise können variieren.
        </p>
      </div>
    </div>
  );
};

export default ComparisonTable;
