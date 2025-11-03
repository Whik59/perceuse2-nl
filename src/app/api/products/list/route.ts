import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const productsDir = path.join(process.cwd(), 'data/products');
    
    if (!fs.existsSync(productsDir)) {
      return NextResponse.json({ products: [] });
    }
    
    // Helper to check if a product is published
    const isPublished = (item: { publish?: boolean; publishAt?: string }): boolean => {
      // If explicitly set to false, check if publishAt makes it published
      if (item.publish === false && item.publishAt) {
        // If publishAt is set and is in the future, it's not published yet
        return new Date(item.publishAt) <= new Date();
      }
      
      // If explicitly set to false and no publishAt, it's unpublished
      if (item.publish === false) return false;
      
      // If publishAt is set and is in the future, it's not published yet
      if (item.publishAt && new Date(item.publishAt) > new Date()) {
        return false;
      }
      
      // If publish is explicitly true, or if it's undefined/null (backward compatibility), it's published
      return true;
    };
    
    const productFiles = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
    
    const products = productFiles.map(fileName => {
      try {
        const filePath = path.join(productsDir, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Check if product is published
        if (!isPublished(data)) {
          return null; // Skip unpublished products
        }
        
        return {
          productId: data.productId,
          name: data.name || data.originalAmazonTitle || '',
          slug: data.slug || '',
          price: data.price
        };
      } catch (error) {
        console.error(`Error loading product ${fileName}:`, error);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
      }
    });
  } catch (error) {
    console.error('Error loading products for smart linking:', error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
