import fs from 'fs';
import path from 'path';
import { Product } from './types';
import { memoryCache, CACHE_KEYS } from './cache';

const productsDirectory = path.join(process.cwd(), 'data/products');

// Helper to check if an item is published
const isPublished = (item: { publish?: boolean; publishAt?: string }): boolean => {
  // If explicitly set to false, it's unpublished
  if (item.publish === false) return false;
  
  // If publishAt is set and is in the future, it's not published yet
  if (item.publishAt && new Date(item.publishAt) > new Date()) {
    return false;
  }
  
  // If publish is explicitly true, or if it's undefined/null (backward compatibility), it's published
  return true;
};

// Cache products list for 10 minutes (reduces CPU significantly)
export const getProducts = (includeUnpublished = false): Product[] => {
  // Check cache first
  const cached = memoryCache.get<Product[]>(CACHE_KEYS.PRODUCTS_LIST);
  if (cached) {
    // Filter cached results if not including unpublished
    if (includeUnpublished) {
      return cached;
    }
    return cached.filter(isPublished);
  }

  try {
    // Check if products directory exists
    if (!fs.existsSync(productsDirectory)) {
      console.log(`Products directory not found at ${productsDirectory}`);
      return [];
    }

    const filenames = fs.readdirSync(productsDirectory);

    const products = filenames.map((filename) => {
      if (filename.endsWith('.json')) {
        const filePath = path.join(productsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const productData = JSON.parse(fileContents);

        // Add publish status from the data file
        const transformedProduct = transformProductData(productData, productData.slug || filename.replace('.json', ''));
        if (transformedProduct) {
          transformedProduct.publish = productData.publish;
          transformedProduct.publishAt = productData.publishAt;
        }
        
        return transformedProduct;
      }
      return null;
    }).filter((product): product is Product => product !== null);

    // Cache the result for 10 minutes
    memoryCache.set(CACHE_KEYS.PRODUCTS_LIST, products, 10 * 60 * 1000);

    if (includeUnpublished) {
      return products;
    }
    return products.filter(isPublished);
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
};

export const getProductBySlug = (slug: string, includeUnpublished = false): Product | null => {
  // Check cache first
  const cacheKey = CACHE_KEYS.PRODUCTS_BY_SLUG(slug);
  const cached = memoryCache.get<Product>(cacheKey);
  if (cached) {
    // Check publish status if not including unpublished
    if (!includeUnpublished && !isPublished(cached)) {
      return null;
    }
    return cached;
  }

  try {
    // Optimized: Try to load from index first, fallback to scan
    // This reduces CPU by avoiding full directory scans
    const indexPath = path.join(process.cwd(), 'data', 'indices', 'product-slug-index.json');
    
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        const fileName = index[slug];
        
        if (fileName) {
          const filePath = path.join(productsDirectory, fileName);
          if (fs.existsSync(filePath)) {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const productData = JSON.parse(fileContents);
            
            // Transform and cache
            const product = transformProductData(productData, slug);
            if (product) {
              product.publish = productData.publish;
              product.publishAt = productData.publishAt;
              
              // Check publish status
              if (!includeUnpublished && !isPublished(product)) {
                return null;
              }
              
              memoryCache.set(cacheKey, product, 10 * 60 * 1000);
              return product;
            }
          }
        }
      } catch (indexError) {
        // Fall through to full scan if index fails
        console.warn('Index lookup failed, falling back to scan:', indexError);
      }
    }

    // Fallback: Full directory scan (slower, but works if no index)
    if (!fs.existsSync(productsDirectory)) {
      console.log(`Products directory not found at ${productsDirectory}`);
      return null;
    }

    const filenames = fs.readdirSync(productsDirectory);

    for (const filename of filenames) {
      if (filename.endsWith('.json')) {
        const filePath = path.join(productsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const productData = JSON.parse(fileContents);

        // Check if this is the product we're looking for
        const productSlug = productData.slug || filename.replace('.json', '');
        if (productSlug === slug) {
          // Transform and cache
          const product = transformProductData(productData, productSlug);
          if (product) {
            product.publish = productData.publish;
            product.publishAt = productData.publishAt;
            
            // Check publish status
            if (!includeUnpublished && !isPublished(product)) {
              return null;
            }
            
            memoryCache.set(cacheKey, product, 10 * 60 * 1000);
            return product;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading product by slug:', error);
    return null;
  }
};

// Helper function to transform product data (reduces code duplication)
function transformProductData(productData: any, slug: string): Product | null {
  if (!productData.productId || (!productData.name && !productData.originalAmazonTitle)) {
    return null;
  }

  return {
    productId: productData.productId,
    slug: slug,
    title: productData.name || productData.originalAmazonTitle || 'Product',
    shortDescription: productData.shortDescription || productData.description?.substring(0, 200) || '',
    longDescription: productData.description || '',
    categoryIds: [],
    basePrice: parseFloat(productData.price?.toString().replace(/[€,]/g, '') || '0'),
    compareAtPrice: productData.compareAtPrice,
    onSale: productData.compareAtPrice > 0,
    salePercentage: productData.salePercentage,
    variations: productData.variations || [],
    imagePaths: productData.images || [`/products/${slug}.jpg`],
    features: productData.features || [],
    specifications: productData.specifications || {},
    seo: productData.seo || {
      title: productData.name || productData.originalAmazonTitle || 'Product',
      description: productData.shortDescription || 'Premium product',
      keywords: productData.tags || []
    },
    reviews: productData.reviews || {
      averageRating: productData.amazonRating || 4.6,
      totalReviews: productData.amazonReviewCount || 15,
      breakdown: { 5: 10, 4: 3, 3: 1, 2: 1, 1: 0 }
    },
    tags: productData.tags || [],
    relatedProducts: productData.relatedProducts || [],
    crossSellProducts: productData.crossSellProducts || [],
    featured: productData.featured || false,
    createdAt: productData.createdAt || new Date().toISOString(),
    updatedAt: productData.updatedAt || new Date().toISOString(),
    
    // Amazon affiliate fields
    amazonUrl: productData.amazonUrl || `https://amazon.fr/dp/PLACEHOLDER?tag=friteuseexp-21`,
    amazonASIN: productData.amazonASIN || productData.productId,
    originalAmazonTitle: productData.originalAmazonTitle,
    amazonPrice: parseFloat(productData.amazonPrice?.toString().replace(/[€,]/g, '') || productData.price?.toString().replace(/[€,]/g, '') || '0'),
    amazonRating: productData.amazonRating,
    amazonReviewCount: productData.amazonReviewCount,
    affiliateId: productData.affiliateId || 'friteuseexp-21',
    // Publish fields will be added in the calling function
  };
} 