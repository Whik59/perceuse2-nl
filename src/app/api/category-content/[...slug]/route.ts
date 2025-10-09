import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const fullSlug = slug.join('/'); // Join the slug parts back together
    
    console.log('API: Looking for content with slug:', fullSlug);
    
    // Try to find the category by slug
    const categoriesPath = path.join(process.cwd(), 'data', 'categories.json');
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    
    // Flatten categories to find the matching one
    const allCategories = [];
    categoriesData.forEach(cat => {
      allCategories.push({
        ...cat,
        categoryNameCanonical: cat.name
      });
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => {
          allCategories.push({
            ...sub,
            categoryNameCanonical: sub.name
          });
        });
      }
    });
    
    // Find the category first
    let category = allCategories.find(cat => {
      // Try exact slug match first
      if (cat.slug === fullSlug) {
        console.log('API: Found exact slug match:', cat.slug);
        return true;
      }
      
      // Try name-based matching
      const nameSlug = cat.categoryNameCanonical?.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c');
      
      if (nameSlug === fullSlug) {
        console.log('API: Found name-based match:', cat.categoryNameCanonical, '->', nameSlug);
        return true;
      }
      
      return false;
    });
    
    // Always check individual files for content, even if found in main file
    // because main file doesn't have content, only individual files do
    console.log('API: Checking individual files for content...');
    
    // Try to find by matching the slug pattern
    const slugParts = fullSlug.split('/');
    const lastSlug = slugParts[slugParts.length - 1];
    const flatSlug = fullSlug.replace(/\//g, '-'); // Convert robot-aspirateur/laveur to robot-aspirateur-laveur
    
    console.log('API: Looking for:', {
      fullSlug,
      flatSlug,
      lastSlug,
      slugParts
    });
    
    // Look through individual category files
    const categoriesDir = path.join(process.cwd(), 'data', 'categories');
    const files = fs.readdirSync(categoriesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(categoriesDir, file);
          const categoryData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          console.log('API: Checking file:', file, 'slug:', categoryData.slug, 'name:', categoryData.categoryNameCanonical);
          
          // Check if this category matches our slug
          // Try different slug formats:
          // 1. Exact match with hierarchical slug (robot-aspirateur/laveur)
          // 2. Match with flat slug format (robot-aspirateur-laveur)
          // 3. Match with just the last part (laveur)
          
          if (categoryData.slug === fullSlug || 
              categoryData.slug === flatSlug ||
              categoryData.slug === lastSlug ||
              categoryData.slug === slugParts[slugParts.length - 1]) {
            console.log('API: Found category in individual file:', file, categoryData.categoryNameCanonical, 'slug:', categoryData.slug);
            category = categoryData;
            break;
          }
        } catch (error) {
          console.log('API: Error reading file:', file, error);
        }
      }
    }
    
    if (!category) {
      console.log('API: No category found for slug:', fullSlug);
      return NextResponse.json({ content: null }, { status: 404 });
    }
    
    console.log('API: Found category:', category.categoryNameCanonical, 'with content:', !!category.content);
    
    // Check if category has content
    if (!category.content) {
      return NextResponse.json({ content: null }, { status: 404 });
    }
    
    const categoryContent = {
      slug: category.slug,
      title: category.seo?.title || category.categoryNameCanonical || '',
      description: category.description || '',
      keywords: category.seo?.keywords || [],
      seoTitle: category.seo?.title || category.categoryNameCanonical || '',
      source: category.content,
      faq: category.faq || [],
      comparisonTable: category.comparisonTable || null,
      buyingGuide: category.buyingGuide || null,
      internalLinks: category.internalLinks || []
    };
    
    return NextResponse.json({ content: categoryContent });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`Error loading category content for ${resolvedParams.slug}:`, error);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
