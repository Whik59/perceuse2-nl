import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import Reviews from '../../../components/Reviews';
import { Category } from '../../../lib/types';
import { getString } from '../../../lib/utils';
import { getProductBySlug } from '../../../lib/getProductBySlug';
import { 
  ChevronRight, 
  Package,
  Heart,
  Star,
  ArrowRight,
  Sparkles,
  Search,
  Users,
  Gamepad2,
  Baby,
  Rabbit,
  Crown
} from 'lucide-react';

// SEO Metadata
export const metadata: Metadata = {
  title: `${getString('common.siteName')} - ${getString('categories.title')} | ${getString('common.siteName')}`,
  description: getString('categories.hero.subtitle') + '. ' + getString('categories.subtitle') + '. ' + getString('common.qualityExceptional') + ' und ' + getString('common.amazonShipping') + '.',
  keywords: ['airfryer', 'kategorien', 'airfryer', 'gesunde küche', 'luftfritteuse', 'premium qualität'],
  openGraph: {
    title: `${getString('common.siteName')} - ${getString('categories.title')}`,
    description: getString('categories.hero.subtitle') + ' mit ' + getString('common.amazonShipping') + '.',
    type: 'website',
  }
};

// Enhanced Category Card with better image handling
const CategoryCard: React.FC<{ 
  category: Category; 
  subcategories: Category[];
}> = async ({ category, subcategories }) => {
  // Get category icon based on name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('air') || name.includes('sans huile')) {
      return <Sparkles className="w-8 h-8" />;
    }
    if (name.includes('huile') || name.includes('traditionnelle')) {
      return <Package className="w-8 h-8" />;
    }
    if (name.includes('ninja') || name.includes('philips') || name.includes('moulinex')) {
      return <Crown className="w-8 h-8" />;
    }
    return <Package className="w-8 h-8" />;
  };

  const getCategoryGradient = (categoryName: string) => {
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
    return 'from-amber-100 to-yellow-100';
  };

  const getIconColor = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('jeu') || name.includes('video') || name.includes('kirby')) {
      return 'text-purple-600';
    }
    if (name.includes('animaux') || name.includes('pieuvre') || name.includes('poulpe')) {
      return 'text-blue-600';
    }
    if (name.includes('bébé') || name.includes('enfant')) {
      return 'text-pink-600';
    }
    return 'text-amber-600';
  };

  // For now, always show icon instead of product images
  const showImageGrid = false;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block"
    >
      <div className="bg-gradient-to-br from-white via-slate-50/30 to-white rounded-2xl p-6 hover:shadow-xl transition-all duration-500 border border-slate-200/60 hover:border-slate-300/60 hover:-translate-y-1 relative overflow-hidden">
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative">
          {/* Category Visual */}
          <div className="flex items-center justify-center mb-6">
            {showImageGrid ? (
              <div className="grid grid-cols-2 gap-2 w-24 h-24">
                {/* Placeholder for future product images */}
                {[...Array(4)].map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`w-24 h-24 bg-gradient-to-br ${getCategoryGradient(category.categoryNameCanonical)} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
                <div className={getCategoryIcon(category.categoryNameCanonical).props.className.replace('w-8 h-8', `w-12 h-12 ${getIconColor(category.categoryNameCanonical)}`)}>
                  {getCategoryIcon(category.categoryNameCanonical)}
                </div>
              </div>
            )}
          </div>

          {/* Category Info */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 capitalize group-hover:text-slate-700 transition-colors leading-tight">
              {category.categoryNameCanonical}
            </h3>

            {/* Hover Arrow */}
            <div className="flex items-center justify-center pt-2">
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoriesPage: React.FC = async () => {
  // Load categories on server side
  let categories: Category[] = [];
  
  try {
    const categoriesData = await import('../../../data/categories.json');
    categories = categoriesData.default;
  } catch (error) {
    console.error('Error loading categories:', error);
  }

  // Separate parent and child categories
  const parentCategories = categories.filter(cat => cat.parentCategoryId === null);
  const getSubcategories = (parentId: number) => 
    categories.filter(cat => cat.parentCategoryId === parentId);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-stone-50">
        {/* Premium Hero Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-16 lg:py-20 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-slate-700/20 to-slate-600/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-slate-600/10 to-slate-700/20 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center bg-gradient-to-r from-white/10 via-slate-50/20 to-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-white/10 mb-6 hover:shadow-2xl transition-all duration-300">
                <Sparkles className="w-4 h-4 text-slate-300 mr-2" />
                <span className="text-sm font-bold text-slate-200 tracking-wider uppercase">{getString('categories.title')}</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-extralight mb-6 tracking-tighter leading-tight">
                <span className="bg-gradient-to-r from-slate-300 via-white to-slate-300 bg-clip-text text-transparent">{getString('categories.hero.title')}</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
                {getString('categories.subtitle')} {getString('categories.hero.subtitle')}.
              </p>
            </div>
          </div>
        </div>

        {/* Premium Breadcrumb */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
                {getString('navigation.home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">{getString('categories.title')}</span>
            </nav>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="py-8 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={getString('categories.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white shadow-sm font-medium placeholder:text-slate-500"
                />
                </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 font-medium">
                  {parentCategories.length} {getString('categories.collectionsAvailable')}
                </span>
                </div>
                </div>
              </div>
            </div>

        {/* Categories Grid */}
        <div className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {parentCategories.map((category) => {
                const subcategories = getSubcategories(category.categoryId);
                
                return (
                  <CategoryCard
                    key={category.categoryId}
                    category={category}
                    subcategories={subcategories}
                  />
                );
              })}
                          </div>

            {/* Show all subcategories if any exist */}
            {categories.some(cat => cat.parentCategoryId !== null) && (
              <div className="mt-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl lg:text-4xl font-extralight text-slate-900 mb-4 tracking-wide">
                    {getString('categories.allSubcategories')}
                            </h2>
                  <p className="text-slate-600 font-light text-lg">
                    {getString('categories.subcategoriesDescription')}
                            </p>
                          </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categories.filter(cat => cat.parentCategoryId !== null).map((subcategory) => {
                    
                    // Get subcategory icon based on name
                    const getSubcategoryIcon = (categoryName: string) => {
                      const name = categoryName.toLowerCase();
                      if (name.includes('jeu') || name.includes('video') || name.includes('kirby')) {
                        return <Gamepad2 className="w-6 h-6 text-purple-600" />;
                      }
                      if (name.includes('animaux') || name.includes('pieuvre') || name.includes('poulpe')) {
                        return <Rabbit className="w-6 h-6 text-blue-600" />;
                      }
                      if (name.includes('bébé') || name.includes('enfant')) {
                        return <Baby className="w-6 h-6 text-pink-600" />;
                      }
                      if (name.includes('kawaii') || name.includes('mignon')) {
                        return <Sparkles className="w-6 h-6 text-amber-600" />;
                      }
                      return <Crown className="w-6 h-6 text-slate-600" />;
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
                          <div className="text-center space-y-2">
                            <div className={`w-12 h-12 bg-gradient-to-br ${getSubcategoryGradient(subcategory.categoryNameCanonical)} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                              {getSubcategoryIcon(subcategory.categoryNameCanonical)}
                                  </div>
                            <h3 className="text-sm font-semibold text-slate-900 capitalize group-hover:text-slate-700 transition-colors">
                                      {subcategory.categoryNameCanonical}
                                    </h3>
                      </div>
                        </div>
                        </Link>
                );
              })}
            </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="text-center mt-20">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-12 text-white relative overflow-hidden shadow-xl">
                {/* Background Elements */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-slate-700/30 to-slate-600/20 rounded-full -translate-y-24 translate-x-24 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-slate-600/20 to-slate-700/30 rounded-full translate-y-16 -translate-x-16 blur-3xl"></div>
                </div>
                
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-extralight mb-4 tracking-wide">{getString('categories.needHelp')}</h3>
                  <p className="text-slate-300 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                    {getString('categories.helpDescription')}
                </p>
                <Link
                  href="/"
                    className="group inline-flex items-center space-x-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                    <span>{getString('categories.backToHome')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-slate-200/60">
          <Reviews limit={6} />
        </div>
      </div>
    </Layout>
  );
};

export default CategoriesPage; 