'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Tag, Star, ArrowRight, Filter } from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import { getString } from '../../../lib/utils';
import { Product, Category } from '../../../lib/types';

interface SearchResult {
  categories: Category[];
  products: Product[];
  suggestions: string[];
}

const SearchContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResult>({
    categories: [],
    products: [],
    suggestions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'categories'>('all');

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${activeTab}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={getString('header.search.placeholder')}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg"
                  />
                </div>
              </form>
              
              {/* Search Suggestions */}
              {results.suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">{getString('search.suggestions')}</p>
                  <div className="flex flex-wrap gap-2">
                    {results.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getString('search.all')} ({results.categories.length + results.products.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getString('search.products')} ({results.products.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getString('search.categories')} ({results.categories.length})
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">{getString('search.searching')}</p>
            </div>
          ) : (
            <>
              {/* Categories Results */}
              {(activeTab === 'all' || activeTab === 'categories') && results.categories.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Tag className="w-6 h-6 mr-2 text-orange-600" />
                    {getString('search.categories')} ({results.categories.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.categories.map((category) => (
                      <Link
                        key={category.categoryId}
                        href={`/category/${category.slug}`}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Results */}
              {(activeTab === 'all' || activeTab === 'products') && results.products.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Package className="w-6 h-6 mr-2 text-green-600" />
                    {getString('search.products')} ({results.products.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.products.map((product) => (
                      <Link
                        key={product.productId}
                        href={`/product/${product.slug}`}
                        className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group overflow-hidden"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <Image
                            src={product.imagePaths[0] || '/placeholder.jpg'}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
                            {product.title}
                          </h3>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.basePrice)}
                            </span>
                            {renderStars(product.reviews.averageRating)}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.shortDescription}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.categories.length === 0 && results.products.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {getString('search.noResultsFound')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {getString('search.tryOtherKeywords')}
                  </p>
                  <Link
                    href="/categories"
                    className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Tag className="w-5 h-5 mr-2" />
                    {getString('search.viewAllCategories')}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

const SearchPage: React.FC = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">{getString('search.loading')}</p>
            </div>
          </div>
        </div>
      </Layout>
    }>
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;
