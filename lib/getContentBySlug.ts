import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Product, Category } from './types';
import { getProductBySlug } from './getProductBySlug';
import { getCategoryBySlug } from './getProductsByCategory';

const contentDirectory = path.join(process.cwd(), 'content');

export interface ProductContent {
  frontmatter: {
    title: string;
    description: string;
    productId: number;
    slug: string;
    category: string;
    featured?: boolean;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
  };
  content: string;
  product: Product; // From JSON data
}

export interface CategoryContent {
  frontmatter: {
    title: string;
    description: string;
    categoryId: number;
    slug: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
  };
  content: string;
  category: Category; // From JSON data
}

// Content cache for performance
const contentCache = new Map<string, ProductContent>();
const categoryContentCache = new Map<string, CategoryContent>();

export const getProductContent = async (slug: string): Promise<ProductContent | null> => {
  try {
    // Check cache first
    if (contentCache.has(slug)) {
      return contentCache.get(slug)!;
    }

    const mdxPath = path.join(contentDirectory, 'products', `${slug}.mdx`);
    
    if (!fs.existsSync(mdxPath)) {
      return null;
    }
    
    // Load MDX content
    const mdxContent = fs.readFileSync(mdxPath, 'utf8');
    const { data: frontmatter, content } = matter(mdxContent);
    
    // Load corresponding JSON data
    const product = await getProductBySlug(slug);
    if (!product) {
      console.warn(`Product JSON not found for content: ${slug}`);
      return null;
    }
    
    const productContent: ProductContent = {
      frontmatter: frontmatter as ProductContent['frontmatter'],
      content,
      product
    };

    // Cache the result
    contentCache.set(slug, productContent);
    
    return productContent;
  } catch (error) {
    console.error(`Error loading content for ${slug}:`, error);
    return null;
  }
};

export const getCategoryContent = async (slug: string): Promise<CategoryContent | null> => {
  try {
    // Check cache first
    if (categoryContentCache.has(slug)) {
      return categoryContentCache.get(slug)!;
    }

    const mdxPath = path.join(contentDirectory, 'categories', `${slug}.mdx`);
    
    if (!fs.existsSync(mdxPath)) {
      return null;
    }
    
    // Load MDX content
    const mdxContent = fs.readFileSync(mdxPath, 'utf8');
    const { data: frontmatter, content } = matter(mdxContent);
    
    // Load corresponding category data
    const category = getCategoryBySlug(slug);
    if (!category) {
      console.warn(`Category not found for content: ${slug}`);
      return null;
    }
    
    const categoryContent: CategoryContent = {
      frontmatter: frontmatter as CategoryContent['frontmatter'],
      content,
      category
    };

    // Cache the result
    categoryContentCache.set(slug, categoryContent);
    
    return categoryContent;
  } catch (error) {
    console.error(`Error loading category content for ${slug}:`, error);
    return null;
  }
};

export const getAllProductContentSlugs = (): string[] => {
  try {
    const contentDir = path.join(contentDirectory, 'products');
    if (!fs.existsSync(contentDir)) {
      return [];
    }
    
    return fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.mdx'))
      .map(file => file.replace('.mdx', ''));
  } catch (error) {
    console.error('Error getting product content slugs:', error);
    return [];
  }
};

export const getAllCategoryContentSlugs = (): string[] => {
  try {
    const contentDir = path.join(contentDirectory, 'categories');
    if (!fs.existsSync(contentDir)) {
      return [];
    }
    
    return fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.mdx'))
      .map(file => file.replace('.mdx', ''));
  } catch (error) {
    console.error('Error getting category content slugs:', error);
    return [];
  }
};

export const getFeaturedProductsContent = async (limit?: number): Promise<ProductContent[]> => {
  try {
    const contentSlugs = getAllProductContentSlugs();
    const featuredContent: ProductContent[] = [];
    let found = 0;
    
    for (const slug of contentSlugs) {
      if (limit && found >= limit) break;
      
      const content = await getProductContent(slug);
      if (content && content.product.featured) {
        featuredContent.push(content);
        found++;
      }
    }
    
    return featuredContent;
  } catch (error) {
    console.error('Error loading featured products content:', error);
    return [];
  }
};

// Utility function to extract excerpt from content
export const extractExcerpt = (content: string, maxLength: number = 160): string => {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last complete word within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return lastSpaceIndex > 0 
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
};

// Performance monitoring
export const getContentStats = () => {
  return {
    productContentCached: contentCache.size,
    categoryContentCached: categoryContentCache.size,
    totalProductContent: getAllProductContentSlugs().length,
    totalCategoryContent: getAllCategoryContentSlugs().length
  };
};

// Clear cache (useful for development)
export const clearContentCache = () => {
  contentCache.clear();
  categoryContentCache.clear();
};

// Preload content for better performance
export const preloadFeaturedContent = async () => {
  try {
    const featuredSlugs = getAllProductContentSlugs().slice(0, 10); // Preload first 10
    
    await Promise.all(
      featuredSlugs.map(slug => getProductContent(slug))
    );
    
    console.log(`Preloaded ${featuredSlugs.length} featured products`);
  } catch (error) {
    console.error('Error preloading content:', error);
  }
}; 