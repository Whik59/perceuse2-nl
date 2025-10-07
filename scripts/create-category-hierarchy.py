#!/usr/bin/env python3
"""
Category Hierarchy Builder
Creates a hierarchical JSON structure from category and subcategory keyword files.
"""

import json
import os
import re
from collections import defaultdict
from datetime import datetime

def clean_keyword(keyword):
    """Clean and normalize a keyword"""
    return keyword.strip().lower()

def load_keywords_from_file(filepath):
    """Load keywords from a text file, one per line"""
    keywords = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Remove line numbers if present (format: "123|keyword")
                    if '|' in line and line.split('|')[0].strip().isdigit():
                        keyword = '|'.join(line.split('|')[1:])
                    else:
                        keyword = line
                    
                    keyword = keyword.strip()
                    if keyword:
                        keywords.append(keyword)
    except FileNotFoundError:
        print(f"Warning: File {filepath} not found")
        return []
    
    return keywords

def categorize_subcategories(categories, subcategories):
    """
    Match subcategories to their parent categories based on keyword matching.
    Returns a dictionary with categories as keys and lists of subcategories as values.
    """
    hierarchy = defaultdict(list)
    
    # Convert categories to clean format for matching
    clean_categories = {}
    for category in categories:
        clean_cat = clean_keyword(category)
        clean_categories[clean_cat] = category
    
    # Process each subcategory
    for subcategory in subcategories:
        clean_subcat = clean_keyword(subcategory)
        matched = False
        
        # Find the best matching category
        best_match = None
        best_match_length = 0
        
        for clean_cat, original_cat in clean_categories.items():
            # Check if the category is a substring of the subcategory
            if clean_cat in clean_subcat:
                # Prefer longer matches (more specific categories)
                if len(clean_cat) > best_match_length:
                    best_match = original_cat
                    best_match_length = len(clean_cat)
                    matched = True
        
        if matched and best_match:
            hierarchy[best_match].append(subcategory)
        else:
            # If no match found, create a generic category or log it
            print(f"Warning: No category match found for subcategory: {subcategory}")
    
    return dict(hierarchy)

def create_category_json_structure(hierarchy, all_categories):
    """
    Create a flat JSON structure suitable for the Next.js site.
    Uses the expected Category interface with categoryId, categoryNameCanonical, parentCategoryId, level.
    """
    categories_json = []
    category_id_counter = 1
    
    # Process all categories, creating a flat structure
    for category in sorted(all_categories):
        # Create slug from category name
        slug = re.sub(r'[^a-z0-9]+', '-', category.lower()).strip('-')
        
        # Get subcategories for this category (empty list if none)
        subcategories = hierarchy.get(category, [])
        has_subcategories = len(subcategories) > 0
        
        # Create main category (level 0)
        parent_category_id = category_id_counter
        category_obj = {
            "categoryId": parent_category_id,
            "categoryNameCanonical": category,
            "parentCategoryId": None,
            "slug": slug,
            "level": 0,
            "description": f"Explore our selection of {category}",
            "productCount": 0,  # Will be updated when products are scraped
            "seo": {
                "title": f"{category.title()} - Best Products & Reviews",
                "description": f"Find the best {category} products with detailed reviews and comparisons. Free shipping and best prices guaranteed.",
                "keywords": [category.lower(), "telefono", "movil", "smartphone"]
            },
            # Scraping metadata
            "has_subcategories": has_subcategories,
            "needs_products": not has_subcategories,
            "recommended_products": 0 if has_subcategories else 15,
            "scraping_strategy": "subcategories" if has_subcategories else "direct"
        }
        
        categories_json.append(category_obj)
        category_id_counter += 1
        
        # Create subcategories (level 1) if they exist
        for subcat in sorted(subcategories):
            subcat_slug = re.sub(r'[^a-z0-9]+', '-', subcat.lower()).strip('-')
            
            subcat_obj = {
                "categoryId": category_id_counter,
                "categoryNameCanonical": subcat,
                "parentCategoryId": parent_category_id,
                "slug": subcat_slug,
                "level": 1,
                "description": f"Discover {subcat} with detailed product information and reviews",
                "productCount": 0,  # Will be updated when products are scraped
                "seo": {
                    "title": f"{subcat.title()} - Expert Reviews & Best Deals",
                    "description": f"Compare {subcat} products with expert reviews. Find the best deals and free shipping options.",
                    "keywords": [subcat.lower(), category.lower(), "telefono", "movil"]
                },
                # Scraping metadata
                "has_subcategories": False,
                "needs_products": True,
                "recommended_products": 5,
                "scraping_strategy": "direct"
            }
            
            categories_json.append(subcat_obj)
            category_id_counter += 1
    
    return categories_json

