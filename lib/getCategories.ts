import fs from 'fs';
import path from 'path';
import { Category, SubCategory } from './types';
import { memoryCache, CACHE_KEYS } from './cache';

const categoriesFilePath = path.join(process.cwd(), 'data/categories.json');

// Helper to check if an item is published
const isPublished = (item: { publish?: boolean; publishAt?: string }): boolean => {
  // If explicitly set to false, it's unpublished
  if (item.publish === false) return false;
  
  // If publishAt is set and is in the future, it's not published yet
  if (item.publishAt && new Date(item.publishAt) > new Date()) {
    return false;
  }
  
  // If publish is explicitly true, or if it's undefined/null (backward compatibility), it's published
  return true;
};

export const getCategories = async (includeUnpublished = false): Promise<Category[]> => {
  // Check cache first (reduces CPU significantly)
  const cached = memoryCache.get<Category[]>(CACHE_KEYS.CATEGORIES_LIST);
  if (cached) {
    return cached;
  }

  try {
    const fileContents = await fs.promises.readFile(categoriesFilePath, 'utf8');
    const rawCategories = JSON.parse(fileContents);
    
    if (!Array.isArray(rawCategories)) {
      console.error('Error: categories.json is not a valid array.');
      return [];
    }

    // Transform the new structure to be compatible with existing code
    const categories: Category[] = [];
    let categoryIdCounter = 1;

    rawCategories.forEach((rawCategory) => {
      // Create main category
      const mainCategory: Category = {
        categoryId: categoryIdCounter++,
        categoryNameCanonical: rawCategory.name,
        parentCategoryId: null,
        slug: rawCategory.slug,
        level: 0,
        description: rawCategory.description,
        name: rawCategory.name,
        subcategories: rawCategory.subcategories || [],
        publish: rawCategory.publish,
        publishAt: rawCategory.publishAt,
      };

      categories.push(mainCategory);

      // Create subcategories if they exist
      if (rawCategory.subcategories && Array.isArray(rawCategory.subcategories)) {
        rawCategory.subcategories.forEach((subcat: any) => {
          const subcategory: Category = {
            categoryId: categoryIdCounter++,
            categoryNameCanonical: subcat.name,
            parentCategoryId: mainCategory.categoryId,
            slug: `${rawCategory.slug}/${subcat.slug}`, // Hierarchical slug
            level: 1,
            description: subcat.description,
            name: subcat.name,
            publish: subcat.publish,
            publishAt: subcat.publishAt,
          };
          categories.push(subcategory);
        });
      }
    });

    // Cache the result for 10 minutes
    memoryCache.set(CACHE_KEYS.CATEGORIES_LIST, categories, 10 * 60 * 1000);

    if (includeUnpublished) {
      return categories;
    }
    return categories.filter(isPublished);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return []; // Return empty array on error
  }
};

export const getCategoryBySlug = (slug: string, includeUnpublished = false): Category | null => {
  // Check cache first
  const cacheKey = CACHE_KEYS.CATEGORY_BY_SLUG(slug);
  const cached = memoryCache.get<Category>(cacheKey);
  if (cached) {
    // Check publish status if not including unpublished
    if (!includeUnpublished && !isPublished(cached)) {
      return null;
    }
    return cached;
  }

  try {
    const fileContents = fs.readFileSync(categoriesFilePath, 'utf8');
    const rawCategories = JSON.parse(fileContents);
    
    if (!Array.isArray(rawCategories)) {
      console.error('Error: categories.json is not a valid array.');
      return null;
    }

    // Transform the new structure to be compatible with existing code
    const categories: Category[] = [];
    let categoryIdCounter = 1;

    rawCategories.forEach((rawCategory) => {
      // Create main category
      const mainCategory: Category = {
        categoryId: categoryIdCounter++,
        categoryNameCanonical: rawCategory.name,
        parentCategoryId: null,
        slug: rawCategory.slug,
        level: 0,
        description: rawCategory.description,
        name: rawCategory.name,
        subcategories: rawCategory.subcategories || [],
        publish: rawCategory.publish,
        publishAt: rawCategory.publishAt,
      };

      categories.push(mainCategory);

      // Create subcategories if they exist
      if (rawCategory.subcategories && Array.isArray(rawCategory.subcategories)) {
        rawCategory.subcategories.forEach((subcat: any) => {
          const subcategory: Category = {
            categoryId: categoryIdCounter++,
            categoryNameCanonical: subcat.name,
            parentCategoryId: mainCategory.categoryId,
            slug: `${rawCategory.slug}/${subcat.slug}`, // Hierarchical slug
            level: 1,
            description: subcat.description,
            name: subcat.name,
            publish: subcat.publish,
            publishAt: subcat.publishAt,
          };
          categories.push(subcategory);
        });
      }
    });

    // Find category by slug
    const category = categories.find(cat => cat.slug === slug) || null;
    
    // Check publish status
    if (category && !includeUnpublished && !isPublished(category)) {
      return null;
    }
    
    // Cache the result
    if (category) {
      memoryCache.set(cacheKey, category, 10 * 60 * 1000);
    }
    
    return category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}; 