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

// Feature Step Card Component
const FeatureStepCard: React.FC<{ step: any }> = ({ step }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center p-6">
        {/* Step Number */}
        <div className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
          <span className="text-sm font-semibold text-gray-900">{step.step}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
            {step.title}
          </h4>
          <p className="text-gray-700 text-sm leading-relaxed">
            {step.description}
          </p>
          
          {/* Expanded Content */}
          {isExpanded && step.expanded_content && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {step.expanded_content}
              </div>
            </div>
          )}
        </div>
        
        {/* Expand/Collapse Button */}
        {step.expanded_content && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 p-2 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <Minus className="w-5 h-5 text-gray-600" />
            ) : (
              <Plus className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>
      
      {/* Connecting Line */}
      <div className="flex justify-center">
        <div className="w-px h-4 bg-gray-200"></div>
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
  const [showImageModal, setShowImageModal] = useState(false);
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
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-3 text-sm text-neutral-500">
              <Link href="/" className="hover:text-neutral-800 transition-colors">
                {getString('navigation.home')}
              </Link>
              <span className="text-neutral-300">/</span>
              {currentCategory ? (
                <>
                  <Link href={`/category/${currentCategory.categoryId}`} className="hover:text-neutral-800 transition-colors">
                    {currentCategory.categoryNameCanonical}
                  </Link>
                  <span className="text-neutral-300">/</span>
                </>
              ) : (
                <>
                  <Link href="/categories" className="hover:text-neutral-800 transition-colors">
                    {getString('navigation.products')}
                  </Link>
                  <span className="text-neutral-300">/</span>
                </>
              )}
              <span className="text-neutral-800 font-medium">{productTitle}</span>
            </div>
          </div>
        </nav>

        {/* Minimal Social Proof */}
        {(viewersCount > 0 || recentPurchases.length > 0) && (
          <div className="bg-gray-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
              <div className="flex items-center justify-center text-sm">
                <div className="flex items-center space-x-8 text-gray-600">
                  {viewersCount > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="font-medium">{viewersCount} {getString('product.viewersCount')}</span>
                    </div>
                  )}
                  
                  {recentPurchases.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span>{getString('product.lastOrderBy')}</span>
                      <span className="font-medium text-gray-900">{recentPurchases[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Luxury Image Gallery */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden group">
                <Image
                  src={product.imagePaths[selectedImageIndex] || '/placeholder-product.jpg'}
                  alt={productTitle}
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                
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
                
                {/* Zoom Icon */}
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-luxury transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <ZoomIn className="w-4 h-4 text-neutral-800" />
                </button>

                {/* Minimal Sale Badge */}
                {product.onSale && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      -{product.salePercentage}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* Minimal Thumbnail Grid */}
              {product.imagePaths.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {product.imagePaths.slice(0, 5).map((imagePath, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        selectedImageIndex === index 
                          ? 'border-neutral-900' 
                          : 'border-transparent hover:border-neutral-200'
                      }`}
                    >
                      <Image
                        src={imagePath || '/placeholder-product.jpg'}
                        alt={`${productTitle} - Vue ${index + 1}`}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Luxury Product Info */}
            <div className="space-y-10">
              {/* Title and Rating */}
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-light text-gray-900 leading-tight tracking-tight">{productTitle}</h1>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(productReviews.averageRating)
                            ? 'text-gray-900 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 font-medium">
                    {productReviews.averageRating} • {productReviews.totalReviews} {getString('product.customerReviews')}
                  </span>
                </div>
                
                {/* Minimal Stock Status */}
                {isOutOfStock ? (
                  <div className="inline-flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="font-medium">{getString('product.temporarilyUnavailable')}</span>
                  </div>
                ) : maxQuantity <= 5 ? (
                  <div className="inline-flex items-center space-x-3 text-gray-900">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="font-medium">{getString('product.limitedStock')} • {maxQuantity} {getString('product.remaining')}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-3 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{getString('product.inStock')}</span>
                  </div>
                )}
              </div>

              {/* Premium Pricing */}
              <div className="space-y-6 border-b border-gray-100 pb-8">
                <div className="flex items-baseline space-x-6">
                  <span className="text-5xl lg:text-6xl font-light text-gray-900 tracking-tight">
                    {formatCurrency(currentPrice)}
                  </span>
                  {fakeCompareAtPrice && fakeCompareAtPrice > currentPrice && (
                    <div className="space-y-2">
                      <span className="text-2xl text-gray-400 line-through font-light">
                        {formatCurrency(fakeCompareAtPrice)}
                      </span>
                      <div className="text-sm text-green-700 font-medium">
                        {getString('product.savings')} {formatCurrency(savings)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Compact Trust Signals */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{getString('product.paymentInstallments')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{getString('product.secureTransaction')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                    <Truck className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">{getString('product.delivery48h')}</span>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="border-b border-gray-100 pb-8">
                <p className="text-gray-700 leading-relaxed text-xl font-light">
                  {productDescription}
                </p>
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
                  {/* Urgency Text */}
                  <div className="text-center">
                    <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm animate-pulse shadow-lg">
                      {getString('urgency.cartDiscount')}
                    </div>
                  </div>

                  {/* Premium CTA Buttons */}
                  <div className="space-y-6">
                    <Button
                      onClick={handleBuyOnAmazon}
                      disabled={isAddingToCart}
                      loading={isAddingToCart}
                      className="w-full bg-orange-600 text-white hover:bg-orange-700 py-5 text-lg font-medium rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl tracking-wide"
                      size="lg"
                    >
                      <ShoppingCart className="w-5 h-5 mr-3" />
                      {isAddingToCart ? getString('product.redirecting') : `${getString('product.buyOnAmazon')} ${productTitle}`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Trust Signals section removed */}
            </div>
          </div>

          {/* Elegant Product Details Section */}
          <div className="mt-24 border-t border-neutral-100 pt-16">
            <div className="max-w-4xl mx-auto">
              {/* Tab Navigation */}
              <div className="border-b border-neutral-100 mb-12">
                <nav className="-mb-px flex space-x-12">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'description' 
                        ? 'border-neutral-900 text-neutral-900' 
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {getString('product.description')}
                  </button>
                  <button 
                    onClick={() => setActiveTab('specifications')}
                    className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'specifications' 
                        ? 'border-neutral-900 text-neutral-900' 
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {getString('product.specifications')}
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'reviews' 
                        ? 'border-neutral-900 text-neutral-900' 
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {getString('product.customerReviews')} ({productReviews.totalReviews})
                  </button>
                  {product?.faq && product.faq.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('faq')}
                      className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'faq' 
                          ? 'border-neutral-900 text-neutral-900' 
                          : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
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
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-6">{getString('product.technicalSpecifications')}</h3>
                    {Object.entries(product?.specifications || {}).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="border-b border-neutral-100 pb-4">
                            <dt className="font-medium text-neutral-900 mb-2">{key}</dt>
                            <dd className="text-neutral-700">{value}</dd>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-600">{getString('product.noSpecifications')}</p>
                    )}
                  </div>
                )}

                {activeTab === 'faq' && product?.faq && product.faq.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-6">{getString('product.frequentlyAskedQuestions')}</h3>
                    <div className="space-y-6">
                      {product.faq.map((item, index) => (
                        <div key={index} className="border-b border-neutral-100 pb-6">
                          <h4 className="font-medium text-neutral-900 mb-3">{item.question || item.q}</h4>
                          <p className="text-neutral-700 leading-relaxed">{item.answer || item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <Reviews />
                )}
              </div>

              {/* Review Analysis Section */}
              {product?.reviewAnalysis && (
                <div className="mt-20">
                  <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                      <Star className="w-8 h-8 text-white fill-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-neutral-900 mb-6">
                      {getString('product.reviewAnalysis')} {productTitle}
                    </h2>
                    <div className="flex items-center justify-center space-x-6 mb-8">
                      <div className="text-center">
                        <span className="text-6xl font-light text-neutral-900 block">
                          {product?.reviewAnalysis?.overall_rating?.toFixed(1) || '4.0'}
                        </span>
                        <div className="flex items-center justify-center mt-2">
                          {[...Array(5)].map((_, i) => {
                            const rating = product?.reviewAnalysis?.overall_rating || 4.0;
                            const starValue = i + 1;
                            
                            if (starValue <= Math.floor(rating)) {
                              return (
                                <Star
                                  key={i}
                                  className="w-6 h-6 text-yellow-400 fill-yellow-400 mx-0.5"
                                />
                              );
                            } else if (starValue === Math.ceil(rating) && rating % 1 !== 0) {
                              const fillPercentage = (rating % 1) * 100;
                              return (
                                <div key={i} className="relative w-6 h-6 mx-0.5">
                                  <Star className="w-6 h-6 text-gray-300" />
                                  <div 
                                    className="absolute top-0 left-0 overflow-hidden"
                                    style={{ width: `${fillPercentage}%` }}
                                  >
                                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <Star
                                  key={i}
                                  className="w-6 h-6 text-gray-300 mx-0.5"
                                />
                              );
                            }
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="max-w-3xl mx-auto">
                      <p className="text-xl text-neutral-700 font-medium leading-relaxed">
                        {product.reviewAnalysis.summary || getString('product.reviewAnalysisSummary')}
                      </p>
                    </div>
                  </div>

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
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-blue-800">
                            {getString('product.reviewAnalysisRecommendation')}
                          </h3>
                        </div>
                        <p className="text-blue-800 font-medium leading-relaxed">{product.reviewAnalysis.recommendation}</p>
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

                  {/* Feature Steps */}
                  {product.reviewAnalysis.feature_steps && product.reviewAnalysis.feature_steps.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                        {getString('product.whyChoose').replace('{productTitle}', productTitle)}
                      </h3>
                      <div className="space-y-4">
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
                                  <p>{product.reviewAnalysis.final_verdict.key_technical_specifications}</p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.points_to_consider && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.pointsToConsider')}</h4>
                                  <p>{product.reviewAnalysis.final_verdict.points_to_consider}</p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.final_recommendation && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.finalRecommendation')}</h4>
                                  <p>{product.reviewAnalysis.final_verdict.final_recommendation}</p>
                                </div>
                              )}
                              {product.reviewAnalysis.final_verdict?.target_audience && (
                                <div>
                                  <h4 className="font-semibold mb-2">{getString('product.targetAudience')}</h4>
                                  <p>{product.reviewAnalysis.final_verdict.target_audience}</p>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.length > 0 ? (
                relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.slug}
                    product={relatedProduct}
                  />
                ))
              ) : (
                <div className="text-center text-neutral-500 col-span-full py-12">
                  {getString('product.similarProductsLoading')}
                </div>
              )}
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="mt-24 border-t border-neutral-100 pt-16">
            <Reviews limit={8} />
          </div>
        </div>

        {/* Elegant Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="relative max-w-5xl w-full">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-neutral-300 transition-colors z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="bg-white rounded-2xl overflow-hidden shadow-premium">
                <Image
                  src={product.imagePaths[selectedImageIndex] || '/placeholder-product.jpg'}
                  alt={productTitle}
                  width={1000}
                  height={1000}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        {/* The FloatingButtons component is now integrated into the Layout's floating buttons props */}
      </Layout>
      {product && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 shadow-2xl p-4 animate-slide-up">
          <div className="max-w-6xl mx-auto">
            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex items-center justify-between space-x-6">
              {/* Left side: Discount and countdown */}
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white py-3 px-6 rounded-xl relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  
                  <div className="relative z-10 flex items-center space-x-4">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="font-bold text-xl">-35%</span>
                    </div>
                    
                    <div className="text-sm font-medium">
                      {getString('product.limitedOffer')}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="opacity-90">{getString('product.expiresIn')}:</span>
                      <div className="flex items-center space-x-1 font-mono bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="bg-red-700 px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center">
                          {countdown.minutes.toString().padStart(2, '0')}
                        </span>
                        <span className="text-red-200">:</span>
                        <span className="bg-red-700 px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center">
                          {countdown.seconds.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side: Buy button */}
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-xl relative overflow-hidden">
                  {/* Button background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  
                  <div className="relative z-10 flex items-center space-x-3">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-lg">
                      {getString('product.buyOnAmazon')} {productTitle}
                    </span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </a>
            </div>
            
            {/* Mobile: Vertical layout (unchanged) */}
            <div className="sm:hidden max-w-lg mx-auto">
              {/* Discount Banner with Gradient - Clickable */}
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block group cursor-pointer"
              >
                <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white text-center py-3 px-6 rounded-t-xl relative overflow-hidden transition-all duration-300 group-hover:from-red-500 group-hover:via-red-400 group-hover:to-orange-400">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  
                  <div className="relative z-10 flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="font-bold text-xl">-35%</span>
                      </div>
                      <div className="text-sm font-medium">
                        {getString('product.limitedOffer')}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="opacity-90">{getString('product.expiresIn')}:</span>
                      <div className="flex items-center space-x-1 font-mono bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="bg-red-700 px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center">
                          {countdown.minutes.toString().padStart(2, '0')}
                        </span>
                        <span className="text-red-200">:</span>
                        <span className="bg-red-700 px-2 py-1 rounded text-sm font-bold min-w-[24px] text-center">
                          {countdown.seconds.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
              
              {/* Urgency Text */}
              <div className="text-center mb-4">
                <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm animate-pulse shadow-lg">
                  {getString('urgency.cartDiscount')}
                </div>
              </div>

              {/* Buy Button with Enhanced Design */}
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-b-xl transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-xl relative overflow-hidden">
                  {/* Button background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  
                  <div className="relative z-10 flex items-center justify-center space-x-3">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-lg">
                      {getString('product.buyOnAmazon')} {productTitle}
                    </span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailPage; 