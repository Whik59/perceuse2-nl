#!/usr/bin/env python3
"""
Add Amazon URLs to existing category comparison tables by looking up product data
"""

import json
import os
import sys
from pathlib import Path

def safe_print(message):
    """Thread-safe print function that handles encoding issues"""
    try:
        print(message)
    except (UnicodeEncodeError, UnicodeDecodeError):
        # Fallback: strip emojis and non-ASCII characters
        cleaned = ''.join(char if ord(char) < 128 else '' for char in str(message))
        print(cleaned)

def main():
    """Add Amazon URLs to category comparison tables"""
    safe_print("🔗 Adding Amazon URLs to Category Comparison Tables")
    safe_print("=" * 60)
    
    # Paths
    categories_dir = os.path.join('data', 'categories')
    products_dir = os.path.join('data', 'products')
    
    if not os.path.exists(categories_dir):
        safe_print(f"[ERROR] Categories directory not found: {categories_dir}")
        return
    
    if not os.path.exists(products_dir):
        safe_print(f"[ERROR] Products directory not found: {products_dir}")
        return
    
    # Build product lookup by slug
    safe_print("[INFO] Building product lookup index...")
    product_lookup = {}
    product_files = [f for f in os.listdir(products_dir) if f.endswith('.json')]
    
    for product_file in product_files:
        file_path = os.path.join(products_dir, product_file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                product_data = json.load(f)
                slug = product_data.get('slug', '')
                amazon_url = product_data.get('amazonUrl', '')
                if slug and amazon_url:
                    product_lookup[slug] = amazon_url
        except Exception as e:
            safe_print(f"[WARNING] Could not read {product_file}: {e}")
    
    safe_print(f"[INFO] Built lookup for {len(product_lookup)} products")
    
    # Process category files
    category_files = [f for f in os.listdir(categories_dir) if f.endswith('.json')]
    safe_print(f"[INFO] Processing {len(category_files)} category files...")
    
    updated_count = 0
    no_comparison_count = 0
    products_updated_count = 0
    
    for category_file in category_files:
        file_path = os.path.join(categories_dir, category_file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                category_data = json.load(f)
            
            # Check if category has comparison table
            if 'comparisonTable' not in category_data:
                no_comparison_count += 1
                continue
            
            comparison_table = category_data['comparisonTable']
            if not comparison_table or 'products' not in comparison_table:
                no_comparison_count += 1
                continue
            
            products = comparison_table['products']
            if not isinstance(products, list):
                no_comparison_count += 1
                continue
            
            # Update products with Amazon URLs
            made_changes = False
            for product in products:
                if not isinstance(product, dict):
                    continue
                
                # Skip if already has amazonUrl
                if 'amazonUrl' in product and product['amazonUrl']:
                    continue
                
                # Get slug from productUrl
                product_url = product.get('productUrl', '')
                if product_url and product_url.startswith('/product/'):
                    slug = product_url.replace('/product/', '')
                    
                    # Look up Amazon URL
                    amazon_url = product_lookup.get(slug)
                    if amazon_url:
                        product['amazonUrl'] = amazon_url
                        made_changes = True
                        products_updated_count += 1
                        safe_print(f"[UPDATE] Added Amazon URL to {product.get('name', 'Unknown')[:50]}")
            
            # Save if changes were made
            if made_changes:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(category_data, f, indent=2, ensure_ascii=False)
                updated_count += 1
                safe_print(f"[SUCCESS] Updated {category_file}")
        
        except Exception as e:
            safe_print(f"[ERROR] Failed to process {category_file}: {e}")
    
    # Summary
    safe_print("\n" + "=" * 60)
    safe_print("📊 Summary")
    safe_print("=" * 60)
    safe_print(f"✅ Categories updated: {updated_count}")
    safe_print(f"📝 Products with Amazon URLs added: {products_updated_count}")
    safe_print(f"⏭️  Categories without comparison tables: {no_comparison_count}")
    safe_print(f"📁 Total category files: {len(category_files)}")

if __name__ == "__main__":
    main()

