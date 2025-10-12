import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    const productsDir = path.join(process.cwd(), 'data', 'products');
    
    // Get all product files since we need to search by slug within the files
    const productFiles = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
    
    let productData = null;
    let foundFileName = null;
    
    // Search through all product files to find the one with matching slug
    for (const fileName of productFiles) {
      try {
        const filePath = path.join(productsDir, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Check if this product has the matching slug
        if (data.slug === slug) {
          productData = data;
          foundFileName = fileName;
          break;
        }
      } catch (error) {
        console.error(`Error reading product file ${fileName}:`, error);
        continue;
      }
    }
    
    if (!productData) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Load the category-products mapping to find which categories contain this product
    let categoryIds: number[] = [];
    try {
      const categoryProductsPath = path.join(process.cwd(), 'data', 'indices', 'category-products.json');
      const categoryProductsData = JSON.parse(fs.readFileSync(categoryProductsPath, 'utf-8'));
      
      // Find all categories that contain this product
      for (const [categoryId, productList] of Object.entries(categoryProductsData)) {
        if ((productList as string[]).includes(productData.productId)) {
          categoryIds.push(parseInt(categoryId));
        }
      }
    } catch (error) {
      console.error('Error loading category mapping:', error);
    }
    
    // Transform the scraped data to match the expected Product interface
    const transformedProduct = {
      productId: productData.productId, // Keep as string for now
      slug: productData.slug || slug,
      title: productData.name || productData.originalAmazonTitle || 'Product',
      shortDescription: productData.shortDescription || productData.description?.substring(0, 200) || '',
      longDescription: productData.description || '',
      categoryIds: categoryIds, // Populated from category mapping
      basePrice: parseFloat(productData.price?.toString().replace(/[€,]/g, '') || '0'),
      compareAtPrice: productData.compareAtPrice,
      onSale: productData.compareAtPrice > 0,
      variations: [],
      imagePaths: productData.images && productData.images.length > 0 
        ? productData.images
        : ['/placeholder-product.jpg'],
      videos: productData.videos || [],
      features: productData.features || [],
      specifications: productData.specifications || {},
      faq: productData.faq || [],
      reviewAnalysis: productData.reviewAnalysis || null,
      quickReview: productData.quickReview || null,
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

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
} 