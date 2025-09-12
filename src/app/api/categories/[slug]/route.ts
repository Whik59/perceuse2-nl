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

    // First try to load from individual category files
    const categoriesDir = path.join(process.cwd(), 'data', 'categories');
    
    // Look for category by slug in individual files
    if (fs.existsSync(categoriesDir)) {
      const categoryFiles = fs.readdirSync(categoriesDir).filter(file => file.endsWith('.json'));
      
      for (const file of categoryFiles) {
        try {
          const filePath = path.join(categoriesDir, file);
          const categoryData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          if (categoryData.slug === slug) {
            return NextResponse.json(categoryData);
          }
        } catch (error) {
          console.error(`Error reading category file ${file}:`, error);
        }
      }
    }
    
    // Fallback to main categories.json file
    const categoriesPath = path.join(process.cwd(), 'data', 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
      
      // Find category by slug
      const category = categoriesData.find((cat: any) => cat.slug === slug);
      
      if (category) {
        return NextResponse.json(category);
      }
    }
    
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  } catch (error) {
    console.error('Error loading category:', error);
    return NextResponse.json({ error: 'Failed to load category' }, { status: 500 });
  }
} 