import { MDXRemoteSerializeResult } from 'next-mdx-remote';

export interface ProductContent {
  content: MDXRemoteSerializeResult;
  slug: string;
}

export const getProductContent = async (slug: string): Promise<ProductContent | null> => {
  try {
    const response = await fetch(`/api/product-content/${slug}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching product content:', error);
    return null;
  }
}; 