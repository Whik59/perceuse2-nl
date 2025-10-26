import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { siteConfig, getDynamicString } from './config'

// Import localized strings from both common.json (product-specific) and general.json (generic)
import commonStrings from '../locales/common.json'
import generalStrings from '../locales/general.json'

// Merge both string objects, with common taking precedence over general for overlapping keys
// We need to do a deep merge to properly combine nested objects
const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

const allStrings = deepMerge(generalStrings, commonStrings);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert product slug to readable title format
 * @param slug - The product slug (e.g., 'cecotec-freidora-de-aire-de-55l-air-fryer-cecofry')
 * @returns Readable title (e.g., 'Cecotec Freidora de Aire de 5.5L Air Fryer Cecofry')
 */
export function slugToReadableTitle(slug: string): string {
  // First decode URL-encoded characters (like %C3%9F for ß)
  const decodedSlug = decodeURIComponent(slug);
  
  return decodedSlug
    .split('-')
    .map(word => {
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\b(\d+)l\b/gi, '$1L') // Convert "55l" to "5.5L" format
    .replace(/\b(\d+)(\d)l\b/gi, '$1.$2L'); // Convert "55l" to "5.5L" format
}

/**
 * Get localized string by key with dynamic placeholder replacement
 * @param key - The key in the strings object (e.g., 'common.home')
 * @param replacements - Optional custom replacements for placeholders
 * @returns The localized string with placeholders replaced
 */
export function getString(key: string, replacements: Record<string, string> = {}): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = allStrings;
  
  // Navigate through the nested object
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key; // Return the key if translation is not found
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}, got:`, typeof value);
    return key;
  }
  
  // Apply dynamic string replacement first (for environment variables)
  let result = getDynamicString(value, replacements);
  
  // Then apply any additional custom replacements
  Object.entries(replacements).forEach(([placeholder, replacement]) => {
    const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
    result = result.replace(regex, replacement);
  });
  
  return result;
}

/**
 * Format currency value
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'EUR')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date for Spanish locale
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Get site configuration values
 * @returns Site configuration object
 */
export function getSiteConfig() {
  return siteConfig;
}

/**
 * Generate SEO-friendly slug from text
 * @param text - The text to convert to slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Truncate text to specified length
 * @param text - The text to truncate
 * @param length - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

export const generateStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const formatPhoneNumber = (phone: string): string => {
  // Simple Spanish phone number formatting
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const isClient = typeof window !== 'undefined';

/**
 * Get localized site configuration
 * @returns Site configuration object with localized strings
 */
export function getLocalizedSiteConfig() {
  return {
    site: {
      name: getString('siteConfig.site.name'),
      description: getString('siteConfig.site.description'),
      url: getString('siteConfig.site.url'),
      logo: getString('siteConfig.site.logo'),
      favicon: getString('siteConfig.site.favicon')
    },
    seo: {
      defaultTitle: getString('siteConfig.seo.defaultTitle'),
      titleTemplate: getString('siteConfig.seo.titleTemplate'),
      defaultDescription: getString('siteConfig.seo.defaultDescription'),
      keywords: allStrings.siteConfig?.seo?.keywords || [],
      ogImage: getString('siteConfig.seo.ogImage')
    },
    business: {
      email: getString('siteConfig.business.email'),
      phone: getString('siteConfig.business.phone'),
      address: getString('siteConfig.business.address'),
      socialMedia: {
        facebook: getString('siteConfig.business.socialMedia.facebook'),
        instagram: getString('siteConfig.business.socialMedia.instagram'),
        twitter: getString('siteConfig.business.socialMedia.twitter')
      }
    },
    affiliate: {
      amazonTag: getString('siteConfig.affiliate.amazonTag'),
      disclaimer: getString('siteConfig.affiliate.disclaimer')
    },
    features: {
      expertReviews: {
        enabled: allStrings.siteConfig?.features?.expertReviews?.enabled || true,
        message: getString('siteConfig.features.expertReviews.message')
      },
      priceComparison: {
        enabled: allStrings.siteConfig?.features?.priceComparison?.enabled || true,
        message: getString('siteConfig.features.priceComparison.message')
      },
      buyingGuides: {
        enabled: allStrings.siteConfig?.features?.buyingGuides?.enabled || true,
        message: getString('siteConfig.features.buyingGuides.message')
      },
      freeShipping: {
        enabled: true,
        threshold: 50,
        message: 'Livraison gratuite'
      },
      returns: {
        enabled: true,
        days: 30,
        message: 'Retours gratuits'
      },
      warranty: {
        enabled: true,
        period: '2 ans',
        message: 'Garantie 2 ans'
      }
    },
    promotions: {
      welcomeDiscount: {
        enabled: true,
        code: 'WELCOME10',
        percentage: 10,
        message: '10% de réduction'
      }
    },
    payment: {
      stripe: {
        enabled: false,
        publicKey: ''
      },
      paypal: {
        enabled: false,
        clientId: ''
      }
    },
    shipping: {
      zones: []
    }
  };
} 

/**
 * Generate consistent fake ratings for products based on their slug
 * This ensures the same product always has the same rating across the site
 */
export const generateProductRating = (productSlug: string) => {
  // Create a simple hash from the product slug
  let hash = 0;
  for (let i = 0; i < productSlug.length; i++) {
    const char = productSlug.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive number
  const seed = Math.abs(hash);
  
  // Generate rating between 4.3 and 4.9
  const rating = 4.3 + ((seed % 60) / 100); // This gives us 4.3 to 4.89
  const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal place
  
  // Generate review count between 8 and 22
  const reviewCount = 8 + (seed % 15); // This gives us 8 to 22
  
  return {
    rating: Math.min(4.9, roundedRating), // Ensure max is 4.9
    reviewCount,
    percentage: Math.round((roundedRating / 5) * 100) // For percentage display
  };
};

/**
 * Render star rating component (returns JSX-like object for flexibility)
 */
export const getStarRating = (rating: number, maxStars: number = 5) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  return {
    fullStars,
    hasHalfStar,
    emptyStars,
    rating
  };
}; 

// Review snippet generation for SERP
export const generateProductReviewSnippet = (productSlug: string, productTitle: string) => {
  // Create a deterministic seed from the product slug
  const seed = productSlug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use the seed to create consistent but varied data
  const rng = (n: number) => (Math.sin(seed + n) * 10000) % 1;
  
  // Generate review count between 20-50
  const reviewCount = Math.floor(Math.abs(rng(1)) * 31) + 20; // 20-50 reviews
  
  // Generate rating between 4.5-4.9 (mostly high ratings for quality products)
  const rating = 4.5 + Math.abs(rng(2)) * 0.4; // 4.5-4.9 range
  const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal
  
  return {
    averageRating: roundedRating,
    reviewCount,
    displayText: `${roundedRating}/5 ★ (${reviewCount} opiniones)`,
    stars: Math.round(roundedRating) // For display purposes
  };
};
