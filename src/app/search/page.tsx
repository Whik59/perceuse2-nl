'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Tag, Star, ArrowRight, Filter } from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import ProductCard from '../../../components/ProductCard';
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
  const [categoryImages, setCategoryImages] = useState<Record<number, string>>({});

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const loadCategoryImages = async (categories: Category[]) => {
    const images: Record<number, string> = {};
    
    for (const category of categories) {
      if (!category.categoryId) continue;
      
      try {
        const response = await fetch(`/api/products/by-category/${category.categoryId}`);
        if (response.ok) {
          const products = await response.json();
          if (products.length > 0 && products[0].imagePaths?.length > 0) {
            images[category.categoryId] = products[0].imagePaths[0];
          }
        }
      } catch (error) {
        console.error(`Error loading products for category ${category.categoryId}:`, error);
      }
    }
    
    setCategoryImages(images);
  };

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${activeTab}`);
      const data = await response.json();
      setResults(data);
      
      // Load category images if there are categories
      if (data.categories && data.categories.length > 0) {
        await loadCategoryImages(data.categories);
      }
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {results.categories.map((category) => (
                      <Link key={category.slug} href={`/category/${category.slug}`}>
                        <div className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                          {/* Amazon-style subtle background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 via-transparent to-orange-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="text-center space-y-3 relative z-10">
                            {/* Amazon-style Image Frame */}
                            <div className="relative mx-auto w-24 h-24">
                              <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ring-2 ring-orange-100 group-hover:ring-orange-300 bg-white">
                                {category.categoryId && categoryImages[category.categoryId] ? (
                                  <Image
                                    src={categoryImages[category.categoryId]}
                                    alt={category.name || 'Category image'}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                                      <g fill="currentColor" fillRule="evenodd">
                                        <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fillRule="nonzero"/>
                                        <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095"/>
                                      </g>
                                    </svg>
                                  </div>
                                )}
                              </div>
                          </div>
                            
                            {/* Category Name */}
                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors text-sm leading-tight">
                              {category.name}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {category.description}
                            </p>
                          </div>
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
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {results.products.map((product) => (
                      <ProductCard
                        key={product.productId}
                        product={product}
                        onAddToCart={() => {
                          // Redirect to Amazon for the specific product
                          window.open(product.amazonUrl, '_blank');
                        }}
                      />
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
                    href="/"
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
