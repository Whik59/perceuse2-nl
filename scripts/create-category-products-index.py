#!/usr/bin/env python3
"""
Create Category-Products Index
This script creates the category-products.json mapping file that the site needs
to display products on category pages.
"""

import json
import os
import re
from collections import defaultdict
from datetime import datetime

def safe_print(message):
    """Print message with Unicode characters replaced for Windows compatibility"""
    if os.name == 'nt':  # Windows
        replacements = {
            '✅': '[OK]',
            '❌': '[ERROR]',
            '⚠️': '[WARNING]',
            '🔄': '[RETRY]',
            '🔍': '[SEARCH]',
            '📊': '[STATS]',
            '🎯': '[TARGET]',
            '💾': '[SAVE]',
            '🚀': '[START]',
            '🏷️': '[CATEGORY]',
            '📄': '[PAGE]',
            '⭐': '[RATING]',
            '💰': '[PRICE]',
            '🎉': '[SUCCESS]'
        }
        for unicode_char, replacement in replacements.items():
            message = message.replace(unicode_char, replacement)
    print(message)

class CategoryProductsIndexer:
    def __init__(self):
        self.categories_file = "data/categories.json"
        self.products_dir = "data/products"
        self.indices_dir = "data/indices"
        self.categories_dir = "data/categories"
        self.output_file = os.path.join(self.indices_dir, "category-products.json")
        
        # Create indices directory if it doesn't exist
        os.makedirs(self.indices_dir, exist_ok=True)
        
        # Load categories
        self.categories = self.load_categories()
        self.category_products_map = defaultdict(list)
        
    def load_categories(self):
        """Load hierarchical categories from categories.json and flatten them"""
        try:
            with open(self.categories_file, 'r', encoding='utf-8') as f:
                hierarchical_categories = json.load(f)
            
            # Flatten hierarchical structure to match the scraper's format
            categories = []
            category_id_counter = 1
            
            for main_category in hierarchical_categories:
                # Create main category
                main_cat = {
                    'categoryId': category_id_counter,
                    'name': main_category['name'],
                    'slug': main_category['slug'],
                    'level': 0,
                    'parentCategoryId': None,
                    'categoryNameCanonical': main_category['name'],
                    'description': main_category['description']
                }
                categories.append(main_cat)
                category_id_counter += 1
                
                # Create subcategories if they exist
                if 'subcategories' in main_category and main_category['subcategories']:
                    for subcat in main_category['subcategories']:
                        subcategory = {
                            'categoryId': category_id_counter,
                            'name': subcat['name'],
                            'slug': f"{main_category['slug']}/{subcat['slug']}",  # Hierarchical slug
                            'level': 1,
                            'parentCategoryId': main_cat['categoryId'],
                            'categoryNameCanonical': subcat['name'],
                            'description': subcat['description']
                        }
                        categories.append(subcategory)
                        category_id_counter += 1
            
            safe_print(f"[OK] Loaded {len(categories)} categories:")
            safe_print(f"  - {len([c for c in categories if c['level'] == 0])} main categories")
            safe_print(f"  - {len([c for c in categories if c['level'] == 1])} subcategories")
            return categories
            
        except Exception as e:
            safe_print(f"[ERROR] Could not load categories: {e}")
            return []
    
    def load_products(self):
        """Load all products from the products directory"""
        products = []
        
        if not os.path.exists(self.products_dir):
            safe_print(f"[ERROR] Products directory not found: {self.products_dir}")
            return products
        
        product_files = [f for f in os.listdir(self.products_dir) if f.endswith('.json')]
        safe_print(f"[OK] Found {len(product_files)} product files")
        
        for filename in product_files:
            try:
                filepath = os.path.join(self.products_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    product_data = json.load(f)
                
                # Extract product ID (ASIN)
                product_id = product_data.get('productId') or product_data.get('amazonASIN')
                if not product_id:
                    # Try to extract from filename
                    product_id = filename.replace('.json', '').upper()
                
                if product_id:
                    products.append({
                        'productId': product_id,
                        'filename': filename,
                        'data': product_data
                    })
                    
            except Exception as e:
                safe_print(f"[WARNING] Could not load product {filename}: {e}")
        
        safe_print(f"[OK] Successfully loaded {len(products)} products")
        return products
    
    def match_products_to_categories(self, products):
        """Match products to categories based on category_id field and hierarchical structure"""
        matched_count = 0
        
        for product in products:
            product_data = product['data']
            product_id = product['productId']
            
            # Method 1: Check if product has category_id field (primary method)
            category_id = product_data.get('category_id')
            if category_id:
                self.category_products_map[str(category_id)].append(product_id)
                matched_count += 1
                continue
            
            # Method 2: Check if product has category_name field and match by name
            category_name = product_data.get('category_name') or product_data.get('category')
            if category_name:
                # Find category by name (check both main and subcategories)
                matching_category = None
                for cat in self.categories:
                    if (cat.get('name') == category_name or 
                        cat.get('categoryNameCanonical') == category_name):
                        matching_category = cat
                        break
                
                if matching_category:
                    self.category_products_map[str(matching_category['categoryId'])].append(product_id)
                    matched_count += 1
                    continue
            
            # Method 3: Try to match by product title/keywords to category names
            product_title = product_data.get('name') or product_data.get('title', '')
            product_title_lower = product_title.lower()
            
            # Find best matching category (prioritize subcategories for more specific matches)
            best_match = None
            best_score = 0
            
            # First try subcategories (level 1) for more specific matches
            subcategories = [cat for cat in self.categories if cat['level'] == 1]
            for cat in subcategories:
                cat_name = cat.get('name') or cat.get('categoryNameCanonical', '')
                cat_name_lower = cat_name.lower()
                
                # Calculate similarity score
                score = 0
                
                # Exact match
                if cat_name_lower in product_title_lower:
                    score += 15  # Higher score for subcategories
                
                # Partial match
                words = cat_name_lower.split()
                for word in words:
                    if len(word) > 3 and word in product_title_lower:
                        score += 2
                
                if score > best_score:
                    best_score = score
                    best_match = cat
            
            # If no good subcategory match, try main categories
            if not best_match or best_score < 3:
                main_categories = [cat for cat in self.categories if cat['level'] == 0]
                for cat in main_categories:
                    cat_name = cat.get('name') or cat.get('categoryNameCanonical', '')
                    cat_name_lower = cat_name.lower()
                    
                    # Calculate similarity score
                    score = 0
                    
                    # Exact match
                    if cat_name_lower in product_title_lower:
                        score += 10
                    
                    # Partial match
                    words = cat_name_lower.split()
                    for word in words:
                        if len(word) > 3 and word in product_title_lower:
                            score += 1
                    
                    if score > best_score:
                        best_score = score
                        best_match = cat
            
            # If we found a reasonable match, assign the product
            if best_match and best_score >= 2:
                self.category_products_map[str(best_match['categoryId'])].append(product_id)
                matched_count += 1
                level_type = "subcategory" if best_match['level'] == 1 else "main category"
                safe_print(f"[MATCH] {product_id} -> {best_match.get('name', 'Unknown')} ({level_type}, score: {best_score})")
        
        safe_print(f"[OK] Matched {matched_count} products to categories")
        return matched_count
    
    def update_category_product_counts(self):
        """Update productCount in individual category files"""
        updated_count = 0
        
        for category in self.categories:
            category_id = str(category['categoryId'])
            product_count = len(self.category_products_map[category_id])
            
            # Update the category file
            category_filename = f"{category_id}.json"
            category_filepath = os.path.join(self.categories_dir, category_filename)
            
            if os.path.exists(category_filepath):
                try:
                    with open(category_filepath, 'r', encoding='utf-8') as f:
                        category_data = json.load(f)
                    
                    # Update product count
                    category_data['productCount'] = product_count
                    category_data['lastUpdated'] = datetime.now().isoformat()
                    
                    with open(category_filepath, 'w', encoding='utf-8') as f:
                        json.dump(category_data, f, indent=2, ensure_ascii=False)
                    
                    updated_count += 1
                    safe_print(f"[UPDATE] Category {category_id}: {product_count} products")
                    
                except Exception as e:
                    safe_print(f"[ERROR] Could not update category {category_id}: {e}")
        
        safe_print(f"[OK] Updated {updated_count} category files")
    
    def save_category_products_index(self):
        """Save the category-products mapping to JSON file"""
        try:
            # Convert defaultdict to regular dict for JSON serialization
            index_data = dict(self.category_products_map)
            
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(index_data, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[SAVE] Category-products index saved to: {self.output_file}")
            
            # Print statistics
            total_products = sum(len(products) for products in index_data.values())
            categories_with_products = len([cat_id for cat_id, products in index_data.items() if len(products) > 0])
            
            safe_print(f"[STATS] Total products mapped: {total_products}")
            safe_print(f"[STATS] Categories with products: {categories_with_products}")
            safe_print(f"[STATS] Total categories: {len(self.categories)}")
            
            return True
            
        except Exception as e:
            safe_print(f"[ERROR] Could not save index: {e}")
            return False
    
    def print_detailed_stats(self):
        """Print detailed statistics about the mapping with hierarchical information"""
        safe_print(f"\n[STATS] DETAILED CATEGORY-PRODUCTS MAPPING")
        safe_print("=" * 60)
        
        # Separate main categories and subcategories
        main_categories = [cat for cat in self.categories if cat['level'] == 0]
        subcategories = [cat for cat in self.categories if cat['level'] == 1]
        
        # Sort categories by product count
        sorted_categories = sorted(
            self.category_products_map.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )
        
        # Show main categories with most products
        safe_print(f"[MAIN CATEGORIES] Top categories with most products:")
        main_cat_stats = []
        for category_id, products in sorted_categories:
            for cat in main_categories:
                if str(cat['categoryId']) == category_id:
                    main_cat_stats.append((cat, len(products)))
                    break
        
        main_cat_stats.sort(key=lambda x: x[1], reverse=True)
        for i, (cat, count) in enumerate(main_cat_stats[:10]):
            safe_print(f"  {i+1:2d}. {cat['name']} (ID: {cat['categoryId']}): {count} products")
        
        # Show subcategories with most products
        safe_print(f"\n[SUBCATEGORIES] Top subcategories with most products:")
        subcat_stats = []
        for category_id, products in sorted_categories:
            for cat in subcategories:
                if str(cat['categoryId']) == category_id:
                    subcat_stats.append((cat, len(products)))
                    break
        
        subcat_stats.sort(key=lambda x: x[1], reverse=True)
        for i, (cat, count) in enumerate(subcat_stats[:10]):
            parent_name = "Unknown"
            for main_cat in main_categories:
                if main_cat['categoryId'] == cat['parentCategoryId']:
                    parent_name = main_cat['name']
                    break
            safe_print(f"  {i+1:2d}. {cat['name']} (Parent: {parent_name}, ID: {cat['categoryId']}): {count} products")
        
        # Show categories with no products
        categories_without_products = []
        for cat in self.categories:
            category_id = str(cat['categoryId'])
            if category_id not in self.category_products_map or len(self.category_products_map[category_id]) == 0:
                categories_without_products.append(cat)
        
        if categories_without_products:
            safe_print(f"\n[WARNING] Categories with NO products ({len(categories_without_products)}):")
            for cat in categories_without_products[:10]:  # Show first 10
                level_type = "subcategory" if cat['level'] == 1 else "main category"
                safe_print(f"  - {cat.get('name', cat.get('categoryNameCanonical', 'Unknown'))} ({level_type}, ID: {cat['categoryId']})")
            
            if len(categories_without_products) > 10:
                safe_print(f"  ... and {len(categories_without_products) - 10} more")
        
        # Show hierarchical summary
        safe_print(f"\n[HIERARCHICAL SUMMARY]:")
        main_with_products = len([cat for cat in main_categories if str(cat['categoryId']) in self.category_products_map and len(self.category_products_map[str(cat['categoryId'])]) > 0])
        sub_with_products = len([cat for cat in subcategories if str(cat['categoryId']) in self.category_products_map and len(self.category_products_map[str(cat['categoryId'])]) > 0])
        
        safe_print(f"  Main categories: {main_with_products}/{len(main_categories)} have products")
        safe_print(f"  Subcategories: {sub_with_products}/{len(subcategories)} have products")
        
        # Calculate expected vs actual
        expected_main_products = len(main_categories) * 20
        expected_sub_products = len(subcategories) * 5
        actual_main_products = sum(len(self.category_products_map[str(cat['categoryId'])]) for cat in main_categories if str(cat['categoryId']) in self.category_products_map)
        actual_sub_products = sum(len(self.category_products_map[str(cat['categoryId'])]) for cat in subcategories if str(cat['categoryId']) in self.category_products_map)
        
        safe_print(f"  Expected products: {expected_main_products} main + {expected_sub_products} sub = {expected_main_products + expected_sub_products}")
        safe_print(f"  Actual products: {actual_main_products} main + {actual_sub_products} sub = {actual_main_products + actual_sub_products}")
    
    def run(self):
        """Main execution function"""
        safe_print("[START] Category-Products Index Creator")
        safe_print("=" * 60)
        
        if not self.categories:
            safe_print("[ERROR] No categories loaded. Exiting.")
            return False
        
        # Load products
        products = self.load_products()
        if not products:
            safe_print("[ERROR] No products loaded. Exiting.")
            return False
        
        # Match products to categories
        matched_count = self.match_products_to_categories(products)
        
        if matched_count == 0:
            safe_print("[ERROR] No products matched to categories. Check your product data.")
            return False
        
        # Update category files with product counts
        self.update_category_product_counts()
        
        # Save the index
        if self.save_category_products_index():
            self.print_detailed_stats()
            safe_print(f"\n[SUCCESS] Category-products index created successfully!")
            safe_print(f"[INFO] Your category pages should now display products correctly.")
            return True
        else:
            safe_print("[ERROR] Failed to save index.")
            return False

if __name__ == "__main__":
    indexer = CategoryProductsIndexer()
    success = indexer.run()
    
    if success:
        safe_print("\n[INFO] Next steps:")
        safe_print("1. Restart your Next.js development server")
        safe_print("2. Visit a category page to see products")
        safe_print("3. Check that products are displaying correctly")
    else:
        safe_print("\n[ERROR] Index creation failed. Please check the logs above.")
