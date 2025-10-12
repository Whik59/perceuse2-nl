import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '../../../lib/getProducts';
import { getCategories } from '../../../lib/getCategories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, products, categories, suggestions

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        results: [],
        categories: [],
        products: [],
        suggestions: []
      });
    }

    const searchTerm = query.trim().toLowerCase();
    const results: any = {
      categories: [],
      products: [],
      suggestions: []
    };

    // Get all categories and products
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts()
    ]);

    // Search categories and subcategories
    const matchingCategories = categories.filter(category => {
      const name = category.name.toLowerCase();
      const slug = category.slug.toLowerCase();
      const description = category.description?.toLowerCase() || '';
      
      return name.includes(searchTerm) || 
             slug.includes(searchTerm) || 
             description.includes(searchTerm);
    });

    // Search products
    const matchingProducts = products.filter(product => {
      const name = product.name.toLowerCase();
      const description = product.description?.toLowerCase() || '';
      const slug = product.slug.toLowerCase();
      const categoryName = product.category?.name?.toLowerCase() || '';
      
      return name.includes(searchTerm) || 
             description.includes(searchTerm) ||
             slug.includes(searchTerm) ||
             categoryName.includes(searchTerm);
    });

    // Generate suggestions based on search term
    const suggestions = generateSuggestions(searchTerm, categories, products);

    // Organize results by type
    if (type === 'categories') {
      results.categories = matchingCategories.slice(0, 10);
    } else if (type === 'products') {
      results.products = matchingProducts.slice(0, 20);
    } else if (type === 'suggestions') {
      results.suggestions = suggestions;
    } else {
      // Return all results
      results.categories = matchingCategories.slice(0, 8);
      results.products = matchingProducts.slice(0, 15);
      results.suggestions = suggestions.slice(0, 8);
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      results: {
        categories: [],
        products: [],
        suggestions: []
      }
    }, { status: 500 });
  }
}

function generateSuggestions(searchTerm: string, categories: any[], products: any[]): string[] {
  const suggestions = new Set<string>();
  
  // Add category names that start with search term
  categories.forEach(category => {
    if (category.name.toLowerCase().startsWith(searchTerm)) {
      suggestions.add(category.name);
    }
  });

  // Add product names that start with search term
  products.forEach(product => {
    if (product.name.toLowerCase().startsWith(searchTerm)) {
      suggestions.add(product.name);
    }
  });

  // Add common search terms based on categories
  const commonTerms = [
    'arbre à chat', 'jouet chat', 'griffoir', 'litière chat', 'nourriture chat',
    'accessoire chat', 'transporteur chat', 'collier chat', 'gamelle chat',
    'friteuse', 'robot cuiseur', 'mixeur', 'blender', 'cafetière',
    'aspirateur', 'robot aspirateur', 'balai vapeur', 'nettoyeur vapeur'
  ];

  commonTerms.forEach(term => {
    if (term.toLowerCase().includes(searchTerm) && suggestions.size < 10) {
      suggestions.add(term);
    }
  });

  return Array.from(suggestions).slice(0, 10);
}
