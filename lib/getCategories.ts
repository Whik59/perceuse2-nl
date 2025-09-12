import fs from 'fs';
import path from 'path';
import { Category } from './types';

const categoriesFilePath = path.join(process.cwd(), 'data/categories.json');

export const getCategories = async (): Promise<Category[]> => {
  try {
    const fileContents = await fs.promises.readFile(categoriesFilePath, 'utf8');
    const categories: Category[] = JSON.parse(fileContents);
    
    if (!Array.isArray(categories)) {
      console.error('Error: categories.json is not a valid array.');
      return [];
    }

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return []; // Return empty array on error
  }
}; 