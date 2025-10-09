import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '../../../../../lib/getCategories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Get all categories using the getCategories function
    const allCategories = await getCategories();
    
    // Find category by slug (check both main categories and subcategories)
    // The slug might be hierarchical like "robot-aspirateur/laveur"
    const category = allCategories.find((cat) => cat.slug === slug);
    
    if (category) {
      return NextResponse.json(category);
    }
    
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  } catch (error) {
    console.error('Error loading category:', error);
    return NextResponse.json({ error: 'Failed to load category' }, { status: 500 });
  }
} 