'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Menu, X, MessageCircle, Tag, Star, Package } from 'lucide-react';
import { formatCurrency, getString } from '../../lib/utils';
import { Category, CartItem } from '../../lib/types';
import SupportFAQ from '../SupportFAQ';

interface HeaderProps {
  cartItemCount?: number;
  categories?: Category[];
  onCartClick?: () => void;
  onSearchSubmit?: (query: string) => void;
}

// Animated Counter Component
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ 
  end, 
  suffix = '', 
  duration = 2000 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

// Mobile Rotating Banner Component
const MobileRotatingBanner: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const bannerMessages = [
    {
      icon: <Tag className="w-4 h-4 text-yellow-400" />,
      content: (
        <>
          <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-sm tracking-wider">10HOURS</span>
          <span className="text-sm font-medium text-white">30% {getString('banner.discount')}</span>
        </>
      )
    },
    {
      icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />,
      content: (
        <>
          <span className="text-yellow-400 font-bold">4.6/5</span>
          <span className="text-sm text-white">{getString('banner.clientReviews')}</span>
        </>
      )
    },
    {
      icon: <Package className="w-4 h-4 text-green-400" />,
      content: (
        <>
          <span className="text-green-400 font-bold">
            <AnimatedCounter end={2000} suffix="+" duration={2000} />
          </span>
          <span className="text-sm text-white">{getString('banner.ordersDelivered')}</span>
        </>
      )
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // Start animation
      setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerMessages.length);
        setIsAnimating(false);
      }, 150); // Half of the transition duration
      
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [bannerMessages.length]);

  const currentMessage = bannerMessages[currentBannerIndex];

  return (
    <div className="relative h-8 flex items-center justify-center overflow-hidden">
      <div 
        className={`flex items-center justify-center space-x-2 transition-all duration-300 ease-in-out transform ${
          isAnimating 
            ? 'opacity-0 translate-y-2 scale-95' 
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <div className="flex items-center space-x-1">
          {currentMessage.icon}
        </div>
        <div className="flex items-center space-x-2">
          {currentMessage.content}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({
  cartItemCount = 0,
  categories = [],
  onCartClick,
  onSearchSubmit
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartTotal, setCartTotal] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Set<number>>(new Set());
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Enhanced dropdown hover handlers with delay
  const handleDropdownEnter = (categoryId: number) => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setActiveDropdown(categoryId);
  };

  const handleDropdownLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // 150ms delay to prevent accidental closing
    setDropdownTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
      }
    };
  }, [dropdownTimeout]);

  // Update cart total from localStorage
  useEffect(() => {
    const updateCartTotal = () => {
      try {
        const cartData = localStorage.getItem('cart') || '{"items":[], "total": 0}'
        const cart = JSON.parse(cartData)
        
        // Calculate total if not already calculated
        if (cart.items && Array.isArray(cart.items)) {
          const total = cart.items.reduce((sum: number, item: CartItem) => {
            return sum + ((item.price || 0) * (item.quantity || 0))
          }, 0)
          setCartTotal(total)
        } else {
          setCartTotal(cart.total || 0)
        }
      } catch (error) {
        console.error('Error reading cart total from localStorage:', error)
        setCartTotal(0)
      }
    }

    updateCartTotal()
    
    // Listen for storage changes
    window.addEventListener('storage', updateCartTotal)
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', updateCartTotal)

    return () => {
      window.removeEventListener('storage', updateCartTotal)
      window.removeEventListener('cartUpdated', updateCartTotal)
    }
  }, [])

  // Fetch search suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=suggestions`);
      const data = await response.json();
      setSearchSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    window.location.href = `/search?q=${encodeURIComponent(suggestion)}`;
    setShowSuggestions(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Get parent categories and sort by number of subcategories (most subcategories first)
  const parentCategories = categories
    .filter(cat => cat.parentCategoryId === null)
    .map(cat => ({
      ...cat,
      subcategoryCount: categories.filter(sub => sub.parentCategoryId === cat.categoryId).length
    }))
    .sort((a, b) => b.subcategoryCount - a.subcategoryCount)
    .slice(0, 8); // Show only top 8 main categories with most subcategories
  
  // Group categories by parent
  const getSubcategories = (parentId: number) => {
    return categories.filter(cat => cat.parentCategoryId === parentId);
  };

  // Mobile category expansion helpers
  const toggleMobileCategory = (categoryId: number) => {
    setExpandedMobileCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Promo Banner with Reviews */}
      <div className="bg-gray-900 text-white py-3 px-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout - Full Banner */}
          <div className="hidden sm:flex items-center justify-center space-x-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-yellow-400" />
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-sm tracking-wider">10HOURS</span>
              <span className="text-sm font-medium text-white">30% {getString('banner.discount')}</span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-bold">4.6/5</span>
              <span className="text-sm text-white">{getString('banner.clientReviews')}</span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold">
                <AnimatedCounter end={2000} suffix="+" duration={2000} />
              </span>
              <span className="text-sm text-white">{getString('banner.ordersDelivered')}</span>
            </div>
          </div>

          {/* Mobile Layout - Rotating Banner */}
          <div className="sm:hidden">
            <MobileRotatingBanner />
          </div>
        </div>
      </div>

    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/logo.png"
                alt={getString('common.siteName')}
                width={48}
                height={48}
                className="rounded-lg object-cover"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900 tracking-tight leading-tight">
                {getString('common.siteName')}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide leading-tight">Premium</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={getString('header.search.placeholder')}
                  className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Customer Support - Desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => setIsSupportOpen(true)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{getString('header.support')}</span>
              </button>
            </div>

              {/* Cart with Real Total */}
            <button
              onClick={onCartClick}
              className="relative flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors group"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs text-gray-500">{getString('header.cart.title')}</span>
                  <span className="text-sm font-semibold">{formatCurrency(cartTotal)}</span>
              </div>
            </button>

            {/* Mobile Support Button */}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="md:hidden text-gray-700 hover:text-gray-900 transition-colors p-1"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-gray-900 transition-colors p-1"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation - Desktop Luxury Design */}
        <nav className="hidden md:flex items-center justify-center space-x-3 pb-4 pt-4 border-t border-gray-50">
            {parentCategories.map((category) => {
              const subcategories = getSubcategories(category.categoryId || 0);
              const hasSubcategories = subcategories.length > 0;
              
              return (
                <div
                  key={category.categoryId || 0}
                  className="relative group"
                  onMouseEnter={() => hasSubcategories && handleDropdownEnter(category.categoryId || 0)}
                  onMouseLeave={handleDropdownLeave}
                >
            <Link
              href={`/category/${category.slug}`}
                    className="flex items-center text-gray-700 hover:text-gray-900 font-light text-xs tracking-[0.5px] transition-all duration-500 py-2 px-3 group relative uppercase letter-spacing-wide"
            >
              <span className="relative font-medium">
                {category.name || category.categoryNameCanonical}
                <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-[1px] bg-gray-900 transition-all duration-500 group-hover:w-full"></span>
              </span>
                    {hasSubcategories && (
                      <svg
                        className="ml-3 w-3 h-3 transition-all duration-500 group-hover:rotate-180 opacity-60 group-hover:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                  
                  {/* Luxury Dropdown Menu */}
                  {hasSubcategories && activeDropdown === (category.categoryId || 0) && (
                    <div 
                      className="absolute top-full left-1/2 transform -translate-x-1/2 pt-4 w-80 z-50"
                      onMouseEnter={() => handleDropdownEnter(category.categoryId || 0)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      {/* Invisible bridge */}
                      <div className="absolute top-0 left-0 right-0 h-4 bg-transparent"></div>
                      
                      {/* Luxury dropdown content */}
                      <div className="bg-white shadow-xl border border-gray-100/50 backdrop-blur-xl rounded-none overflow-hidden">
                        {/* Dropdown header */}
                        <div className="bg-gray-50/30 px-5 py-3 border-b border-gray-100/50">
                          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-[1px] letter-spacing-wide">
                            {category.name || category.categoryNameCanonical}
                          </h3>
                        </div>
                        
                        {/* Dropdown items */}
                        <div className="py-1">
                          {subcategories.map((subcategory, index) => (
                            <Link
                              key={subcategory.categoryId}
                              href={`/category/${subcategory.slug}`}
                              className="group/item flex items-center justify-between px-5 py-2 text-xs font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 transition-all duration-300 border-b border-gray-50/50 last:border-b-0"
                            >
                              <span className="relative tracking-[0.3px] uppercase whitespace-nowrap">
                                {subcategory.name || subcategory.categoryNameCanonical}
                              </span>
                              <svg className="w-3 h-3 opacity-0 group-hover/item:opacity-60 transition-all duration-300 transform translate-x-2 group-hover/item:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 bg-gradient-to-b from-white to-gray-50">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mb-4 px-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getString('header.search.placeholder')}
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white shadow-sm text-[15px] font-medium placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Mobile Navigation - Luxury */}
              <nav className="flex flex-col space-y-0.5 px-2">
                {parentCategories.map((category) => {
                  const subcategories = getSubcategories(category.categoryId || 0);
                  const hasSubcategories = subcategories.length > 0;
                  const isExpanded = expandedMobileCategories.has(category.categoryId || 0);
                  
                  return (
                    <div key={category.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between bg-white border border-gray-100/50 overflow-hidden">
                <Link
                  href={`/category/${category.slug}`}
                          className="flex-1 text-gray-700 hover:text-gray-900 font-light text-xs tracking-[0.5px] py-3 px-4 hover:bg-gray-50/50 transition-all duration-300 uppercase"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name || category.categoryNameCanonical}
                        </Link>
                        {hasSubcategories && (
                          <button
                            onClick={() => toggleMobileCategory(category.categoryId || 0)}
                            className="p-3 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:bg-gray-50/50"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Mobile Subcategories - Luxury */}
                      {hasSubcategories && isExpanded && (
                        <div className="bg-gray-50/30 border-l border-gray-200/50 ml-6">
                          {subcategories.map((subcategory) => (
                            <Link
                              key={subcategory.categoryId}
                              href={`/category/${subcategory.slug}`}
                              className="block text-xs font-light text-gray-600 hover:text-gray-900 py-2 px-4 hover:bg-white/80 transition-all duration-300 border-b border-gray-100/50 last:border-b-0 uppercase tracking-[0.5px] whitespace-nowrap"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {subcategory.name || subcategory.categoryNameCanonical}
                </Link>
              ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              
              <button
                onClick={() => {
                  setIsSupportOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                  className="text-gray-700 hover:text-gray-900 font-light text-sm tracking-[0.5px] py-3 px-4 hover:bg-gray-50/50 transition-all duration-300 mt-2 border-t border-gray-100/50 pt-3 w-full text-left bg-white border border-gray-100/50 uppercase"
              >
{getString('header.support')}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
    
    {/* Support FAQ Modal */}
    <SupportFAQ 
      isOpen={isSupportOpen} 
      onClose={() => setIsSupportOpen(false)} 
    />
    </>
  );
};

export default Header; 