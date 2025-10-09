import { MDXRemoteSerializeResult } from 'next-mdx-remote';

export interface CategoryContent {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  seoTitle: string;
  source: string; // Raw HTML content
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  comparisonTable?: {
    title: string;
    columns: string[];
    products: Array<{
      rank: number;
      name: string;
      power?: string;
      autonomy?: string;
      tank?: string;
      connectivity?: string;
      navigation?: string;
      keyFeatures?: string;
      price: string;
      rating: string;
      productUrl?: string;
      amazonUrl?: string;
      image: string;
    }>;
  } | null;
  buyingGuide?: {
    title: string;
    sections: Array<{
      heading: string;
      content: string;
    }>;
  } | null;
  internalLinks?: Array<{
    text: string;
    url: string;
  }>;
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