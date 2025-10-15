import { NextResponse } from 'next/server';
import { getCategories } from '../../../../lib/getCategories';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
      }
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
} 