def save_backup(data, filename):
    """Save a backup of the data with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_dir = "backups"
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    backup_file = os.path.join(backup_dir, f"{filename}_backup_{timestamp}.json")
    
    try:
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Backup saved: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"❌ Failed to save backup: {e}")
        return None

def main():
    """Main function to process categories and create hierarchy"""
    print("🏗️  Starting Category Hierarchy Builder...")
    
    # File paths
    categories_file = "data/category_keywords.txt"
    subcategories_file = "data/subcategory_keywords.txt"
    output_file = "data/categories.json"
    
    # Load data
    print("📖 Loading category keywords...")
    categories = load_keywords_from_file(categories_file)
    print(f"   Found {len(categories)} categories")
    
    print("📖 Loading subcategory keywords...")
    subcategories = load_keywords_from_file(subcategories_file)
    print(f"   Found {len(subcategories)} subcategories")
    
    if not categories or not subcategories:
        print("❌ No data loaded. Please check file paths and content.")
        return
    
    # Create hierarchy
    print("🔗 Creating category hierarchy...")
    hierarchy = categorize_subcategories(categories, subcategories)
    
    # Create JSON structure
    print("📝 Building JSON structure...")
    categories_json = create_category_json_structure(hierarchy, categories)
    
    # Statistics
    main_categories = [cat for cat in categories_json if cat['level'] == 0]
    subcategories = [cat for cat in categories_json if cat['level'] == 1]
    categories_with_subcats = len([cat for cat in main_categories if cat['has_subcategories']])
    categories_without_subcats = len([cat for cat in main_categories if not cat['has_subcategories']])
    categories_need_products = len([cat for cat in categories_json if cat['needs_products']])
    
    # Calculate recommended product counts
    total_recommended_products = sum(cat['recommended_products'] for cat in categories_json)
    
    print(f"\n📊 Hierarchy Statistics:")
    print(f"   Total categories: {len(main_categories)}")
    print(f"   Categories with subcategories: {categories_with_subcats}")
    print(f"   Categories without subcategories: {categories_without_subcats}")
    print(f"   Total subcategories: {len(subcategories)}")
    print(f"   Total entries in flat structure: {len(categories_json)}")
    
    print(f"\n🎯 Product Scraping Strategy:")
    print(f"   Categories needing direct products: {categories_need_products}")
    print(f"   Total recommended products to scrape: {total_recommended_products}")
    print(f"   Average products per scraping target: {total_recommended_products/categories_need_products:.1f}")
    
    # Show examples
    print(f"\n🔍 Examples (flat structure):")
    for i, cat in enumerate(categories_json[:6]):  # Show first 6 entries
        level_icon = "📂" if cat['level'] == 0 else "  └─ 📄"
        parent_info = f" (parent: {cat['parentCategoryId']})" if cat['parentCategoryId'] else ""
        print(f"   {level_icon} ID:{cat['categoryId']} {cat['categoryNameCanonical']}{parent_info}")
        print(f"      Level: {cat['level']}, Products: {cat['recommended_products']}, Strategy: {cat['scraping_strategy']}")
    
    # Save backup of existing file if it exists
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            save_backup(existing_data, "categories")
        except Exception as e:
            print(f"⚠️  Could not backup existing file: {e}")
    
    # Save new structure
    print(f"\n💾 Saving hierarchy to {output_file}...")
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(categories_json, f, indent=2, ensure_ascii=False)
        print("✅ Categories saved successfully!")
        
        # Note: Not saving to locales/categories.json as requested
        
    except Exception as e:
        print(f"❌ Failed to save hierarchy: {e}")

if __name__ == "__main__":
    main() 