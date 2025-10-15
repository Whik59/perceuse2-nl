'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../../../components/layout/Layout';
import { Button } from '../../../../components/ui/Button';
import ProductCard from '../../../../components/ProductCard';
import Reviews from '../../../../components/Reviews';
import { Product, Category, ProductVariation } from '../../../../lib/types';
import { getAmazonUrlWithAffiliateTag } from '../../../../lib/cart';
import { formatCurrency, getString, generateProductRating, generateProductReviewSnippet, generateProductReviews, slugToReadableTitle } from '../../../../lib/utils';
import { getProductContent, ProductContent } from '../../../../lib/getProductContent';
import { MDXRemote } from 'next-mdx-remote';
import { 
  Star, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Truck, 
  Shield, 
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ThumbsUp,
  Headphones,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

// FAQ Accordion Component
const FAQAccordion: React.FC<{ faq: any[] }> = ({ faq }) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-2">
      {faq.map((item, index) => {
        const isExpanded = expandedItems.has(index);
        return (
          <div key={index} className="bg-orange-50 rounded border border-orange-200">
            <button
              onClick={() => toggleItem(index)}
              className="w-full text-left p-2 flex items-center justify-between hover:bg-orange-100 transition-colors"
            >
              <h4 className="font-semibold text-orange-800 text-xs pr-2">{item.question || item.q}</h4>
              {isExpanded ? (
                <Minus className="w-3 h-3 text-orange-600 flex-shrink-0" />
              ) : (
                <Plus className="w-3 h-3 text-orange-600 flex-shrink-0" />
              )}
            </button>
            {isExpanded && (
              <div className="px-2 pb-2">
                <p className="text-gray-700 text-xs leading-relaxed">{item.answer || item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Amazon-Style Feature Step Card Component
const FeatureStepCard: React.FC<{ step: any }> = ({ step }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-orange-300">
      <div className="flex items-start p-6">
        {/* Amazon-Style Step Number */}
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mr-5 shadow-md">
          <span className="text-sm font-bold text-white">{step.step}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-lg mb-2 leading-tight">
            {step.title}
          </h4>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            {step.description}
          </p>
          
          {/* Amazon-Style Benefits List */}
          {step.benefits && (
            <div className="space-y-2 mb-3">
              {step.benefits.map((benefit: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Expanded Content */}
          {isExpanded && step.expanded_content && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {step.expanded_content}
              </div>
            </div>
          )}
        </div>
        
        {/* Amazon-Style Expand/Collapse Button */}
        {step.expanded_content && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 p-2 hover:bg-orange-50 rounded-lg transition-colors flex-shrink-0 group"
          >
            {isExpanded ? (
              <Minus className="w-5 h-5 text-orange-600 group-hover:text-orange-700" />
            ) : (
              <Plus className="w-5 h-5 text-orange-600 group-hover:text-orange-700" />
            )}
          </button>
        )}
      </div>
      
      {/* Amazon-Style Connecting Line */}
      <div className="flex justify-center pb-2">
        <div className="w-px h-3 bg-gradient-to-b from-orange-200 to-transparent"></div>
      </div>
    </div>
  );
};

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [viewersCount, setViewersCount] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productContent, setProductContent] = useState<ProductContent | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [countdown, setCountdown] = useState({ minutes: 10, seconds: 0 });

  // SEO and conversion hooks
  useEffect(() => {
    // Simulate real-time viewers
    const interval = setInterval(() => {
      setViewersCount(Math.floor(Math.random() * 8) + 12); // 12-20 viewers (more realistic)
    }, 45000);

    // Simulate recent purchases
    const purchaseNames = ['Marie', 'Lucas', 'Sophie', 'Pierre', 'Emma'];
    setRecentPurchases(purchaseNames.slice(0, Math.floor(Math.random() * 2) + 1));

    return () => clearInterval(interval);
  }, []);

  // Generate consistent rating for this product
  const productRating = product ? generateProductRating(product.slug) : null;

  // Countdown timer for urgency
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          // Reset to 10 minutes when timer reaches 0
          return { minutes: 10, seconds: 0 };
        }
        
        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        
        return { minutes: prev.minutes, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        // Load product via API route
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const productData = await response.json();
        setProduct(productData);
        
        // Initialize selected variations with defaults
        if (productData.variations?.length > 0) {
          const defaultVariations: Record<string, string> = {};
          productData.variations.forEach((variation: ProductVariation) => {
            if (variation.options.length > 0) {
              defaultVariations[variation.type] = variation.options[0].value;
            }
          });
          setSelectedVariations(defaultVariations);
        }
        
        // Load product MDX content if available
        try {
          const content = await getProductContent(slug);
          setProductContent(content);
        } catch (error) {
          console.error('Error loading product content:', error);
        }
        
        // Load related products from the same category
        if (productData.categoryIds && productData.categoryIds.length > 0) {
          try {
            const primaryCategoryId = productData.categoryIds[0];
            const relatedResponse = await fetch(`/api/products/by-category/${primaryCategoryId}`);
            if (relatedResponse.ok) {
              const categoryProducts = await relatedResponse.json();
              // Filter out current product and limit to 4 products
              const filtered = categoryProducts
                .filter((p: Product) => p.slug !== slug)
                .slice(0, 4);
              setRelatedProducts(filtered);
            }
          } catch (error) {
            console.error('Error loading related products:', error);
          }
        }
        
        // Load categories to get category name for breadcrumb
        try {
          const categoriesResponse = await fetch('/api/categories');
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData);
            
            // Find the current product's category
            if (productData.categoryIds && productData.categoryIds.length > 0) {
              const categoryId = productData.categoryIds[0];
              const category = categoriesData.find((cat: Category) => cat.categoryId === categoryId);
              setCurrentCategory(category || null);
            }
          }
        } catch (error) {
          console.error('Error loading categories:', error);
        }
        
        // Simulate real-time data
        setViewersCount(Math.floor(Math.random() * 8) + 12);
        
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        const categoriesData = await import('../../../../data/categories.json');
        setCategories(categoriesData.default);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    if (slug) {
      loadProduct();
    }
    loadCategories();
  }, [slug]);

  const handleVariationChange = (variationType: string, value: string) => {
    setSelectedVariations(prev => ({
      ...prev,
      [variationType]: value
    }));
  };


  const getMaxQuantity = (): number => {
    if (!product) return 0;
    
    if (product.variations.length > 0) {
      // Since variations don't have stock in the JSON, return default stock
      return 10;
    }
    
    // Cast to access actual JSON properties
    const productData = product as Product & { 
      inventory?: { totalStock?: number }; 
    };
    return productData.inventory?.totalStock || 10;
  };

  const getCurrentPrice = (): number => {
    if (!product) return 0;
    
    if (product.variations.length > 0) {
      for (const variation of product.variations) {
        const selectedValue = selectedVariations[variation.type];
        if (selectedValue) {
          const option = variation.options.find(opt => opt.value === selectedValue);
          if (option) {
            return option.price;
          }
        }
      }
    }
    
    return product.basePrice;
  };

  const getCurrentCompareAtPrice = (): number | undefined => {
    if (!product) return undefined;
    
    // For Amazon affiliate products, variations don't have compareAtPrice
    // Use the main product's compareAtPrice
    return product.compareAtPrice;
  };

  const handleBuyOnAmazon = () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    try {
      // Get Amazon URL based on selected variation
      let amazonUrl = product.amazonUrl;
      
      if (product.variations.length > 0) {
        for (const variation of product.variations) {
          const selectedValue = selectedVariations[variation.type];
          if (selectedValue) {
            const option = variation.options.find(opt => opt.value === selectedValue);
            if (option && option.amazonUrl) {
              amazonUrl = option.amazonUrl;
              break;
            }
          }
        }
      }
      
      // Open Amazon in new tab
      window.open(amazonUrl, '_blank');
      
    } catch (error) {
      console.error('Error redirecting to Amazon:', error);
      alert(getString('errors.amazonRedirectError'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (!product) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(prev => 
        prev === 0 ? product.imagePaths.length - 1 : prev - 1
      );
    } else {
      setSelectedImageIndex(prev => 
        prev === product.imagePaths.length - 1 ? 0 : prev + 1
      );
    }
  };


  const handleCartClick = () => {
    window.location.href = '/cart';
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>{getString('product.loading')} | {getString('common.siteName')}</title>
        </Head>
        <Layout
          categories={categories}
          cartItemCount={0}
          onCartClick={handleCartClick}
          onSearchSubmit={handleSearch}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="aspect-square bg-neutral-100 rounded-xl"></div>
                <div className="space-y-6">
                  <div className="h-8 bg-neutral-100 rounded-lg w-3/4"></div>
                  <div className="h-5 bg-neutral-100 rounded-lg w-1/2"></div>
                  <div className="h-12 bg-neutral-100 rounded-lg w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Head>
          <title>{getString('product.notFound')} | {getString('common.siteName')}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <Layout
          categories={categories}
          cartItemCount={0}
          onCartClick={handleCartClick}
          onSearchSubmit={handleSearch}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-2xl font-light text-neutral-900 mb-6">{getString('product.notFound')}</h1>
              <p className="text-neutral-600 mb-8">{getString('product.notFoundDescription')}</p>
              <Link href="/">
                <Button variant="outline" className="border-neutral-200 text-neutral-800 hover:bg-neutral-50">
                  {getString('navigation.home')}
                </Button>
              </Link>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  const currentPrice = getCurrentPrice();
  const compareAtPrice = getCurrentCompareAtPrice();
  const maxQuantity = getMaxQuantity();
  const isOutOfStock = maxQuantity === 0;
  
  // Generate consistent discount percentage based on product slug (30-35%)
  const getConsistentDiscount = (slug: string) => {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      const char = slug.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return 30 + (Math.abs(hash) % 6); // Returns 30-35
  };
  
  const fakeDiscountPercentage = compareAtPrice && compareAtPrice > currentPrice 
    ? getConsistentDiscount(slug) 
    : 0;
  const fakeCompareAtPrice = fakeDiscountPercentage > 0
    ? Math.round(currentPrice / (1 - fakeDiscountPercentage / 100) * 100) / 100
    : compareAtPrice;
  const savings = fakeCompareAtPrice && fakeCompareAtPrice > currentPrice ? fakeCompareAtPrice - currentPrice : 0;

  // Generate fallback values for missing properties
  const productData = product as Product & { 
    productNameCanonical?: string;
    longDescription?: string;
  }; // Cast to access actual JSON properties
  const productTitle = slugToReadableTitle(slug) || product.title || productData.productNameCanonical || 'Product';
  const productDescription = product.shortDescription || `Descubre ${productTitle} en nuestra colección`;
  const productLongDescription = product.longDescription || productDescription;
  const productFeatures = product.features || [];
  const productSEO = product.seo || {
    title: productTitle,
    description: productDescription,
    keywords: [productTitle.toLowerCase(), 'peluche', 'cadeau']
  };

  // Generate review data using consistent snippet system
  const reviewSnippet = generateProductReviewSnippet(product.slug, productTitle);
  const individualReviews = generateProductReviews(product.slug, productTitle, 5);
  const productReviews = {
    averageRating: reviewSnippet.averageRating,
    totalReviews: reviewSnippet.reviewCount,
    fiveStars: Math.floor(reviewSnippet.reviewCount * 0.7),
    fourStars: Math.floor(reviewSnippet.reviewCount * 0.2),
    threeStars: Math.floor(reviewSnippet.reviewCount * 0.08),
    twoStars: Math.floor(reviewSnippet.reviewCount * 0.02),
    oneStars: 0
  };

  return (
    <>
      <Head>
        <title>{productSEO.title}</title>
        <meta name="description" content={productSEO.description} />
        <meta name="keywords" content={Array.isArray(productSEO.keywords) ? productSEO.keywords.join(', ') : productSEO.keywords || ''} />
        
        {/* Open Graph */}
        <meta property="og:title" content={productSEO.title} />
        <meta property="og:description" content={productSEO.description} />
        <meta property="og:image" content={productSEO.ogImage || product.imagePaths[0]} />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.slug}`} />
        <meta property="og:type" content="product" />
        
        {/* Product Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: productTitle,
              description: productData.longDescription || productDescription,
              image: product.imagePaths,
              brand: {
                '@type': 'Brand',
                name: getString('common.siteName')
              },
              offers: {
                '@type': 'Offer',
                price: currentPrice,
                priceCurrency: 'EUR',
                availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                seller: {
                  '@type': 'Organization',
                  name: getString('common.siteName')
                }
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: productReviews.averageRating,
                reviewCount: productReviews.totalReviews,
                bestRating: '5',
                worstRating: '1'
              },
              review: individualReviews
            })
          }}
        />
      </Head>

      <Layout
        categories={categories}
        showFloatingButtons={true}
      >
        {/* Minimal Breadcrumb */}
        <nav className="border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
            <div className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm text-neutral-500 overflow-hidden">
              <Link href="/" className="hover:text-neutral-800 transition-colors flex-shrink-0">
                {getString('navigation.home')}
              </Link>
              <span className="text-neutral-300 flex-shrink-0">/</span>
              {currentCategory ? (
                <>
                  <Link href={`/category/${currentCategory.categoryId}`} className="hover:text-neutral-800 transition-colors truncate">
                    {currentCategory.categoryNameCanonical}
                  </Link>
                  <span className="text-neutral-300 flex-shrink-0">/</span>
                </>
              ) : (
                <>
                  <span className="text-neutral-600 flex-shrink-0">
                    {getString('navigation.products')}
                  </span>
                  <span className="text-neutral-300 flex-shrink-0">/</span>
                </>
              )}
              <span className="text-neutral-800 font-medium truncate">{productTitle}</span>
            </div>
          </div>
        </nav>

        {/* Amazon-Style Urgency Social Proof - Single Line */}
        {(viewersCount > 0 || recentPurchases.length > 0) && (
          <div className="bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 border-b border-orange-200">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2">
              <div className="flex items-center justify-center space-x-3 text-gray-700">
                {viewersCount > 0 && (
                  <div className="flex items-center space-x-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm border border-orange-200">
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-orange-700 text-xs">{viewersCount}</span>
                    <span className="font-medium text-gray-700 text-[10px]">{getString('product.viewersCount')}</span>
                  </div>
                )}
                
                {recentPurchases.length > 0 && (
                  <div className="flex items-center space-x-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm border border-orange-200">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-gray-700 text-[10px]">{getString('product.lastOrderBy')}</span>
                    <span className="font-bold text-green-700 text-xs">{recentPurchases[0]}</span>
                  </div>
                )}
                
                {/* Limited Availability - Inline */}
                <div className="flex items-center space-x-1 bg-red-50 border border-red-200 rounded-full px-2 py-1">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-semibold text-red-700">Begrenzte Verfügbarkeit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Luxury Image Gallery */}
            <div className="space-y-3 lg:space-y-4">
              {/* Main Image with Smart Zoom */}
              <div 
                className="relative aspect-square bg-white rounded-lg lg:rounded-xl overflow-hidden group max-w-md mx-auto lg:max-w-sm cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={(e) => {
                  if (isZoomed) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomPosition({ x, y });
                  }
                }}
              >
                <Image
                  src={product.imagePaths[selectedImageIndex] || '/placeholder-product.jpg'}
                  alt={productTitle}
                  fill
                  className={`object-contain transition-transform duration-300 ${
                    isZoomed ? 'scale-150' : 'group-hover:scale-105'
                  }`}
                  style={{
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  }}
                  priority={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                />
                
                {/* Smart Zoom Indicator */}
                {isZoomed && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div 
                      className="absolute w-20 h-20 border-2 border-white rounded-full shadow-lg bg-white/10"
                      style={{
                        left: `${zoomPosition.x}%`,
                        top: `${zoomPosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  </div>
                )}
                
                {/* Minimal Navigation */}
                {product.imagePaths.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-luxury transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutral-800" />
                    </button>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-luxury transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5 text-neutral-800" />
                    </button>
                  </>
                )}
                
              </div>
              
              {/* Minimal Thumbnail Grid */}
              {product.imagePaths.length > 1 && (
                <div className="grid grid-cols-5 gap-1.5 lg:gap-2 max-w-md mx-auto lg:max-w-sm">
                  {product.imagePaths.slice(0, 5).map((imagePath, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-white rounded-sm lg:rounded-md overflow-hidden border-2 transition-all duration-300 ${
                        selectedImageIndex === index 
                          ? 'border-neutral-900' 
                          : 'border-transparent hover:border-neutral-200'
                      }`}
                    >
                      <Image
                        src={imagePath || '/placeholder-product.jpg'}
                        alt={`${productTitle} - Vue ${index + 1}`}
                        width={60}
                        height={60}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Luxury Product Info */}
            <div className="space-y-3 lg:space-y-4">
              {/* Title and Rating */}
              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-xl lg:text-2xl font-bold text-orange-600 leading-tight tracking-tight">{productTitle}</h1>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(productReviews.averageRating)
                            ? 'text-orange-500 fill-orange-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 font-medium text-sm">
                    <span className="text-orange-600 font-bold text-base">{productReviews.averageRating}</span> • {productReviews.totalReviews} {getString('product.customerReviews')}
                  </span>
                </div>
                
                {/* Stock Status and Trust Signals Row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Stock Status */}
                  {isOutOfStock ? (
                    <div className="inline-flex items-center space-x-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-red-700 text-sm">{getString('product.temporarilyUnavailable')}</span>
                    </div>
                  ) : maxQuantity <= 5 ? (
                    <div className="inline-flex items-center space-x-2 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-orange-700 text-sm">{getString('product.limitedStock')} • {maxQuantity} {getString('product.remaining')}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700 text-sm">{getString('product.inStock')}</span>
                    </div>
                  )}
                  
                  {/* Trust Signals */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg px-2 py-1.5 border border-orange-200 hover:shadow-sm transition-all duration-200">
                      <CreditCard className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">{getString('product.paymentInstallments')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg px-2 py-1.5 border border-orange-200 hover:shadow-sm transition-all duration-200">
                      <Shield className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">{getString('product.secureTransaction')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg px-2 py-1.5 border border-orange-200 hover:shadow-sm transition-all duration-200">
                      <Truck className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">{getString('product.delivery48h')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Pricing */}
              <div className="space-y-4 border-b border-gray-100 pb-6">
                <div className="flex items-baseline space-x-4">
                  <span className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(currentPrice)}
                  </span>
                  {fakeCompareAtPrice && fakeCompareAtPrice > currentPrice && (
                    <div className="space-y-1">
                      <span className="text-lg text-gray-400 line-through font-light">
                        {formatCurrency(fakeCompareAtPrice)}
                      </span>
                      <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">
                        {getString('product.savings')} {formatCurrency(savings)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Product Description */}
              <div className="border-b border-gray-100 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed text-lg font-light">
                    {productDescription}
                  </p>
                </div>
              </div>

              {/* Premium Variations */}
              {product.variations.length > 0 && (
                <div className="space-y-8 border-b border-gray-100 pb-8">
                  {product.variations.map((variation) => (
                    <div key={variation.type} className="space-y-4">
                      <label className="block text-lg font-medium text-gray-900">
                        {variation.type}
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {variation.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleVariationChange(variation.type, option.value)}
                            className={`px-8 py-4 border rounded-2xl font-medium transition-all duration-300 ${
                              selectedVariations[variation.type] === option.value
                                ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                                : 'bg-white text-gray-900 border-gray-200 hover:border-gray-400 hover:shadow-md'
                            }`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {!isOutOfStock && (
                <div className="space-y-6">

                  {/* Premium CTA Buttons */}
                  <div className="space-y-6">
                    <Button
                      onClick={handleBuyOnAmazon}
                      disabled={isAddingToCart}
                      loading={isAddingToCart}
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all duration-300 shadow-md hover:shadow-lg tracking-wide"
                      size="lg"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      <span className="truncate">
                        {isAddingToCart ? getString('product.redirecting') : `${getString('product.buyNow')} ${productTitle}`}
                      </span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Trust Signals section removed */}
            </div>
          </div>

          {/* Elegant Product Details Section */}
          <div className="mt-8 border-t border-neutral-100 pt-8">
            <div className="max-w-4xl mx-auto">
              {/* Amazon-Style Tab Navigation */}
              <div className="border-b border-orange-200 mb-6">
                <nav className="-mb-px flex gap-1 sm:gap-12 overflow-x-auto">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`border-b-2 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'description' 
                        ? 'border-orange-600 text-orange-600' 
                        : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
                    }`}
                  >
                    {getString('product.description')}
                  </button>
                  <button 
                    onClick={() => setActiveTab('specifications')}
                    className={`border-b-2 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'specifications' 
                        ? 'border-orange-600 text-orange-600' 
                        : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
                    }`}
                  >
                    {getString('product.specifications')}
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`border-b-2 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'reviews' 
                        ? 'border-orange-600 text-orange-600' 
                        : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
                    }`}
                  >
                    {getString('product.customerReviews')} ({productReviews.totalReviews})
                  </button>
                  {product?.faq && product.faq.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('faq')}
                      className={`border-b-2 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'faq' 
                          ? 'border-orange-600 text-orange-600' 
                          : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
                      }`}
                    >
                      {getString('product.faq')} ({product.faq.length})
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="prose prose-neutral prose-lg max-w-none">
                  {activeTab === 'description' && (
                    <>
                     {/* Quick Review Section */}
                     {product?.quickReview && (
                       <div className="bg-gray-50 border-l-4 border-teal-600 p-6 mb-8">
                         <div className="flex items-start space-x-2 mb-4">
                           <div className="text-gray-400 text-2xl">"</div>
                           <div className="text-gray-400 text-2xl">"</div>
                           <h3 className="text-teal-600 font-semibold text-lg uppercase tracking-wide">
                             {getString('product.quickReview')}
                           </h3>
                         </div>
                         <div className="text-gray-800 leading-relaxed text-base">
                           {product.quickReview}
                         </div>
                       </div>
                     )}
                     
                     {/* Fallback to original description if no quick review */}
                     {!product?.quickReview && (
                       <div className="text-neutral-700 leading-relaxed mb-8" 
                            dangerouslySetInnerHTML={{ __html: productLongDescription }} />
                     )}
                     
                     {/* Key Features */}
                    {productFeatures.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                        {productFeatures.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-neutral-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'specifications' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-orange-600 mb-3">{getString('product.technicalSpecifications')}</h3>
                    {Object.entries(product?.specifications || {}).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="bg-orange-50 rounded border border-orange-200 p-2">
                            <dt className="font-semibold text-orange-800 text-xs mb-1">{key}</dt>
                            <dd className="text-gray-700 text-xs" dangerouslySetInnerHTML={{ __html: value }}></dd>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">{getString('product.noSpecifications')}</p>
                    )}
                  </div>
                )}

                {activeTab === 'faq' && product?.faq && product.faq.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-orange-600 mb-3">{getString('product.frequentlyAskedQuestions')}</h3>
                    <FAQAccordion faq={product.faq} />
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <Reviews />
                )}
              </div>

              {/* Hero Section Below All Tabs */}
              <section className="relative pt-0 pb-8 md:pb-12 overflow-hidden -mt-8 lg:-mt-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-1">
                    {/* Top Image - Mobile */}
                    <div className="bg-white p-1 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-[300px] overflow-hidden">
                        <Image
                          src="/hero2.png"
                          alt="Professional Massagegeräte 2"
                          width={700}
                          height={525}
                          className="w-full h-full object-cover object-center"
                          style={{ objectPosition: 'center 15%' }}
                          loading="lazy"
                          sizes="100vw"
                        />
                      </div>
                    </div>

                    {/* Orange Background - Mobile */}
                    <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-8 py-6 flex flex-col justify-center items-center rounded-full relative z-10 w-fit mx-auto min-w-[200px] max-w-xs shadow-xl border border-orange-400/20 transform hover:scale-102 transition-all duration-300">
                      {/* Main Headline */}
                      <div className="text-center">
                        <h2 className="text-lg md:text-xl font-bold text-white leading-tight tracking-tight">
                          {getString('product.heroReviews.title')}
                        </h2>
                      </div>
                    </div>

                    {/* Bottom Image - Mobile */}
                    <div className="bg-white p-1 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-[300px] overflow-hidden">
                        <Image
                          src="/hero5.png"
                          alt="Professional Massagegeräte"
                          width={700}
                          height={525}
                          className="w-full h-full object-cover object-center"
                          style={{ objectPosition: 'center 40%' }}
                          loading="lazy"
                          sizes="100vw"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    {/* Background Images */}
                    <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch z-0">
                      {/* Left Background Image */}
                      <div className="bg-white p-2 lg:p-4 flex items-center justify-center">
                        <Image
                          src="/hero2.png"
                          alt="Professional Massagegeräte 2"
                          width={1000}
                          height={750}
                          className="w-auto h-auto max-w-full"
                          loading="lazy"
                          sizes="33vw"
                        />
                      </div>
                      
                      {/* Center Background */}
                      <div className="bg-transparent"></div>
                      
                      {/* Right Background Image */}
                      <div className="bg-white p-2 lg:p-4 flex items-center justify-center">
                        <Image
                          src="/hero5.png"
                          alt="Professional Massagegeräte"
                          width={1000}
                          height={750}
                          className="w-auto h-auto max-w-full"
                          loading="lazy"
                          sizes="33vw"
                        />
                      </div>
                    </div>
                    
                    {/* Foreground Content */}
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch">
                      {/* Left Column - Empty */}
                      <div className="bg-transparent"></div>

                      {/* Middle Column - Orange Background */}
                      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-8 py-8 flex flex-col justify-center items-center rounded-full mx-4 my-16 w-fit mx-auto min-w-[240px] max-w-sm shadow-xl border border-orange-400/20 transform hover:scale-102 transition-all duration-300">
                        {/* Main Headline */}
                        <div className="text-center">
                          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight tracking-tight">
                            {getString('product.heroReviews.title')}
                          </h2>
                        </div>
                      </div>

                      {/* Right Column - Empty */}
                      <div className="bg-transparent"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Review Analysis Section */}
              {product?.reviewAnalysis && (
                <div className="mt-12">
                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Strengths */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-800">
                          {getString('product.reviewAnalysisStrengths')}
                        </h3>
                      </div>
                      <ul className="space-y-4">
                        {product.reviewAnalysis.strengths?.map((strength, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
                            <span className="text-green-800 font-medium leading-relaxed">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-orange-800">
                          {getString('product.reviewAnalysisWeaknesses')}
                        </h3>
                      </div>
                      <ul className="space-y-4">
                        {product.reviewAnalysis.weaknesses?.map((weakness, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-3 flex-shrink-0"></div>
                            <span className="text-orange-800 font-medium leading-relaxed">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Detailed Review */}
                  {product.reviewAnalysis.detailed_review && (
                    <div className="bg-gradient-to-br from-neutral-50 to-gray-50 rounded-2xl p-8 mb-12 border border-neutral-200 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-neutral-600 rounded-full flex items-center justify-center shadow-lg">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900">
                          {getString('product.reviewAnalysisDetailed')}
                        </h3>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-neutral-700 leading-relaxed text-lg">
                          {product.reviewAnalysis.detailed_review}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommendation and Value */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {product.reviewAnalysis.recommendation && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-100 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-orange-800">
                            {getString('product.reviewAnalysisRecommendation')}
                          </h3>
                        </div>
                        <p className="text-orange-800 font-medium leading-relaxed">{product.reviewAnalysis.recommendation}</p>
                      </div>
                    )}
                    {product.reviewAnalysis.value_for_money && (
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-purple-800">
                            {getString('product.reviewAnalysisValue')}
                          </h3>
                        </div>
                        <p className="text-purple-800 font-medium leading-relaxed">{product.reviewAnalysis.value_for_money}</p>
                      </div>
                    )}
                  </div>

                  {/* Amazon-Style Feature Steps */}
                  {product.reviewAnalysis.feature_steps && product.reviewAnalysis.feature_steps.length > 0 && (
                    <div className="mb-12">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4 shadow-lg">
                          <Star className="w-6 h-6 text-white fill-white" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-orange-600 mb-2">
                          {getString('product.whyChoose').replace('{productTitle}', productTitle)}
                        </h3>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                          Entdecken Sie die wichtigsten Funktionen und Vorteile dieses Produkts
                        </p>
                      </div>
                      <div className="space-y-3">
                        {product.reviewAnalysis.feature_steps.map((step, index) => (
                          <FeatureStepCard key={step.step} step={step} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Verdict */}
                  {product.reviewAnalysis.final_verdict && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-800">
                          {getString('product.reviewAnalysisFinalVerdict')}
                        </h3>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        <div className="text-emerald-800 leading-relaxed text-lg">
                          {typeof product.reviewAnalysis.final_verdict === 'string' ? (
                            <div className="whitespace-pre-line">
                              {product.reviewAnalysis.final_verdict}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {product.reviewAnalysis.final_verdict?.overall_assessment && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.overallAssessment')}</h4>
                                  <p>{product.reviewAnalysis.final_verdict.overall_assessment}</p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.key_technical_specifications && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.technicalSpecifications')}</h4>
                                  <p dangerouslySetInnerHTML={{ __html: product.reviewAnalysis.final_verdict.key_technical_specifications }}></p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.points_to_consider && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.pointsToConsider')}</h4>
                                  <p dangerouslySetInnerHTML={{ __html: product.reviewAnalysis.final_verdict.points_to_consider }}></p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.final_recommendation && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.finalRecommendation')}</h4>
                                  <p dangerouslySetInnerHTML={{ __html: product.reviewAnalysis.final_verdict.final_recommendation }}></p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.target_audience && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.targetAudience')}</h4>
                                  <p dangerouslySetInnerHTML={{ __html: product.reviewAnalysis.final_verdict.target_audience }}></p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Summary */}
              <div className="mt-16 bg-neutral-50 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                      <span className="text-5xl font-light text-neutral-900">
                        {productReviews.averageRating.toFixed(1)}
                      </span>
                      <div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => {
                            const starValue = i + 1;
                            const rating = productReviews.averageRating;
                            
                            if (starValue <= Math.floor(rating)) {
                              // Full star
                              return (
                                <Star
                                  key={i}
                                  className="w-5 h-5 text-yellow-400 fill-yellow-400"
                                />
                              );
                            } else if (starValue === Math.ceil(rating) && rating % 1 !== 0) {
                              // Partial star
                              const fillPercentage = (rating % 1) * 100;
                              return (
                                <div key={i} className="relative w-5 h-5">
                                  <Star className="w-5 h-5 text-gray-300" />
                                  <div 
                                    className="absolute top-0 left-0 overflow-hidden"
                                    style={{ width: `${fillPercentage}%` }}
                                  >
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                  </div>
                                </div>
                              );
                            } else {
                              // Empty star
                              return (
                                <Star
                                  key={i}
                                  className="w-5 h-5 text-gray-300"
                                />
                              );
                            }
                          })}
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">
                          {getString('product.basedOnReviews')} {productReviews.totalReviews} {getString('product.reviews')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-neutral-600">
                      <ThumbsUp className="w-4 h-4" />
                      <span>94% {getString('product.clientsRecommend')}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = productReviews[`${['', 'one', 'two', 'three', 'four', 'five'][stars]}Stars` as keyof typeof productReviews] as number;
                      const percentage = productReviews.totalReviews > 0 ? (count / productReviews.totalReviews) * 100 : 0;
                      
                      return (
                        <div key={stars} className="flex items-center space-x-3">
                          <span className="text-sm text-neutral-600 w-8">{stars}★</span>
                          <div className="flex-1 bg-neutral-200 rounded-full h-1.5">
                            <div
                              className="bg-neutral-900 h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-neutral-600 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product MDX Content */}
          {productContent && (
            <div className="mt-24 border-t border-neutral-100 pt-16">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg prose-neutral max-w-none">
                  <MDXRemote {...productContent.content} />
                </div>
              </div>
            </div>
          )}

          {/* Related Products */}
          <div className="mt-24 border-t border-neutral-100 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-neutral-900 mb-4">
                {getString('product.alsoLike')}
              </h2>
              <p className="text-neutral-600">{getString('product.alsoLikeSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {relatedProducts.length > 0 ? (
                relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.slug}
                    product={relatedProduct}
                    onAddToCart={() => {
                      // Redirect to Amazon for the specific related product
                      window.open(relatedProduct.amazonUrl, '_blank');
                    }}
                  />
                ))
              ) : (
                <div className="text-center text-neutral-500 col-span-full py-12">
                  {getString('product.similarProductsLoading')}
                </div>
              )}
            </div>
          </div>

          {/* Reviews Content */}
          <div className="mt-24 border-t border-neutral-100 pt-16">
            <Reviews limit={8} />
          </div>
        </div>


        {/* Floating Action Buttons */}
        {/* The FloatingButtons component is now integrated into the Layout's floating buttons props */}
      </Layout>
      {product && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 shadow-2xl p-0 sm:p-4 animate-slide-up">
          <div className="max-w-6xl mx-auto">
            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex items-center justify-center">
              {/* Shop vs Amazon Comparison - Horizontal */}
              <div className="flex-shrink-0">
                <div className="flex space-x-4 items-center">
                  {/* Amazon Option - Highlighted as cheaper */}
                  <a
                    href={product.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 p-4 rounded-xl shadow-lg border border-orange-200">
                      <div className="flex items-center justify-between min-w-[400px]">
                        {/* Column 1: Amazon Logo */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                            <svg className="w-8 h-8" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                              <g fill="none" fillRule="evenodd">
                                <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fill="#FF9900" fillRule="nonzero"/>
                                <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095" fill="#000000"/>
                              </g>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Column 2: Amazon Text & Current Price */}
                        <div className="flex-1 px-4">
                          <div className="font-bold text-gray-900 text-lg">Amazon</div>
                          <div className="text-2xl font-bold text-gray-900">{formatCurrency(product.basePrice)}</div>
                        </div>
                        
                        {/* Column 3: Strikethrough Price & 24h Timer */}
                        <div className="flex-shrink-0 text-right">
                          {product?.onSale && (
                            <div className="flex flex-col items-end space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.basePrice * 1.43)}
                                </span>
                                <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-lg">
                                  -30%
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-red-600 font-medium">{getString('product.offer24h')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Column 4: Buy Button */}
                        <div className="flex-shrink-0 ml-4">
                          <div className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-lg transition-colors duration-200 group-hover:scale-105 text-lg whitespace-nowrap">
                            {getString('amazon.buyOnAmazon')}
                          </div>
                        </div>
                  </div>
                </div>
              </a>
                  
                  {/* Our Shop Option - More expensive */}
                  <div className="p-3 bg-gray-50 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between min-w-[350px]">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
                          <img src={product.imagePaths?.[0] || '/logo.png'} alt="Our Shop" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-700 text-base">{getString('product.ourShop')}</div>
                          <div className="text-lg font-bold text-gray-600">{formatCurrency(product.basePrice * 1.3)}</div>
                        </div>
                      </div>
                      <div className="bg-gray-400 text-white font-bold px-4 py-2 rounded-lg cursor-not-allowed opacity-50 text-sm">
                        {getString('product.outOfStock')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile: Shop vs Amazon Comparison */}
            <div className="sm:hidden w-full px-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Amazon Option - Highlighted as cheaper */}
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 p-3 border-b border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {/* Amazon Logo */}
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="2.167 .438 251.038 259.969" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" fillRule="evenodd">
                              <path d="m221.503 210.324c-105.235 50.083-170.545 8.18-212.352-17.271-2.587-1.604-6.984.375-3.169 4.757 13.928 16.888 59.573 57.593 119.153 57.593 59.621 0 95.09-32.532 99.527-38.207 4.407-5.627 1.294-8.731-3.16-6.872zm29.555-16.322c-2.826-3.68-17.184-4.366-26.22-3.256-9.05 1.078-22.634 6.609-21.453 9.93.606 1.244 1.843.686 8.06.127 6.234-.622 23.698-2.826 27.337 1.931 3.656 4.79-5.57 27.608-7.255 31.288-1.628 3.68.622 4.629 3.68 2.178 3.016-2.45 8.476-8.795 12.14-17.774 3.639-9.028 5.858-21.622 3.71-24.424z" fill="#FF9900" fillRule="nonzero"/>
                              <path d="m150.744 108.13c0 13.141.332 24.1-6.31 35.77-5.361 9.489-13.853 15.324-23.341 15.324-12.952 0-20.495-9.868-20.495-24.432 0-28.75 25.76-33.968 50.146-33.968zm34.015 82.216c-2.23 1.992-5.456 2.135-7.97.806-11.196-9.298-13.189-13.615-19.356-22.487-18.502 18.882-31.596 24.527-55.601 24.527-28.37 0-50.478-17.506-50.478-52.565 0-27.373 14.85-46.018 35.96-55.126 18.313-8.066 43.884-9.489 63.43-11.718v-4.365c0-8.018.616-17.506-4.08-24.432-4.128-6.215-12.003-8.777-18.93-8.777-12.856 0-24.337 6.594-27.136 20.257-.57 3.037-2.799 6.026-5.835 6.168l-32.735-3.51c-2.751-.618-5.787-2.847-5.028-7.07 7.543-39.66 43.36-51.616 75.43-51.616 16.415 0 37.858 4.365 50.81 16.795 16.415 15.323 14.849 35.77 14.849 58.02v52.565c0 15.798 6.547 22.724 12.714 31.264 2.182 3.036 2.657 6.69-.095 8.966-6.879 5.74-19.119 16.415-25.855 22.393l-.095-.095" fill="#000000"/>
                            </g>
                          </svg>
                    </div>
                    
                        <div>
                          <div className="font-bold text-gray-900 text-sm">Amazon</div>
                          <div className="flex items-center space-x-1">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-gray-900">{formatCurrency(product.basePrice)}</span>
                              {product?.onSale && (
                                <div className="flex items-center space-x-1 mt-0.5">
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatCurrency(product.basePrice * 1.43)}
                                  </span>
                                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                    -30%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-600 font-medium">{getString('product.offer24h')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg transition-colors duration-200 group-hover:scale-105 text-base">
                        {getString('amazon.buyOnAmazon')}
                      </div>
                  </div>
                </div>
              </a>
                
                {/* Our Shop Option - More expensive */}
                <div className="p-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
                        <img src={product.imagePaths?.[0] || '/logo.png'} alt="Our Shop" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 text-sm">{getString('product.ourShop')}</div>
                        <div className="text-base font-bold text-gray-600">{formatCurrency(product.basePrice * 1.3)}</div>
                      </div>
                    </div>
                    <div className="bg-gray-400 text-white font-bold px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50 text-xs">
                      {getString('product.outOfStock')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailPage; 