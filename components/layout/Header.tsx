'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Menu, X, MessageCircle, Tag, Star, Package } from 'lucide-react';
import { formatCurrency, getString } from '../../lib/utils';
import { Category, CartItem, Product } from '../../lib/types';
import SupportFAQ from '../SupportFAQ';
import EmergencyBanner from '../EmergencyBanner';
import { useCategories } from '../../lib/useDataCache';

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
  categories: propCategories = [],
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
  const [searchCategories, setSearchCategories] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [subcategoryProducts, setSubcategoryProducts] = useState<Record<number, Product | null>>({});

  // Use cached categories data
  const { data: cachedCategories, fetchData: fetchCategories } = useCategories();
  const categories = cachedCategories || propCategories;

  // Fetch categories if not cached and not provided as props
  useEffect(() => {
    if (!cachedCategories && propCategories.length === 0) {
      fetchCategories(async () => {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
      });
    }
  }, [cachedCategories, propCategories.length, fetchCategories]);

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
      setSearchCategories([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`);
      const data = await response.json();
      setSearchSuggestions(data.suggestions || []);
      setSearchCategories(data.categories || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearchSuggestions([]);
      setSearchCategories([]);
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

  // Scroll-based header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsHeaderVisible(true);
      } 
      // Hide header when scrolling down (but not on mobile menu open)
      else if (currentScrollY > lastScrollY && currentScrollY > 100 && !isMobileMenuOpen) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, isMobileMenuOpen]);

  // Load sample products for subcategories
  useEffect(() => {
    const loadSubcategoryProducts = async () => {
      const products: Record<number, Product | null> = {};
      
      for (const category of categories) {
        if (category.parentCategoryId === null) {
          const subcategories = getSubcategories(category.categoryId || 0);
          
          for (const subcategory of subcategories) {
            if (!products[subcategory.categoryId || 0]) {
              try {
                // Use API route to get products by category ID
                const response = await fetch(`/api/products/by-category/${subcategory.categoryId}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data && data.length > 0) {
                    products[subcategory.categoryId || 0] = data[0];
                  }
                }
              } catch (error) {
                console.error(`Error loading product for subcategory ${subcategory.slug}:`, error);
                products[subcategory.categoryId || 0] = null;
              }
            }
          }
        }
      }
      
      setSubcategoryProducts(products);
    };

    if (categories.length > 0) {
      loadSubcategoryProducts();
    }
  }, [categories]);

  // Get parent categories and sort by number of subcategories (most subcategories first)
  const parentCategories = categories
    .filter(cat => cat.parentCategoryId === null)
    .map(cat => ({
      ...cat,
      subcategoryCount: categories.filter(sub => sub.parentCategoryId === cat.categoryId).length
    }))
    .sort((a, b) => b.subcategoryCount - a.subcategoryCount);

  // Smart category selection - display exactly 7 categories
  const getOptimalCategories = () => {
    // Take the first 7 categories from parentCategories (already sorted by subcategory count)
    const selectedCategories = parentCategories.slice(0, 7).map(cat => ({
        ...cat,
      displayName: truncateText(cat.name || cat.categoryNameCanonical || '', 18)
      }));
    
    return selectedCategories;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const optimalCategories = getOptimalCategories();
  
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
      <EmergencyBanner />
    <header className={`bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-transform duration-300 ease-in-out ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Premium Logo & Site Name */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-4 group">
            <div className="relative">
              <div className="w-16 h-16 sm:w-16 sm:h-16 lg:w-20 lg:h-20 relative rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Image
                src="/logo.png"
                alt={getString('common.siteName')}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover"
                priority
              />
              </div>
              {/* Premium Badge - Desktop only (outside bottom) */}
              <div className="hidden sm:block absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                {getString('header.premium')}
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="font-bold text-lg sm:text-xl lg:text-2xl text-orange-600 tracking-tight leading-tight group-hover:text-orange-700 transition-colors duration-300">
                {getString('common.siteName')}
              </span>
                {/* Amazon Partner Badge - Hidden on very small screens */}
                <div className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-orange-50 to-orange-100 px-2 sm:px-3 py-1 rounded-full border border-orange-200">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fillRule="evenodd">
                      <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fill="#FF9900" fillRule="nonzero"/>
                      <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095" fill="#000000"/>
                    </g>
                  </svg>
                  <span className="text-xs font-bold text-orange-600">{getString('header.partner')}</span>
                </div>
              </div>
              {/* Premium Badge - Mobile only (below site name) */}
              <div className="sm:hidden mt-1 flex items-center space-x-2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg inline-block">
                  {getString('header.premium')}
                </div>
                <span className="text-[10px] font-medium text-gray-600">{getString('header.madeInGermany')}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3 mt-1">
                <span className="text-xs sm:text-sm text-gray-600 font-medium tracking-wide">{getString('header.madeInGermany')}</span>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-semibold">{getString('header.verified')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-600 font-medium">{getString('header.rating')}</span>
                </div>
              </div>
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
              {showSuggestions && (searchSuggestions.length > 0 || searchCategories.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {/* Categories Section */}
                  {searchCategories.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategorien</span>
                      </div>
                      {searchCategories.map((category, index) => (
                        <button
                          key={`category-${index}`}
                          onClick={() => {
                            window.location.href = `/category/${category.categoryId}`;
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs">📁</span>
                            </div>
                            <span className="text-gray-900">{category.name}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {/* Suggestions Section */}
                  {searchSuggestions.length > 0 && (
                    <>
                      {searchCategories.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vorschläge</span>
                        </div>
                      )}
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
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
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors group"
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

        {/* Navigation - Desktop Amazon Theme */}
        <nav className="hidden md:flex items-center justify-center space-x-2 lg:space-x-3 pb-4 pt-4 border-t border-orange-100">
            {optimalCategories.map((category) => {
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
                    className="flex items-center text-gray-700 hover:text-orange-600 font-light text-xs tracking-[0.5px] transition-all duration-500 py-2 px-3 group relative uppercase letter-spacing-wide"
            >
              <span className="relative font-medium" title={category.name || category.categoryNameCanonical}>
                {(category as any).displayName || category.name || category.categoryNameCanonical}
                <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-[1px] bg-orange-600 transition-all duration-500 group-hover:w-full"></span>
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
                      className="absolute top-full left-1/2 transform -translate-x-1/2 pt-4 w-96 z-50"
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
                          {subcategories.map((subcategory, index) => {
                            const sampleProduct = subcategoryProducts[subcategory.categoryId || 0];
                            return (
                              <Link
                                key={subcategory.categoryId}
                                href={`/category/${subcategory.slug}`}
                                className="group/item flex items-center space-x-3 px-5 py-3 text-xs font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 transition-all duration-300 border-b border-gray-50/50 last:border-b-0"
                              >
                                {/* Product Image */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-gray-100">
                                  {sampleProduct?.imagePaths && sampleProduct.imagePaths.length > 0 ? (
                                    <Image
                                      src={sampleProduct.imagePaths[0]}
                                      alt={sampleProduct.title || subcategory.name || ''}
                                      width={32}
                                      height={32}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      sizes="32px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Category Name */}
                                <span className="relative tracking-[0.3px] uppercase flex-1">
                                  {subcategory.name || subcategory.categoryNameCanonical}
                                </span>
                                
                                {/* Arrow */}
                                <svg className="w-3 h-3 opacity-0 group-hover/item:opacity-60 transition-all duration-300 transform translate-x-2 group-hover/item:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            );
                          })}
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
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            {/* Mobile Search */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getString('header.search.placeholder')}
                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-sm font-medium placeholder:text-gray-500"
                />
                <button
                  type="submit"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
            </div>

            {/* Mobile Navigation */}
            <nav className="py-2">
                {optimalCategories.map((category) => {
                  const subcategories = getSubcategories(category.categoryId || 0);
                  const hasSubcategories = subcategories.length > 0;
                  const isExpanded = expandedMobileCategories.has(category.categoryId || 0);
                  
                  return (
                  <div key={category.categoryId} className="border-b border-gray-50 last:border-b-0">
                    <div className="flex items-center justify-between">
                <Link
                  href={`/category/${category.slug}`}
                        className="flex-1 text-gray-700 hover:text-orange-600 font-medium text-sm py-4 px-4 hover:bg-orange-50 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {(category as any).displayName || category.name || category.categoryNameCanonical}
                        </Link>
                        {hasSubcategories && (
                          <button
                            onClick={() => toggleMobileCategory(category.categoryId || 0)}
                          className="p-4 text-gray-400 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50"
                          >
                            <svg
                            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                    {/* Mobile Subcategories */}
                      {hasSubcategories && isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-100">
                          {subcategories.map((subcategory) => {
                            const sampleProduct = subcategoryProducts[subcategory.categoryId || 0];
                            return (
                              <Link
                                key={subcategory.categoryId}
                                href={`/category/${subcategory.slug}`}
                                className="flex items-center space-x-3 text-gray-600 hover:text-orange-600 font-normal text-sm py-3 px-6 hover:bg-orange-50 transition-all duration-200 border-l-2 border-transparent hover:border-orange-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {/* Product Image */}
                                <div className="flex-shrink-0 w-6 h-6 rounded overflow-hidden bg-gray-200">
                                  {sampleProduct?.imagePaths && sampleProduct.imagePaths.length > 0 ? (
                                    <Image
                                      src={sampleProduct.imagePaths[0]}
                                      alt={sampleProduct.title || subcategory.name || ''}
                                      width={24}
                                      height={24}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      sizes="24px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                      <Package className="w-3 h-3 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Category Name */}
                                <span className="flex-1">
                                  {subcategory.name || subcategory.categoryNameCanonical}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {/* Support Button */}
              <div className="border-t border-gray-100 mt-2">
              <button
                onClick={() => {
                  setIsSupportOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                  className="w-full text-gray-700 hover:text-orange-600 font-medium text-sm py-4 px-4 hover:bg-orange-50 transition-all duration-200 text-left"
              >
{getString('header.support')}
              </button>
              </div>
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