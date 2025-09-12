#!/usr/bin/env node
/**
 * Update Data Indices
 * Updates category-products mapping and search indices based on current products and categories
 */

const fs = require('fs');
const path = require('path');

// Paths
const CATEGORIES_PATH = path.join(__dirname, '../data/categories.json');
const PRODUCTS_DIR = path.join(__dirname, '../data/products');
const INDICES_DIR = path.join(__dirname, '../data/indices');

console.log('🔄 Updating data indices...');

// Load categories
let categories = [];
try {
    const categoriesData = fs.readFileSync(CATEGORIES_PATH, 'utf8');
    categories = JSON.parse(categoriesData);
    console.log(`✅ Loaded ${categories.length} categories`);
} catch (error) {
    console.error('❌ Error loading categories:', error.message);
    process.exit(1);
}

// Load products
let products = [];
try {
    const productFiles = fs.readdirSync(PRODUCTS_DIR).filter(file => file.endsWith('.json'));
    
    for (const file of productFiles) {
        const productPath = path.join(PRODUCTS_DIR, file);
        const productData = fs.readFileSync(productPath, 'utf8');
        const product = JSON.parse(productData);
        
        // Add filename as productId if not present
        if (!product.productId) {
            product.productId = file.replace('.json', '');
        }
        
        products.push(product);
    }
    
    console.log(`✅ Loaded ${products.length} products`);
} catch (error) {
    console.error('❌ Error loading products:', error.message);
    process.exit(1);
}

// Create category-products mapping
const categoryProducts = {};
const categoryMap = {};

// Build category map for quick lookup
categories.forEach(cat => {
    categoryMap[cat.categoryId] = cat;
});

// Map products to categories based on category name matching
products.forEach(product => {
    const productCategory = product.category || '';
    const productTags = product.tags || [];
    
    // Find matching categories
    categories.forEach(category => {
        const categoryName = category.categoryNameCanonical.toLowerCase();
        const productCategoryLower = productCategory.toLowerCase();
        
        // Check if product category matches or if any tags match
        const matches = 
            productCategoryLower.includes(categoryName.replace(/\s+/g, '')) ||
            categoryName.includes(productCategoryLower.replace(/\s+/g, '')) ||
            productTags.some(tag => 
                tag.toLowerCase().includes(categoryName.replace(/\s+/g, '')) ||
                categoryName.includes(tag.toLowerCase())
            );
        
        if (matches) {
            if (!categoryProducts[category.categoryId]) {
                categoryProducts[category.categoryId] = [];
            }
            
            // Add product ID if not already present
            if (!categoryProducts[category.categoryId].includes(product.productId)) {
                categoryProducts[category.categoryId].push(product.productId);
            }
        }
    });
});

// Create search index
const searchIndex = {};

products.forEach(product => {
    // Index by product name words
    const nameWords = (product.name || '').toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
        if (word.length > 2) { // Skip very short words
            if (!searchIndex[word]) searchIndex[word] = [];
            if (!searchIndex[word].includes(product.productId)) {
                searchIndex[word].push(product.productId);
            }
        }
    });
    
    // Index by tags
    (product.tags || []).forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (!searchIndex[tagLower]) searchIndex[tagLower] = [];
        if (!searchIndex[tagLower].includes(product.productId)) {
            searchIndex[tagLower].push(product.productId);
        }
    });
    
    // Index by brand
    if (product.brand) {
        const brandLower = product.brand.toLowerCase();
        if (!searchIndex[brandLower]) searchIndex[brandLower] = [];
        if (!searchIndex[brandLower].includes(product.productId)) {
            searchIndex[brandLower].push(product.productId);
        }
    }
    
    // Index by category
    if (product.category) {
        const categoryLower = product.category.toLowerCase();
        if (!searchIndex[categoryLower]) searchIndex[categoryLower] = [];
        if (!searchIndex[categoryLower].includes(product.productId)) {
            searchIndex[categoryLower].push(product.productId);
        }
    }
});

// Create product index
const productIndex = {
    products: products.map(p => p.productId)
};

// Create featured products (top-rated products)
const featuredProducts = products
    .filter(p => p.reviews && p.reviews.averageRating >= 4.0)
    .sort((a, b) => (b.reviews?.averageRating || 0) - (a.reviews?.averageRating || 0))
    .slice(0, 6)
    .map(p => p.productId);

// Ensure indices directory exists
if (!fs.existsSync(INDICES_DIR)) {
    fs.mkdirSync(INDICES_DIR, { recursive: true });
}

// Write indices
try {
    // Category-products mapping
    fs.writeFileSync(
        path.join(INDICES_DIR, 'category-products.json'),
        JSON.stringify(categoryProducts, null, 2)
    );
    console.log(`✅ Updated category-products.json with ${Object.keys(categoryProducts).length} categories`);
    
    // Search index
    fs.writeFileSync(
        path.join(INDICES_DIR, 'search-index.json'),
        JSON.stringify(searchIndex, null, 2)
    );
    console.log(`✅ Updated search-index.json with ${Object.keys(searchIndex).length} search terms`);
    
    // Product index
    fs.writeFileSync(
        path.join(INDICES_DIR, 'product-index.json'),
        JSON.stringify(productIndex, null, 2)
    );
    console.log(`✅ Updated product-index.json with ${productIndex.products.length} products`);
    
    // Featured products
    fs.writeFileSync(
        path.join(INDICES_DIR, 'featured-products.json'),
        JSON.stringify(featuredProducts, null, 2)
    );
    console.log(`✅ Updated featured-products.json with ${featuredProducts.length} featured products`);
    
    console.log('\n🎉 All indices updated successfully!');
    
    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log(`Categories: ${categories.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Category mappings: ${Object.keys(categoryProducts).length}`);
    console.log(`Search terms: ${Object.keys(searchIndex).length}`);
    console.log(`Featured products: ${featuredProducts.length}`);
    
} catch (error) {
    console.error('❌ Error writing indices:', error.message);
    process.exit(1);
} 