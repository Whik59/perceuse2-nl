import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for index file
let indexCache: any = null;
let indexCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    const slug = searchParams.get('slug');
    
    // Load index file (with caching)
    const now = Date.now();
    if (!indexCache || (now - indexCacheTime) > CACHE_DURATION) {
      const indexPath = path.join(process.cwd(), 'data', 'categories-index.json');
      
      if (!fs.existsSync(indexPath)) {
        return NextResponse.json({ error: 'Categories index not found' }, { status: 404 });
      }
      
      indexCache = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      indexCacheTime = now;
    }
    
    // Find category by ID or slug
    let categoryInfo = null;
    if (categoryId) {
      categoryInfo = indexCache.categories.find((cat: any) => cat.categoryId === parseInt(categoryId));
    } else if (slug) {
      categoryInfo = indexCache.categories.find((cat: any) => cat.slug === slug);
    }
    
    if (!categoryInfo) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Load individual category file
    const categoryPath = path.join(process.cwd(), 'data', categoryInfo.file_path);
    
    if (!fs.existsSync(categoryPath)) {
      return NextResponse.json({ error: 'Category file not found' }, { status: 404 });
    }
    
    const categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf-8'));
    
    return NextResponse.json({
      ...categoryData,
      meta: {
        ...categoryData.meta,
        loaded_from: 'individual_file',
        cache_hit: true
      }
    });
    
  } catch (error) {
    console.error('Error loading category:', error);
    return NextResponse.json({ error: 'Failed to load category' }, { status: 500 });
  }
}

// Get all categories (lightweight)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lightweight = searchParams.get('lightweight') === 'true';
    
    // Load index file (with caching)
    const now = Date.now();
    if (!indexCache || (now - indexCacheTime) > CACHE_DURATION) {
      const indexPath = path.join(process.cwd(), 'data', 'categories-index.json');
      
      if (!fs.existsSync(indexPath)) {
        return NextResponse.json({ error: 'Categories index not found' }, { status: 404 });
      }
      
      indexCache = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      indexCacheTime = now;
    }
    
    if (lightweight) {
      // Return only basic info for navigation
      return NextResponse.json({
        total: indexCache.total_categories,
        last_updated: indexCache.last_updated,
        categories: indexCache.categories.map((cat: any) => ({
          categoryId: cat.categoryId,
          categoryNameCanonical: cat.categoryNameCanonical,
          slug: cat.slug,
          seo_title: cat.seo_title
        }))
      });
    }
    
    // Return full index
    return NextResponse.json(indexCache);
    
  } catch (error) {
    console.error('Error loading categories:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
