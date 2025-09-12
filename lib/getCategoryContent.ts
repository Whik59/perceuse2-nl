import { MDXRemoteSerializeResult } from 'next-mdx-remote';

export interface CategoryContent {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  seoTitle: string;
  content: MDXRemoteSerializeResult;
  source: string; // Raw markdown content
}

export const getCategoryContent = async (slug: string): Promise<CategoryContent | null> => {
  try {
    const response = await fetch(`/api/category-content/${slug}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Content not found, which is expected for some categories
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error(`Error loading category content for ${slug}:`, error);
    return null;
  }
}; 