#!/usr/bin/env python3
"""
AI E-commerce Content Optimizer
Master script to generate all SEO-optimized content for products and categories
"""

import json
import os
import argparse
import time
from pathlib import Path
from datetime import datetime
import subprocess
import sys

def run_command(command, description):
    """Run a command and handle output"""
    print(f"\n{'='*60}")
    print(f"[RUNNING] {description}")
    print(f"[COMMAND] {command}")
    print('='*60)
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"[WARNING] {result.stderr}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Command failed: {e}")
        print(f"[STDOUT] {e.stdout}")
        print(f"[STDERR] {e.stderr}")
        return False

def check_api_key():
    """Check if Gemini API key is available"""
    return True  # API key is hardcoded

def optimize_ecommerce_content(
    api_key: str = None,
    sample_size: int = None,
    skip_products: bool = False,
    skip_categories: bool = False
):
    """Main function to optimize all e-commerce content"""
    
    print("🚀 AI E-COMMERCE CONTENT OPTIMIZER")
    print("="*60)
    print("This script will generate:")
    print("✅ SEO-optimized product titles and slugs")
    print("✅ Product descriptions optimized for conversion")
    print("✅ Product FAQs")
    print("✅ Category descriptions and buying guides")
    print("✅ Category FAQs")
    print("="*60)
    
    # Check prerequisites
    if not check_api_key() and not api_key:
        return False
    
    # Set API key environment variable if provided
    if api_key:
        os.environ['GEMINI_API_KEY'] = api_key
    
    # Create output directories
    output_dirs = [
        "data/ai-generated",
        "data/ai-generated/categories", 
        "backups/products"
    ]
    
    for dir_path in output_dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    success_count = 0
    total_steps = 2 if not skip_products and not skip_categories else 1
    
    # Step 1: Generate product content
    if not skip_products:
        print(f"\n🔥 STEP 1/{total_steps}: GENERATING PRODUCT CONTENT")
        
        command = f"python scripts/ai-content-generator.py"
        if sample_size:
            command += f" --sample {sample_size}"
        
        if run_command(command, "Generate AI content for products"):
            success_count += 1
            
            # Update main product files
            print(f"\n📝 UPDATING MAIN PRODUCT FILES")
            if run_command("python scripts/update-products-with-ai.py", "Update products with AI content"):
                print("✅ Products updated successfully!")
            else:
                print("❌ Failed to update product files")
        else:
            print("❌ Failed to generate product content")
    
    # Step 2: Generate category content
    if not skip_categories:
        step_num = 2 if not skip_products else 1
        print(f"\n📂 STEP {step_num}/{total_steps}: GENERATING CATEGORY CONTENT")
        
        if run_command("python scripts/generate-category-content.py", "Generate AI content for categories"):
            success_count += 1
            print("✅ Category content generated successfully!")
        else:
            print("❌ Failed to generate category content")
    
    # Step 3: Update indices
    print(f"\n🔄 UPDATING SEARCH INDICES")
    if run_command("node scripts/update-indices.js", "Update search indices"):
        print("✅ Search indices updated!")
    else:
        print("❌ Failed to update indices")
    
    # Generate final report
    generate_final_report()
    
    print("\n" + "="*60)
    if success_count == total_steps:
        print("🎉 ALL CONTENT OPTIMIZATION COMPLETE!")
        print("="*60)
        print("✅ Your e-commerce site now has:")
        print("  • SEO-optimized product titles and descriptions")
        print("  • Product FAQs for better conversions")
        print("  • Category descriptions and buying guides")
        print("  • Updated search indices")
        print("\n💡 Next steps:")
        print("  1. Test your website: npm run dev")
        print("  2. Check product pages for new content")
        print("  3. Verify category pages have descriptions")
        print("  4. Review AI-generated content quality")
    else:
        print("⚠️  OPTIMIZATION PARTIALLY COMPLETE")
        print(f"✅ {success_count}/{total_steps} steps completed successfully")
        print("❌ Some steps failed - check logs above")
    
    print("="*60)
    return success_count == total_steps

def generate_final_report():
    """Generate a comprehensive report of all changes"""
    report_data = {
        'optimization_date': datetime.now().isoformat(),
        'summary': {}
    }
    
    # Count products processed
    ai_generated_dir = Path("data/ai-generated")
    if ai_generated_dir.exists():
        product_files = list(ai_generated_dir.glob("*.json"))
        # Exclude report files
        product_files = [f for f in product_files if not f.name.endswith('_report.json')]
        report_data['summary']['products_processed'] = len(product_files)
    
    # Count categories processed
    categories_dir = ai_generated_dir / "categories"
    if categories_dir.exists():
        category_files = list(categories_dir.glob("category_*.json"))
        report_data['summary']['categories_processed'] = len(category_files)
    
    # Check for existing reports
    existing_reports = []
    for report_file in ["generation_report.json", "ai_update_report.json"]:
        if Path(f"data/{report_file}").exists():
            existing_reports.append(report_file)
    
    report_data['detailed_reports'] = existing_reports
    
    # Save final report
    with open("data/ai_optimization_final_report.json", 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 FINAL REPORT SAVED: data/ai_optimization_final_report.json")

def main():
    parser = argparse.ArgumentParser(description='AI E-commerce Content Optimizer')
    parser.add_argument('--api-key', help='Gemini API key (or set GEMINI_API_KEY env var)')
    parser.add_argument('--sample', type=int, help='Process only N products for testing')
    parser.add_argument('--skip-products', action='store_true', help='Skip product content generation')
    parser.add_argument('--skip-categories', action='store_true', help='Skip category content generation')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without executing')
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - Showing what would be executed:")
        print("\n1. Generate AI content for products")
        if args.sample:
            print(f"   - Sample size: {args.sample} products")
        print("2. Update main product files with AI content")
        print("3. Generate AI content for categories")
        print("4. Update search indices")
        print("5. Generate final optimization report")
        return
    
    # Run the optimization
    success = optimize_ecommerce_content(
        api_key=args.api_key,
        sample_size=args.sample,
        skip_products=args.skip_products,
        skip_categories=args.skip_categories
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 