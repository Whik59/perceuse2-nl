import fs from 'fs';
import path from 'path';
import { Product } from './types';

const productsDirectory = path.join(process.cwd(), 'data/products');

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const filePath = path.join(productsDirectory, `${slug}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const productData = JSON.parse(fileContents);
    
    // Transform the scraped product data to match our interface
    if (productData.productId && (productData.name || productData.originalAmazonTitle)) {
      const transformedProduct: Product = {
        productId: productData.productId, // Keep as string for now
        slug: productData.slug || slug,
        title: productData.name || productData.originalAmazonTitle || 'Product',
        shortDescription: productData.shortDescription || productData.description?.substring(0, 200) || '',
        longDescription: productData.description || '',
        categoryIds: [], // Will be populated from category mapping if needed
        basePrice: parseFloat(productData.price?.toString().replace(/[€,]/g, '') || '0'),
        compareAtPrice: productData.compareAtPrice,
        onSale: productData.compareAtPrice > 0,
        salePercentage: productData.salePercentage,
        variations: productData.variations || [],
        imagePaths: productData.images || [`/products/${slug}.jpg`],
        features: productData.features || [],
        specifications: productData.specifications || {},
        faq: productData.faq || [],
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
        affiliateId: productData.affiliateId || 'friteuseexp-21'
      };

      return transformedProduct;
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading product with slug ${slug}:`, error);
    return null;
  }
};

export const getAllProductSlugs = (): string[] => {
  try {
    if (!fs.existsSync(productsDirectory)) {
      return [];
    }
    
    const files = fs.readdirSync(productsDirectory);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('Error getting product slugs:', error);
    return [];
  }
};

// Optimized function - only loads products when needed
export const getProductsPaginated = async (page: number = 1, limit: number = 20): Promise<{ products: Product[], total: number }> => {
  try {
    const slugs = getAllProductSlugs();
    const total = slugs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSlugs = slugs.slice(startIndex, endIndex);
    
    const products: Product[] = [];
    
    for (const slug of paginatedSlugs) {
      const product = await getProductBySlug(slug);
      if (product) {
        products.push(product);
      }
    }
    
    return { products, total };
  } catch (error) {
    console.error('Error loading paginated products:', error);
    return { products: [], total: 0 };
  }
};

export const getFeaturedProducts = async (limit?: number): Promise<Product[]> => {
  try {
    // For better performance, we could maintain a separate featured-products.json index file
    // that only contains productIds of featured products
    const featuredIndexPath = path.join(process.cwd(), 'data/indices/featured-products.json');
    
    if (fs.existsSync(featuredIndexPath)) {
      const featuredIndex = JSON.parse(fs.readFileSync(featuredIndexPath, 'utf8'));
      const productIds = limit ? featuredIndex.slice(0, limit) : featuredIndex;
      
      const products: Product[] = [];
      for (const productId of productIds) {
        // You'd need a productId to slug mapping or store slugs in the index
        const slugs = getAllProductSlugs();
        for (const slug of slugs) {
          const product = await getProductBySlug(slug);
          if (product && product.productId === productId) {
            products.push(product);
            break;
          }
        }
      }
      return products;
    }
    
    // Fallback: scan all products (not recommended for production with 2000+ products)
    const allSlugs = getAllProductSlugs();
    const products: Product[] = [];
    let found = 0;
    
    for (const slug of allSlugs) {
      if (limit && found >= limit) break;
      
      const product = await getProductBySlug(slug);
      if (product && product.featured) {
        products.push(product);
        found++;
      }
    }
    
    return products;
  } catch (error) {
    console.error('Error loading featured products:', error);
    return [];
  }
};

export const getProductsByIds = async (productIds: number[]): Promise<Product[]> => {
  try {
    // For better performance, maintain a productId -> slug mapping file
    const productIndexPath = path.join(process.cwd(), 'data/indices/product-index.json');
    
    if (fs.existsSync(productIndexPath)) {
      const productIndex = JSON.parse(fs.readFileSync(productIndexPath, 'utf8'));
      const products: Product[] = [];
      
      for (const productId of productIds) {
        const slug = productIndex[productId];
        if (slug) {
          const product = await getProductBySlug(slug);
          if (product) {
            products.push(product);
          }
        }
      }
      
      return products;
    }
    
    // Fallback: scan all products (not recommended for production)
    const allSlugs = getAllProductSlugs();
    const products: Product[] = [];
    
    for (const slug of allSlugs) {
      const product = await getProductBySlug(slug);
      if (product && productIds.includes(product.productId)) {
        products.push(product);
      }
    }
    
    return products;
  } catch (error) {
    console.error('Error loading products by IDs:', error);
    return [];
  }
};

// Helper function to build search index for better performance
export const buildProductIndex = async (): Promise<void> => {
  try {
    const indexDir = path.join(process.cwd(), 'data/indices');
    if (!fs.existsSync(indexDir)) {
      fs.mkdirSync(indexDir, { recursive: true });
    }
    
    const slugs = getAllProductSlugs();
    const productIndex: Record<number, string> = {};
    const featuredProducts: number[] = [];
    
    for (const slug of slugs) {
      const product = await getProductBySlug(slug);
      if (product) {
        productIndex[product.productId] = slug;
        if (product.featured) {
          featuredProducts.push(product.productId);
        }
      }
    }
    
    // Write index files
    fs.writeFileSync(
      path.join(indexDir, 'product-index.json'),
      JSON.stringify(productIndex, null, 2)
    );
    
    fs.writeFileSync(
      path.join(indexDir, 'featured-products.json'),
      JSON.stringify(featuredProducts, null, 2)
    );
    
    console.log('Product indices built successfully');
  } catch (error) {
    console.error('Error building product index:', error);
  }
}; 