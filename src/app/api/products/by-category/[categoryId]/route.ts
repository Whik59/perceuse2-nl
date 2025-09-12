import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.categoryId);

    // Load the category-products mapping
    const categoryProductsPath = path.join(process.cwd(), 'data', 'indices', 'category-products.json');
    const categoryProductsData = JSON.parse(fs.readFileSync(categoryProductsPath, 'utf-8'));
    
    // Get product IDs for this category
    const productIds = categoryProductsData[categoryId.toString()] || [];
    
    const productsDir = path.join(process.cwd(), 'data', 'products');
    const products = [];
    
    for (const productId of productIds) {
      try {
        // Convert productId to filename format (lowercase)
        const fileName = `${productId.toLowerCase()}.json`;
        const filePath = path.join(productsDir, fileName);
        
        if (fs.existsSync(filePath)) {
          const productData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Transform the scraped data to match the expected Product interface
          const transformedProduct = {
            productId: productData.productId, // Keep as string for now
            slug: productData.slug || productData.productId.toLowerCase(),
            title: productData.name || productData.originalAmazonTitle || 'Product',
            shortDescription: productData.shortDescription || productData.description?.substring(0, 200) || '',
            longDescription: productData.description || '',
            categoryIds: [categoryId], // Use the current category ID
            basePrice: parseFloat(productData.price?.toString().replace(/[€,]/g, '') || '0'),
            compareAtPrice: productData.compareAtPrice,
            onSale: productData.compareAtPrice > 0,
            variations: [],
            imagePaths: productData.images || [],
           videos: productData.videos || [],
            features: [],
            specifications: {},
            seo: productData.seo || {
              title: productData.name || 'Product',
              description: productData.shortDescription || 'Premium product',
              keywords: productData.tags || []
            },
            reviews: productData.reviews || {
              averageRating: productData.amazonRating || 4.5,
              totalReviews: productData.amazonReviewCount || 0,
              breakdown: { 5: 80, 4: 15, 3: 3, 2: 1, 1: 1 }
            },
            tags: productData.tags || [],
            relatedProducts: [],
            crossSellProducts: [],
            featured: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // Amazon affiliate fields
            amazonUrl: productData.amazonUrl || '',
            amazonASIN: productData.amazonASIN || productData.productId,
            originalAmazonTitle: productData.originalAmazonTitle,
            amazonPrice: parseFloat(productData.amazonPrice?.toString().replace(/[€,]/g, '') || productData.price?.toString().replace(/[€,]/g, '') || '0'),
            amazonRating: productData.amazonRating,
            amazonReviewCount: productData.amazonReviewCount,
            affiliateId: productData.affiliateId || 'friteuseexp-21'
          };
          
          products.push(transformedProduct);
        }
      } catch (error) {
        console.error(`Error loading product ${productId}:`, error);
      }
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
} 