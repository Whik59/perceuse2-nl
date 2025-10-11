#!/usr/bin/env python3
import os
import json
import shutil
from datetime import datetime

def unflag_all_products():
    """Remove the 'enhanced' flag from all product files to allow re-enhancement"""
    
    products_dir = "data/products"
    backup_dir = f"data/products_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print("🔄 Unflagging all enhanced products...")
    print("=" * 50)
    
    # Create backup directory
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"📁 Created backup directory: {backup_dir}")
    
    total_files = 0
    unflagged_count = 0
    already_unflagged = 0
    error_count = 0
    
    for file in os.listdir(products_dir):
        if file.endswith('.json'):
            total_files += 1
            file_path = os.path.join(products_dir, file)
            backup_path = os.path.join(backup_dir, file)
            
            try:
                # Read the product file
                with open(file_path, 'r', encoding='utf-8') as f:
                    product = json.load(f)
                
                # Create backup
                shutil.copy2(file_path, backup_path)
                
                # Check if it has enhanced flag
                if 'enhanced' in product:
                    # Remove the enhanced flag
                    del product['enhanced']
                    unflagged_count += 1
                    
                    # Also remove enhancedAt timestamp if it exists
                    if 'enhancedAt' in product:
                        del product['enhancedAt']
                    
                    # Write back the modified product
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(product, f, ensure_ascii=False, indent=2)
                    
                    print(f"✅ Unflagged: {file}")
                else:
                    already_unflagged += 1
                    print(f"⚪ Already unflagged: {file}")
                    
            except Exception as e:
                error_count += 1
                print(f"❌ Error processing {file}: {e}")
    
    print("\n" + "=" * 50)
    print("📊 UNFLAGGING SUMMARY:")
    print(f"   Total files processed: {total_files}")
    print(f"   Successfully unflagged: {unflagged_count}")
    print(f"   Already unflagged: {already_unflagged}")
    print(f"   Errors: {error_count}")
    print(f"   Backup created: {backup_dir}")
    print("\n🚀 All products are now ready for re-enhancement!")
    
    return unflagged_count

if __name__ == "__main__":
    unflag_all_products()
