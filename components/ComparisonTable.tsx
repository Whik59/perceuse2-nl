'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Award } from 'lucide-react';
import { getString } from '../lib/utils';

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
    // Handle special cases first
    if (column.toLowerCase() === 'rang') {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {product.rank || product.rang || index + 1}
            </span>
          </div>
          {product.image && (
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      );
    }
    
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
              <span className="text-xs text-gray-500">#{product.rank || product.rang || index + 1}</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (column.toLowerCase().includes('prix')) {
      // Handle different price formats from the data
      let priceValue = product.price || product.prix || '0';
      
      // If it's already formatted with €, use it as is
      if (typeof priceValue === 'string' && priceValue.includes('€')) {
        return (
          <span className="text-lg font-bold text-green-600">
            {priceValue}
          </span>
        );
      }
      
      // Otherwise, clean and format the price
      const cleanPrice = priceValue.toString().replace(/[€,]/g, '').trim() || '0';
      const formattedPrice = parseFloat(cleanPrice).toFixed(2);
      return (
        <span className="text-lg font-bold text-green-600">
          {formattedPrice}€
        </span>
      );
    }
    
    if (column.toLowerCase().includes('note') || column.toLowerCase().includes('évaluation')) {
      const ratingValue = product.rating || product.note || product.évaluation || 'N/A';
      return (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-semibold text-gray-900">
            {ratingValue}
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
        'système': ['systeme_navigation', 'navigation', 'nav'],
        'matériaux': ['materiaux_principaux', 'matériaux', 'materials'],
        'couleur': ['couleur_principale', 'couleur', 'color', 'couleurs'],
        'caractéristiques': ['caracteristique_cle', 'caracteristiques_specifiques', 'caractéristiques', 'features', 'spécifications'],
        'marque': ['marque', 'brand', 'fabricant'],
        'catégorie': ['categorie_de_produit', 'catégorie', 'category'],
        'utilisation': ['utilisation_principale', 'utilisation', 'usage'],
        'évaluation': ['évaluation', 'note', 'rating', 'score']
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
          {getString('comparison.description', { count: limitedProducts.length })}
        </p>
      </div>
    </div>
  );
};

export default ComparisonTable;
