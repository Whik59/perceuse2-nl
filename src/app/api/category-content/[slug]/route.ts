import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contentPath = path.join(process.cwd(), 'content', 'categories', `${slug}.mdx`);
    
    // Check if file exists
    if (!fs.existsSync(contentPath)) {
      return NextResponse.json({ content: null }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(contentPath, 'utf8');
    const { data, content } = matter(fileContent);
    
    // Serialize MDX content
    const mdxSource = await serialize(content);
    
    const categoryContent = {
      slug,
      title: data.title || '',
      description: data.description || '',
      keywords: data.keywords || [],
      seoTitle: data.seoTitle || data.title || '',
      content: mdxSource,
      source: content
    };
    
    return NextResponse.json({ content: categoryContent });
  } catch (error) {
    const resolvedParams = await params;
    console.error(`Error loading category content for ${resolvedParams.slug}:`, error);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
} 