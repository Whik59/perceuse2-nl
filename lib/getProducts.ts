import fs from 'fs';
import path from 'path';
import { Product } from './types';

const productsDirectory = path.join(process.cwd(), 'data/products');

export const getProducts = (): Product[] => {
  try {
    const filenames = fs.readdirSync(productsDirectory);

    const products = filenames.map((filename) => {
      if (filename.endsWith('.json')) {
        const filePath = path.join(productsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const productData = JSON.parse(fileContents);

        // Transform the scraped product data to match our interface
        if (productData.productId && (productData.name || productData.originalAmazonTitle)) {
          // Create slug from filename or productId
          const slug = productData.slug || filename.replace('.json', '');
          
          const transformedProduct: Product = {
            productId: productData.productId, // Keep as string for now
            slug: slug,
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
      }
      return null;
    }).filter((product): product is Product => product !== null);

    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}; 