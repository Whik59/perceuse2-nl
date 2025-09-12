#!/usr/bin/env python3
"""
Update Products with AI-Generated Content
Merges AI-generated content back into the main product files
"""

import json
import os
from pathlib import Path
import shutil
from datetime import datetime

def update_products_with_ai_content(
    ai_dir: str = "data/ai-generated",
    products_dir: str = "data/products",
    backup_dir: str = "backups/products"
):
    """Update main product files with AI-generated content"""
    
    ai_path = Path(ai_dir)
    products_path = Path(products_dir)
    backup_path = Path(backup_dir)
    
    # Create backup directory
    backup_path.mkdir(parents=True, exist_ok=True)
    
    # Create timestamped backup
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_subdir = backup_path / f"backup_{timestamp}"
    backup_subdir.mkdir(exist_ok=True)
    
    print(f"[BACKUP] Creating backup in {backup_subdir}")
    
    updated_count = 0
    errors = []
    
    # Process each AI-generated file
    for ai_file in ai_path.glob("*.json"):
        if ai_file.name == "generation_report.json":
            continue
            
        try:
            # Read AI-generated content
            with open(ai_file, 'r', encoding='utf-8') as f:
                ai_data = json.load(f)
            
            # Find corresponding original product file
            original_file = products_path / ai_file.name
            
            if not original_file.exists():
                print(f"[WARNING] Original file not found: {ai_file.name}")
                continue
            
            # Backup original file
            backup_file = backup_subdir / ai_file.name
            shutil.copy2(original_file, backup_file)
            
            # Read original product data
            with open(original_file, 'r', encoding='utf-8') as f:
                original_data = json.load(f)
            
            # Merge AI content into original data
            if 'seo_title' in ai_data:
                original_data['seo_title'] = ai_data['seo_title']
                original_data['title'] = ai_data['seo_title']  # Update main title too
            
            if 'slug' in ai_data:
                original_data['slug'] = ai_data['slug']
            
            if 'ai_description' in ai_data:
                original_data['ai_description'] = ai_data['ai_description']
                original_data['description'] = ai_data['ai_description']  # Update main description
            
            if 'faq' in ai_data:
                original_data['faq'] = ai_data['faq']
            
            # Add update metadata
            original_data['last_ai_update'] = datetime.now().isoformat()
            
            # Save updated product
            with open(original_file, 'w', encoding='utf-8') as f:
                json.dump(original_data, f, ensure_ascii=False, indent=2)
            
            print(f"[UPDATED] {ai_file.name}")
            updated_count += 1
            
        except Exception as e:
            error_msg = f"Failed to update {ai_file.name}: {e}"
            errors.append(error_msg)
            print(f"[ERROR] {error_msg}")
    
    # Create update report
    report = {
        'timestamp': datetime.now().isoformat(),
        'updated_count': updated_count,
        'backup_location': str(backup_subdir),
        'errors': errors
    }
    
    with open(products_path.parent / 'ai_update_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n[COMPLETE] Updated {updated_count} products")
    print(f"[BACKUP] Original files backed up to: {backup_subdir}")
    print(f"[REPORT] Update report saved to: ai_update_report.json")
    
    if errors:
        print(f"[ERRORS] {len(errors)} errors occurred - check report for details")
    
    return report

if __name__ == "__main__":
    update_products_with_ai_content() 