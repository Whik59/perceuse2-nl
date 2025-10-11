'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import ProductCard from '../../../../components/ProductCard';
import { Button } from '../../../../components/ui/Button';
import Reviews from '../../../../components/Reviews';
import SubcategoryCards from '../../../../components/SubcategoryCards';
import ComparisonTable from '../../../../components/ComparisonTable';
import BuyingGuide from '../../../../components/BuyingGuide';
import InternalLinks from '../../../../components/InternalLinks';
import SmartLinkedText from '../../../../components/SmartLinkedText';
import { Product, Category, CartState } from '../../../../lib/types';
import { getString, formatCurrency } from '../../../../lib/utils';
import { createCartItem, addToCart } from '../../../../lib/cart';
import { getCategoryContent, CategoryContent } from '../../../../lib/getCategoryContent';
import { 
  Grid3X3, 
  List, 
  Star,
  SlidersHorizontal,
  ChevronRight,
  Package
} from 'lucide-react';

interface FilterState {
  priceRange: [number, number];
  rating: number;
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  inStock: boolean;
}

const CategoryPage: React.FC = () => {
  const params = useParams();
  const slugArray = params?.slug as string[];
  const fullSlug = slugArray ? slugArray.join('/') : '';
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0
  });

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 500],
    rating: 0,
    sortBy: 'newest',
    inStock: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryContent, setCategoryContent] = useState<CategoryContent | null>(null);

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        // Load all categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to load categories');
        }
        const allCategories: Category[] = await categoriesResponse.json();
        setCategories(allCategories);
        
        // Load current category by slug
        const categoryResponse = await fetch(`/api/categories/${fullSlug}`);
        if (!categoryResponse.ok) {
          throw new Error('Category not found');
        }
        const currentCategory: Category = await categoryResponse.json();
        
        setCategory(currentCategory);

        // Load products based on category level
        const categoryIdsToLoad = [currentCategory.categoryId!];
        
        // If current category is a main category (level 0), load products from all its subcategories
        // If current category is a subcategory (level 1), load only its own products
        if (currentCategory.level === 0) {
          // Find all subcategories of the current category
          const subcategories = allCategories.filter(cat => cat.parentCategoryId === currentCategory.categoryId);
          subcategories.forEach(subcat => categoryIdsToLoad.push(subcat.categoryId!));
        }
        // For subcategories (level 1), we only load products from the current category itself
        
        let allProducts: Product[] = [];
        
        // Load products for each category ID
        for (const categoryId of categoryIdsToLoad) {
          try {
            const response = await fetch(`/api/products/by-category/${categoryId}`);
            const categoryProducts: Product[] = await response.json();
            allProducts = [...allProducts, ...categoryProducts];
          } catch (error) {
            console.error(`Error loading products for category ${categoryId}:`, error);
          }
        }
        
        // Remove duplicates (in case a product belongs to multiple categories)
        const uniqueProducts = allProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.productId === product.productId)
        );
        
        setProducts(uniqueProducts);
        setFilteredProducts(uniqueProducts);
        
        // Load category content if available
        try {
          const contentResponse = await fetch(`/api/category-content/${fullSlug}`);
          if (contentResponse.ok) {
            const response = await contentResponse.json();
            if (response.content) {
              setCategoryContent(response.content);
            }
          }
        } catch (error) {
          console.error('Error loading category content:', error);
        }
        
      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (fullSlug) {
      loadCategoryData();
    }
  }, [fullSlug]);

  // Filter products based on current filters
  useEffect(() => {
    let filtered = [...products];

    // Price range filter
    filtered = filtered.filter(product => {
      const price = product.basePrice;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        product.reviews.averageRating >= filters.rating
      );
    }

    // In stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.variations.length > 0);
    }

    // Sort products
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'rating':
        filtered.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  const handleAddToCart = async (product: Product) => {
    try {
      const cartItem = createCartItem(product);
      const updatedCart = addToCart(cart, cartItem);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">{getString('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{getString('categoryPage.notFound.title')}</h1>
            <p className="text-gray-600 mb-8">{getString('categoryPage.notFound.description')}</p>
            <Link href="/">
              <Button variant="primary">
                {getString('navigation.home')}
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout categories={categories}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-white/10 via-slate-50/20 to-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-white/10 mb-6 hover:shadow-2xl transition-all duration-300">
              <span className="text-sm font-bold text-slate-200 tracking-wider uppercase">{category.name}</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-extralight mb-6 tracking-tighter leading-tight">
              <span className="bg-gradient-to-r from-slate-300 via-white to-slate-300 bg-clip-text text-transparent">
                {category.name}
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {getString('navigation.home')}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Comparison Table Section - Top */}
      {categoryContent?.comparisonTable && (
        <div className="py-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getString('categoryPage.comparisonTable.title')}
              </h2>
              <p className="text-gray-600">
                {getString('categoryPage.comparisonTable.incentive')}
              </p>
            </div>
            
            <ComparisonTable
              title={categoryContent.comparisonTable.title}
              columns={categoryContent.comparisonTable.columns}
              products={categoryContent.comparisonTable.products}
            />
          </div>
        </div>
      )}

      {/* Subcategory Cards Section */}
      {category.categoryId && (
        <SubcategoryCards 
          categories={categories} 
          parentCategoryId={category.categoryId}
          title={getString('categoryPage.exploreCategories').replace('{categoryName}', category.name)}
        />
      )}

      {/* Products Section */}
      <div className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and View Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-sm font-medium">{getString('product.filters')}</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} {getString('product.products')}
              </span>
              
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="newest">{getString('product.sort.newest')}</option>
                <option value="price_asc">{getString('product.sort.priceLow')}</option>
                <option value="price_desc">{getString('product.sort.priceHigh')}</option>
                <option value="rating">{getString('product.sort.rating')}</option>
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getString('product.priceRange')}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => handleFilterChange({ 
                        priceRange: [parseInt(e.target.value), filters.priceRange[1]] 
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder={getString('categoryPage.priceRange.min')}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleFilterChange({ 
                        priceRange: [filters.priceRange[0], parseInt(e.target.value)] 
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder={getString('categoryPage.priceRange.max')}
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getString('product.minRating')}
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange({ rating: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value={0}>{getString('product.allRatings')}</option>
                    <option value={4}>{getString('product.4stars')}</option>
                    <option value={3}>{getString('product.3stars')}</option>
                    <option value={2}>{getString('product.2stars')}</option>
                    <option value={1}>{getString('product.1star')}</option>
                  </select>
                </div>

                {/* In Stock Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getString('product.availability')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange({ inStock: e.target.checked })}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="ml-2 text-sm text-gray-700">{getString('product.inStock')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {getString('product.noProducts')}
              </h3>
              <p className="text-gray-600 mb-6">
                {getString('product.noProductsDescription')}
              </p>
              <Link href="/">
                <Button variant="primary">
                  {getString('navigation.home')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>


      {/* Buying Guide Section */}
      {categoryContent?.buyingGuide && (
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <BuyingGuide
              title={categoryContent.buyingGuide.title}
              sections={categoryContent.buyingGuide.sections}
            />
          </div>
        </div>
      )}

      {/* Internal Links Section */}
      {categoryContent?.internalLinks && categoryContent.internalLinks.length > 0 && (
        <div className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <InternalLinks links={categoryContent.internalLinks} />
          </div>
        </div>
      )}

      {/* Category FAQ Section */}
      {category?.faq && category.faq.length > 0 && (
        <div className="bg-white py-16 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-slate-900 mb-4">
                {getString('categoryPage.faq')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-600 mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-8">
              {category.faq.map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    {item.question}
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Content Section (if available) */}
      {categoryContent && (
        <div className="bg-slate-50 py-16 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Content */}
            <article className="prose max-w-none prose-slate prose-lg">
              <SmartLinkedText text={categoryContent.source} as="div" />
            </article>
            
            {/* FAQ Section */}
            {categoryContent.faq && categoryContent.faq.length > 0 && (
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  {getString('support.faq.categoryTitle')}
                </h2>
                <div className="space-y-6">
                  {categoryContent.faq.map((faq, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      

      {/* Customer Reviews */}
      <Reviews limit={6} />
    </Layout>
  );
};

export default CategoryPage;
