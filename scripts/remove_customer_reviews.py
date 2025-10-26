#!/usr/bin/env python3
"""
Remove customerReviews from all product JSON files
Customer reviews should only be generated dynamically on product pages
"""

import json
import os
from pathlib import Path

def remove_customer_reviews_from_products():
    """Remove customerReviews field from all product JSON files"""
    
    # Set up paths
    if os.path.basename(os.getcwd()) == 'scripts':
        products_dir = "../data/products"
    else:
        products_dir = "data/products"
    
    if not os.path.exists(products_dir):
        print(f"❌ Products directory not found: {products_dir}")
        return
    
    # Find all product JSON files
    product_files = [f for f in os.listdir(products_dir) if f.endswith('.json')]
    
    if not product_files:
        print(f"❌ No product files found in {products_dir}")
        return
    
    print(f"🔍 Found {len(product_files)} product files")
    print("=" * 50)
    
    removed_count = 0
    processed_count = 0
    
    for product_file in product_files:
        file_path = os.path.join(products_dir, product_file)
        
        try:
            # Load product data
            with open(file_path, 'r', encoding='utf-8') as f:
                product_data = json.load(f)
            
            # Check if customerReviews exists
            if 'customerReviews' in product_data:
                # Remove customerReviews field
                del product_data['customerReviews']
                removed_count += 1
                
                # Save updated product data
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(product_data, f, indent=2, ensure_ascii=False)
                
                print(f"✅ Removed customerReviews from {product_file}")
            else:
                print(f"ℹ️  No customerReviews found in {product_file}")
            
            processed_count += 1
            
        except Exception as e:
            print(f"❌ Error processing {product_file}: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Summary:")
    print(f"   Processed: {processed_count} files")
    print(f"   Removed customerReviews: {removed_count} files")
    print(f"   Directory: {products_dir}")
    
    if removed_count > 0:
        print(f"\n✅ Successfully removed customerReviews from {removed_count} product files!")
        print("   Customer reviews will now only be generated dynamically on product pages.")
    else:
        print(f"\nℹ️  No customerReviews found to remove.")

if __name__ == "__main__":
    print("🧹 Removing customerReviews from product files")
    print("Customer reviews should only be generated dynamically on product pages")
    print()
    
    remove_customer_reviews_from_products()
