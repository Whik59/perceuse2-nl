import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    
    const contentPath = path.join(process.cwd(), 'content', 'products', `${slug}.mdx`);
    
    // Check if the MDX file exists
    if (!fs.existsSync(contentPath)) {
      return NextResponse.json({ error: 'Product content not found' }, { status: 404 });
    }
    
    const fileContents = fs.readFileSync(contentPath, 'utf8');
    const { content, data } = matter(fileContents);
    
    const mdxSource = await serialize(content, {
      scope: data,
    });
    
    return NextResponse.json({
      content: mdxSource,
      slug,
      frontmatter: data
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
      }
    });
  } catch (error) {
    console.error('Error loading product content:', error);
    return NextResponse.json({ error: 'Failed to load product content' }, { status: 500 });
  }
} 