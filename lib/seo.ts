import { Product, Category, SiteConfig } from './types';
import { generateProductReviewSnippet, generateProductReviews } from './utils';
import siteConfigData from '../config/site-config.json';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  structuredData?: object;
}

// Get site name from environment variable with fallback
const getSiteName = () => {
  return process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || siteConfigData.site.name;
};

export const generateProductSEO = (product: Product, siteConfig?: SiteConfig): SEOProps => {
  const config = siteConfig || siteConfigData;
  const siteName = getSiteName();
  const title = product.seo.title || `${product.title} | ${siteName}`;
  const description = product.seo.description || product.shortDescription;
  const canonical = `${config.site.url}/product/${product.slug}`;
  const ogImage = product.seo.ogImage || product.imagePaths[0];

  // Generate review snippet for this product
  const reviewSnippet = generateProductReviewSnippet(product.slug, product.title);
  const individualReviews = generateProductReviews(product.slug, product.title, 5);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.shortDescription,
    "image": product.imagePaths,
    "sku": product.productId.toString(),
    "brand": {
      "@type": "Brand",
      "name": siteName
    },
    "offers": {
      "@type": "Offer",
      "price": product.basePrice.toString(),
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": siteName
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviewSnippet.averageRating.toString(),
      "reviewCount": reviewSnippet.reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": individualReviews
  };

  return {
    title,
    description,
    keywords: product.seo.keywords,
    canonical,
    ogImage,
    ogType: 'product',
    structuredData
  };
};

export const generateCategorySEO = (category: Category, siteConfig?: SiteConfig): SEOProps => {
  const config = siteConfig || siteConfigData;
  const siteName = getSiteName();
  const title = category.seo?.title || `${category.categoryNameCanonical} | ${siteName}`;
  const description = category.seo?.description || category.description || `Découvrez la catégorie ${category.categoryNameCanonical}`;
  const canonical = `${config.site.url}/category/${category.slug}`;
  const ogImage = '/default-category.jpg';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.categoryNameCanonical,
    "description": category.description,
    "url": canonical
  };

  return {
    title,
    description,
    keywords: category.seo?.keywords || [],
    canonical,
    ogImage,
    ogType: 'website',
    structuredData
  };
};

export const generateHomepageSEO = (siteConfig?: SiteConfig): SEOProps => {
  const config = siteConfig || siteConfigData;
  const siteName = getSiteName();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "description": config.site.description,
    "url": config.site.url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${config.site.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return {
    title: config.seo.defaultTitle,
    description: config.seo.defaultDescription,
    keywords: config.seo.keywords,
    canonical: config.site.url,
    ogImage: config.seo.ogImage,
    ogType: 'website',
    structuredData
  };
};

export const generateBreadcrumbStructuredData = (breadcrumbs: { name: string; url: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(price);
};

export const calculateSalePrice = (originalPrice: number, salePercentage: number): number => {
  return originalPrice * (1 - salePercentage / 100);
};

export const isLowStock = (stock: number, threshold: number): boolean => {
  return stock <= threshold && stock > 0;
};

export const getStockStatus = (stock: number, threshold: number): 'in-stock' | 'low-stock' | 'out-of-stock' => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= threshold) return 'low-stock';
  return 'in-stock';
}; 