export interface Product {
  productId: number;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  categoryIds: number[];
  basePrice: number;
  compareAtPrice?: number;
  onSale?: boolean;
  salePercentage?: number;
  variations: ProductVariation[];
  imagePaths: string[];
  features: string[];
  specifications: Record<string, string>;
  seo: SEOData;
  reviews: ReviewsData;
  tags: string[];
  relatedProducts?: number[];
  crossSellProducts?: number[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Amazon affiliate fields
  amazonUrl: string;
  amazonASIN: string;
  originalAmazonTitle?: string;
  amazonPrice?: number;
  amazonRating?: number;
  amazonReviewCount?: number;
  affiliateId: string;
  
  // AI enhanced fields
  faq?: FAQItem[];
  
  // Remove inventory and shipping as they're not needed for affiliate
}

export interface ProductVariation {
  type: string;
  options: VariationOption[];
}

export interface VariationOption {
  name: string;
  value: string;
  price: number;
  // Amazon variation URL if different
  amazonUrl?: string;
  amazonASIN?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Category {
  categoryId: number;
  categoryNameCanonical: string;
  parentCategoryId: number | null;
  slug: string;
  level: number; // 0 = main, 1 = sub, 2 = sub-sub
  description?: string;
  content?: string; // AI-generated long-form SEO content
  seo?: SEOData;
  productCount?: number;
  children?: Category[]; // For nested display
  faq?: FAQItem[]; // AI-generated FAQ for the category
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface InventoryData {
  totalStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface ShippingData {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  freeShipping: boolean;
  estimatedDelivery: string;
}

export interface ReviewsData {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export interface SiteConfig {
  site: {
    name: string;
    description: string;
    url: string;
    logo: string;
    favicon: string;
  };
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    keywords: string[];
    ogImage: string;
  };
  business: {
    email: string;
    phone: string;
    address: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
    };
  };
  features: {
    freeShipping: {
      enabled: boolean;
      threshold: number;
      message: string;
    };
    returns: {
      enabled: boolean;
      days: number;
      message: string;
    };
    warranty: {
      enabled: boolean;
      period: string;
      message: string;
    };
  };
  promotions: {
    welcomeDiscount: {
      enabled: boolean;
      code: string;
      percentage: number;
      message: string;
    };
  };
  payment: {
    stripe: {
      enabled: boolean;
      publicKey: string;
    };
    paypal: {
      enabled: boolean;
      clientId: string;
    };
  };
  shipping: {
    zones: ShippingZone[];
  };
}

export interface ShippingZone {
  name: string;
  price: number;
  freeThreshold: number;
  estimatedDays: string;
}

// Remove or simplify cart-related interfaces since we're redirecting to Amazon
export interface CartItem {
  productId: number;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imagePath: string;
  amazonUrl: string; // Direct Amazon link
  selectedVariation?: Record<string, string>;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  // Remove shipping, payment fields
}

export interface CheckoutData {
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
  cart: CartState;
}

export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Strings {
  navigation: Record<string, string>;
  cart: Record<string, string>;
  product: Record<string, string>;
  checkout: Record<string, string>;
  exitIntent: Record<string, string>;
  forms: Record<string, string>;
  promotions: Record<string, string>;
  trustSignals: Record<string, string>;
  social: Record<string, string>;
  urgency: Record<string, string>;
  errors: Record<string, string>;
  footer: Record<string, string>;
  search: Record<string, string>;
} 