import fs from 'fs';
import path from 'path';
import { Product, Category } from './types';
import { getProductBySlug, getAllProductSlugs } from './getProductBySlug';

const categoriesPath = path.join(process.cwd(), 'data/categories.json');

export const getAllCategories = (): Category[] => {
  try {
    if (!fs.existsSync(categoriesPath)) {
      return [];
    }
    
    const fileContents = fs.readFileSync(categoriesPath, 'utf8');
    const categories: Category[] = JSON.parse(fileContents);
    
    return categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
};

export const getCategoryBySlug = (slug: string): Category | null => {
  try {
    const categories = getAllCategories();
    return categories.find(category => category.categoryNameCanonical === slug) || null;
  } catch (error) {
    console.error(`Error loading category with slug ${slug}:`, error);
    return null;
  }
};

export const getCategoryById = (categoryId: number): Category | null => {
  try {
    const categories = getAllCategories();
    return categories.find(category => category.categoryId === categoryId) || null;
  } catch (error) {
    console.error(`Error loading category with ID ${categoryId}:`, error);
    return null;
  }
};

export const getProductsByCategory = async (
  categorySlug: string, 
  page: number = 1, 
  limit: number = 20
): Promise<{ products: Product[], total: number }> => {
  try {
    const category = getCategoryBySlug(categorySlug);
    if (!category) {
      return { products: [], total: 0 };
    }
    
    // Check if we have a category index for better performance
    const categoryIndexPath = path.join(process.cwd(), 'data/indices/category-products.json');
    
    if (fs.existsSync(categoryIndexPath)) {
      const categoryIndex: Record<number, string[]> = JSON.parse(fs.readFileSync(categoryIndexPath, 'utf8'));
      const productSlugs: string[] = categoryIndex[category.categoryId || 0] || [];
      
      // Include products from subcategories
      const subcategories = getSubcategories(category.categoryId || 0);
      for (const subcategory of subcategories) {
        const subcategoryProducts: string[] = categoryIndex[subcategory.categoryId || 0] || [];
        productSlugs.push(...subcategoryProducts);
      }
      
      // Remove duplicates and paginate
      const uniqueSlugs = [...new Set(productSlugs)];
      const total = uniqueSlugs.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSlugs = uniqueSlugs.slice(startIndex, endIndex);
      
      const products: Product[] = [];
      for (const slug of paginatedSlugs) {
        const product = await getProductBySlug(slug);
        if (product) {
          products.push(product);
        }
      }
      
      return { products, total };
    }
    
    // Fallback: scan all products (not recommended for production)
    const allSlugs = getAllProductSlugs();
    const categoryProducts: Product[] = [];
    
    for (const slug of allSlugs) {
      const product = await getProductBySlug(slug);
      if (product && product.categoryIds.includes(category.categoryId || 0)) {
        categoryProducts.push(product);
      }
    }
    
    // Include products from subcategories
    const subcategories = getSubcategories(category.categoryId || 0);
    const subcategoryIds = subcategories.map(sub => sub.categoryId);
    
    for (const slug of allSlugs) {
      const product = await getProductBySlug(slug);
      if (product && product.categoryIds.some(id => subcategoryIds.includes(id))) {
        // Check if not already included
        if (!categoryProducts.find(p => p.productId === product.productId)) {
          categoryProducts.push(product);
        }
      }
    }
    
    // Paginate results
    const total = categoryProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = categoryProducts.slice(startIndex, endIndex);
    
    return { products: paginatedProducts, total };
  } catch (error) {
    console.error(`Error loading products for category ${categorySlug}:`, error);
    return { products: [], total: 0 };
  }
};

export const getSubcategories = (parentCategoryId: number): Category[] => {
  try {
    const categories = getAllCategories();
    return categories.filter(category => category.parentCategoryId === parentCategoryId);
  } catch (error) {
    console.error(`Error loading subcategories for ${parentCategoryId}:`, error);
    return [];
  }
};

export const getParentCategories = (): Category[] => {
  try {
    const categories = getAllCategories();
    return categories.filter(category => category.parentCategoryId === null);
  } catch (error) {
    console.error('Error loading parent categories:', error);
    return [];
  }
};

export const getCategoryPath = (categoryId: number): Category[] => {
  try {
    const path: Category[] = [];
    let currentCategory = getCategoryById(categoryId);
    
    while (currentCategory) {
      path.unshift(currentCategory);
      if (currentCategory.parentCategoryId) {
        currentCategory = getCategoryById(currentCategory.parentCategoryId);
      } else {
        break;
      }
    }
    
    return path;
  } catch (error) {
    console.error(`Error building category path for ${categoryId}:`, error);
    return [];
  }
};

export const getAllCategorySlugs = (): string[] => {
  try {
    const categories = getAllCategories();
    return categories.map(category => category.categoryNameCanonical || category.name || '');
  } catch (error) {
    console.error('Error getting category slugs:', error);
    return [];
  }
};

// Build category-product index for better performance
export const buildCategoryIndex = async (): Promise<void> => {
  try {
    const indexDir = path.join(process.cwd(), 'data/indices');
    if (!fs.existsSync(indexDir)) {
      fs.mkdirSync(indexDir, { recursive: true });
    }
    
    const slugs = getAllProductSlugs();
    const categoryProductIndex: Record<number, string[]> = {};
    
    // Initialize all categories
    const categories = getAllCategories();
    for (const category of categories) {
      categoryProductIndex[category.categoryId || 0] = [];
    }
    
    // Map products to categories
    for (const slug of slugs) {
      const product = await getProductBySlug(slug);
      if (product && product.categoryIds) {
        for (const categoryId of product.categoryIds) {
          if (categoryProductIndex[categoryId]) {
            categoryProductIndex[categoryId].push(slug);
          }
        }
      }
    }
    
    // Write category index
    fs.writeFileSync(
      path.join(indexDir, 'category-products.json'),
      JSON.stringify(categoryProductIndex, null, 2)
    );
    
    console.log('Category index built successfully');
  } catch (error) {
    console.error('Error building category index:', error);
  }
}; 