import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryIds } = body;

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: 'categoryIds must be an array' }, { status: 400 });
    }

    const categoryProductsPath = path.join(process.cwd(), 'data', 'indices', 'category-products.json');
    const productsDir = path.join(process.cwd(), 'data', 'products');
    
    const result: Record<number, string | null> = {};

    if (!fs.existsSync(categoryProductsPath) || !fs.existsSync(productsDir)) {
      return NextResponse.json(result);
    }

    const categoryProductsData = JSON.parse(fs.readFileSync(categoryProductsPath, 'utf-8'));

    for (const categoryId of categoryIds) {
      try {
        const productIds: string[] = categoryProductsData[categoryId.toString()] || [];
        
        // Find first product with an image
        for (const productId of productIds.slice(0, 5)) {
          const fileName = `${productId.toLowerCase()}.json`;
          const filePath = path.join(productsDir, fileName);
          
          if (fs.existsSync(filePath)) {
            const productData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            if (productData.images && productData.images.length > 0) {
              result[categoryId] = productData.images[0];
              break;
            }
          }
        }
        
        // If no image found, set to null
        if (!result[categoryId]) {
          result[categoryId] = null;
        }
      } catch (error) {
        console.error(`Error loading image for category ${categoryId}:`, error);
        result[categoryId] = null;
      }
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
      }
    });
  } catch (error) {
    console.error('Error fetching category images:', error);
    return NextResponse.json({ error: 'Failed to fetch category images' }, { status: 500 });
  }
}
