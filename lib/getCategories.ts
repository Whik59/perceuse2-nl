import fs from 'fs';
import path from 'path';
import { Category, SubCategory } from './types';

const categoriesFilePath = path.join(process.cwd(), 'data/categories.json');

export const getCategories = async (): Promise<Category[]> => {
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
        subcategories: rawCategory.subcategories || []
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
            name: subcat.name
          };
          categories.push(subcategory);
        });
      }
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return []; // Return empty array on error
  }
};

export const getCategoryBySlug = (slug: string): Category | null => {
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
        subcategories: rawCategory.subcategories || []
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
            name: subcat.name
          };
          categories.push(subcategory);
        });
      }
    });

    // Find category by slug
    return categories.find(cat => cat.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}; 