'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import ProductCard from '../../../../components/ProductCard';
import { Button } from '../../../../components/ui/Button';
import Reviews from '../../../../components/Reviews';
import { Product, Category, CartState } from '../../../../lib/types';
import { getString, formatCurrency } from '../../../../lib/utils';
import { createCartItem, addToCart } from '../../../../lib/cart';
import { getCategoryContent, CategoryContent } from '../../../../lib/getCategoryContent';
import { MDXRemote } from 'next-mdx-remote';
import { 
  Grid3X3, 
  List, 
  Star,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface FilterState {
  priceRange: [number, number];
  rating: number;
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  inStock: boolean;
}

const CategoryPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;
  
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
    priceRange: [0, 100],
    rating: 0,
    sortBy: 'newest',
    inStock: false
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryContent, setCategoryContent] = useState<CategoryContent | null>(null);

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        // Load categories to find the current one
        const categoriesResponse = await import('../../../../data/categories.json');
        const allCategories: Category[] = categoriesResponse.default;
        setCategories(allCategories);
        
        const currentCategory = allCategories.find(cat => cat.slug === slug);
        if (!currentCategory) {
          throw new Error('Category not found');
        }
        
        setCategory(currentCategory);

        // Load products from current category AND all its subcategories
        const categoryIdsToLoad = [currentCategory.categoryId];
        
        // Find all subcategories of the current category
        const subcategories = allCategories.filter(cat => cat.parentCategoryId === currentCategory.categoryId);
        subcategories.forEach(subcat => categoryIdsToLoad.push(subcat.categoryId));
        
        // If current category is a subcategory and we want to show only its products
        // we keep only the current category ID - but if it's a parent category,
        // we show products from all subcategories
        
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

        // Load category SEO content if available
        try {
          const content = await getCategoryContent(slug);
          setCategoryContent(content);
        } catch (error) {
          console.error('Error loading category content:', error);
        }

      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...products];

    // Filter by price range
    filtered = filtered.filter(product => 
      product.basePrice >= filters.priceRange[0] && 
      product.basePrice <= filters.priceRange[1]
    );

    // Filter by rating
    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        product.reviews.averageRating >= filters.rating
      );
    }

    // Filter by stock
    // For Amazon affiliate products, all products are considered in stock
    // if (filters.inStock) filter is disabled

    // Sort products
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.basePrice - b.basePrice;
        case 'price_desc':
          return b.basePrice - a.basePrice;
        case 'rating':
          return b.reviews.averageRating - a.reviews.averageRating;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredProducts(filtered);
  }, [products, filters]);

  const handleAddToCart = (product: Product) => {
    const cartItem = createCartItem(product);
    const updatedCart = addToCart(cart, cartItem);
    setCart(updatedCart);
  };

  const handleCartClick = () => {
    window.location.href = '/cart';
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (isLoading) {
    return (
      <Layout
        categories={categories}
        showFloatingButtons={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 aspect-square rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout
        categories={categories}
        showFloatingButtons={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{getString('errors.categoryNotFound')}</h1>
            <Link href="/">
              <Button>{getString('navigation.home')}</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      categories={categories}
      showFloatingButtons={true}
    >
      {/* Breadcrumb */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">{getString('navigation.home')}</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link href="/categories" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">{getString('categories.title')}</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">{category.categoryNameCanonical}</span>
          </div>
        </div>
      </nav>

      {/* Category Header */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* "Découvrez nos" text */}
            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest">
                {getString('categories.discover')}
              </p>
              <h1 className="text-4xl lg:text-5xl font-extralight text-slate-900 capitalize tracking-wide">{category.categoryNameCanonical}</h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">{category.description}</p>
            
            {/* Category Stats */}
            <div className="flex items-center justify-center space-x-6 mt-8">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-sm text-slate-600 font-medium">
                  {products.length} {products.length === 1 ? 'produit' : 'produits'}
                </span>
              </div>
              {categories.filter(cat => cat.parentCategoryId === category.categoryId).length > 0 && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-sm text-slate-600 font-medium">
                      {categories.filter(cat => cat.parentCategoryId === category.categoryId).length} spécialité{categories.filter(cat => cat.parentCategoryId === category.categoryId).length > 1 ? 's' : ''}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-sm text-slate-600 font-medium">4.8/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories Section (if any) */}
      {categories.filter(cat => cat.parentCategoryId === category.categoryId).length > 0 && (
        <div className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 py-12 border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-extralight text-slate-900 mb-3 tracking-wide">
                Parcourir par spécialité
              </h2>
              <p className="text-slate-600 font-light">
                Affinez votre recherche avec nos sous-catégories spécialisées
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories
                .filter(cat => cat.parentCategoryId === category.categoryId)
                .map((subcategory) => {
                  // Get subcategory icon based on name
                  const getSubcategoryIcon = (categoryName: string) => {
                    const name = categoryName.toLowerCase();
                    if (name.includes('jeu') || name.includes('video') || name.includes('kirby')) {
                      return <Grid3X3 className="w-5 h-5 text-purple-600" />;
                    }
                    if (name.includes('animaux') || name.includes('pieuvre') || name.includes('poulpe')) {
                      return <Star className="w-5 h-5 text-blue-600" />;
                    }
                    if (name.includes('bébé') || name.includes('enfant')) {
                      return <Star className="w-5 h-5 text-pink-600" />;
                    }
                    if (name.includes('kawaii') || name.includes('mignon')) {
                      return <Star className="w-5 h-5 text-amber-600" />;
                    }
                    return <Star className="w-5 h-5 text-slate-600" />;
                  };

                  const getSubcategoryGradient = (categoryName: string) => {
                    const name = categoryName.toLowerCase();
                    if (name.includes('jeu') || name.includes('video') || name.includes('kirby')) {
                      return 'from-purple-100 to-indigo-100';
                    }
                    if (name.includes('animaux') || name.includes('pieuvre') || name.includes('poulpe')) {
                      return 'from-blue-100 to-cyan-100';
                    }
                    if (name.includes('bébé') || name.includes('enfant')) {
                      return 'from-pink-100 to-rose-100';
                    }
                    if (name.includes('kawaii') || name.includes('mignon')) {
                      return 'from-amber-100 to-yellow-100';
                    }
                    return 'from-slate-100 to-slate-200';
                  };
                  
                  return (
                    <Link
                      key={subcategory.categoryId}
                      href={`/category/${subcategory.slug}`}
                      className="group block"
                    >
                      <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-slate-200/60 hover:border-slate-300/60 hover:-translate-y-1">
                        <div className="text-center space-y-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${getSubcategoryGradient(subcategory.categoryNameCanonical)} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                            {getSubcategoryIcon(subcategory.categoryNameCanonical)}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 capitalize group-hover:text-slate-700 transition-colors">
                              {subcategory.categoryNameCanonical}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Voir la collection
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtres</span>
            </Button>
            
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white shadow-sm font-medium"
            >
              <option value="newest">Plus récent</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating">Mieux noté</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 font-medium">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              {categories.filter(cat => cat.parentCategoryId === category.categoryId).length > 0 && (
                <span className="text-slate-500 ml-1">(toutes spécialités incluses)</span>
              )}
            </span>
            
            <div className="flex items-center border border-slate-200 rounded-xl shadow-sm bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-l-xl transition-all duration-200 ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-r-xl transition-all duration-200 ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 rounded-2xl p-6 mb-8 border border-slate-200/60 shadow-lg backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3 tracking-wide">
                  {getString('product.price')}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange({ 
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)] 
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>{formatCurrency(filters.priceRange[0])}</span>
                    <span>{formatCurrency(filters.priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3 tracking-wide">
                  Note minimum
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange({ rating: parseInt(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white shadow-sm font-medium"
                >
                  <option value="0">Toutes les notes</option>
                  <option value="4">4★ et plus</option>
                  <option value="3">3★ et plus</option>
                  <option value="2">2★ et plus</option>
                </select>
              </div>

              {/* Stock */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange({ inStock: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 focus:ring-offset-0 shadow-sm"
                  />
                                      <span className="text-sm font-semibold text-slate-900 tracking-wide">
                      {getString('product.inStock')} uniquement
                    </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-slate-600 font-light">Essayez de modifier vos filtres ou explorez nos autres catégories</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-6'
          }>
            {filteredProducts.map((product) => (
              <div key={product.productId}>
                {viewMode === 'grid' ? (
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    className="h-full"
                  />
                ) : (
                  // List view (horizontal layout)
                  <div className="bg-gradient-to-br from-white via-slate-50/30 to-white border border-slate-200/60 rounded-2xl p-6 flex space-x-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex-shrink-0">
                      <Image
                        src={product.imagePaths[0] || '/placeholder-product.jpg'}
                        alt={product.title}
                        width={200}
                        height={200}
                        className="w-32 h-32 object-cover rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 tracking-wide">
                          <Link href={`/product/${product.slug}`} className="hover:text-slate-700 transition-colors">
                            {product.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-slate-600 mt-2 font-light leading-relaxed">{product.shortDescription}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.reviews.averageRating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 font-medium">
                          ({product.reviews.totalReviews})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-slate-900 tracking-wide">
                            {formatCurrency(product.basePrice)}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-slate-400 line-through font-medium">
                              {formatCurrency(product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white hover:shadow-xl rounded-xl font-semibold tracking-wide transition-all duration-300 hover:scale-105"
                        >
                          {getString('cart.addToCart')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More (for pagination) */}
        {filteredProducts.length > 0 && filteredProducts.length % 20 === 0 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-semibold px-8 py-4 transition-all duration-300"
            >
              Voir plus de produits
            </Button>
          </div>
        )}
      </div>

      {/* SEO Content Section */}
      {categoryContent && (
        <div className="bg-gradient-to-br from-gray-50 to-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="prose max-w-none">
              <MDXRemote {...categoryContent.content} />
            </article>
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      <Reviews limit={6} showTitle={true} />
    </Layout>
  );
};

export default CategoryPage; 