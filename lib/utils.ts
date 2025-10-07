import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { siteConfig, getDynamicString } from './config'

// Import localized strings from common.json (consolidated file)
import commonStrings from '../locales/common.json'

// Use the consolidated strings object
const allStrings = commonStrings;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

// Generate individual review snippets for structured data
export const generateProductReviews = (productSlug: string, productTitle: string, count: number = 5) => {
  const seed = productSlug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = (n: number) => (Math.sin(seed + n) * 10000) % 1;
  
  // Import review data from reviews.json
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reviewsData = require('../locales/reviews.json');
  
  // Use existing reviews if available, otherwise use fallback data
  const reviewerNames = reviewsData.reviewerNames || [
    "María D.", "José M.", "Carmen L.", "Antonio R.", "Isabel C.", 
    "Pedro B.", "Ana V.", "Miguel L.", "Pilar P.", "Francisco D.",
    "Sofía M.", "Carlos R.", "Natalia B.", "Alejandro C.", "Verónica T.",
    "Daniel G.", "Marta H.", "Claudio J.", "Monica F.", "Bernardo K."
  ];
  
  const reviewTemplates = reviewsData.reviewTemplates || [
    "¡Excelente {productTitle}! Lo recomiendo encarecidamente.",
    "Muy satisfecho con este {productTitle}. Relación calidad-precio imbatible.",
    "Súper {productTitle}, fácil de usar y eficaz.",
    "Perfecto para mi familia. Este {productTitle} cumple todas nuestras expectativas.",
    "Buena {productTitle} en general. Estoy contento con mi compra.",
    "Después de varios meses de uso, sigo igual de satisfecho con este {productTitle}.",
    "Diseño moderno y funcionalidades prácticas. ¡Este {productTitle} es genial!",
    "Entrega rápida y producto conforme. Este {productTitle} es de calidad.",
    "Recomiendo este {productTitle} sin dudarlo. ¡Excelente elección!",
    "Muy buena {productTitle}, fácil de limpiar y eficiente."
  ];
  
  const reviews = [];
  
  for (let i = 0; i < count; i++) {
    const nameIndex = Math.floor(Math.abs(rng(i * 3)) * reviewerNames.length);
    const templateIndex = Math.floor(Math.abs(rng(i * 3 + 1)) * reviewTemplates.length);
    const rating = Math.floor(Math.abs(rng(i * 3 + 2)) * 2) + 4; // 4 or 5 stars mostly
    
    // Generate date in the last 6 months
    const daysAgo = Math.floor(Math.abs(rng(i * 3 + 3)) * 180);
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);
    
    // Replace productTitle in template
    const reviewBody = reviewTemplates[templateIndex].replace(/\{productTitle\}/g, productTitle);
    
    reviews.push({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": reviewerNames[nameIndex]
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rating,
        "bestRating": 5
      },
      "reviewBody": reviewBody,
      "datePublished": reviewDate.toISOString().split('T')[0]
    });
  }
  
  return reviews;
}; 