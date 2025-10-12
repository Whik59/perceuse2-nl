#!/usr/bin/env python3
"""
Automated Pipeline Script
Runs all scripts in the correct order with customizable parameters.
"""

import subprocess
import sys
import argparse
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🚀 {description}")
    print(f"Running: {command}")
    print("-" * 50)
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print(f"❌ {description} failed with error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Run the complete pipeline')
    parser.add_argument('keyword', help='Main keyword (e.g., "sofa", "chair", "table")')
    parser.add_argument('country', help='Country code (e.g., "de", "fr", "es")')
    parser.add_argument('--language', default='german', help='Language for AI processing (default: german)')
    parser.add_argument('--min-categories', type=int, default=25, help='Minimum categories to generate (default: 25)')
    parser.add_argument('--max-categories', type=int, default=40, help='Maximum categories to generate (default: 40)')
    parser.add_argument('--workers', type=int, default=40, help='Number of workers for AI enhancement (default: 40)')
    parser.add_argument('--skip-keywords', action='store_true', help='Skip keyword scraping step')
    parser.add_argument('--skip-products', action='store_true', help='Skip product scraping step')
    parser.add_argument('--skip-enhancement', action='store_true', help='Skip AI enhancement step')
    parser.add_argument('--skip-categories', action='store_true', help='Skip category enhancement step')
    
    args = parser.parse_args()
    
    # Determine market based on country
    market_map = {
        'de': 'de',
        'fr': 'fr', 
        'es': 'es',
        'it': 'it',
        'uk': 'uk',
        'us': 'us'
    }
    
    market = market_map.get(args.country.lower(), args.country.lower())
    
    print("🎯 Starting Pipeline")
    print(f"Keyword: {args.keyword}")
    print(f"Country: {args.country}")
    print(f"Market: {market}")
    print(f"Language: {args.language}")
    print("=" * 60)
    
    # Change to scripts directory if we're in root
    if os.path.basename(os.getcwd()) != 'scripts':
        os.chdir('scripts')
        print("📁 Changed to scripts directory")
    
    success_count = 0
    total_steps = 0
    
    # Step 1: Keyword Discovery
    if not args.skip_keywords:
        total_steps += 1
        command = f'python amazon-keyword-scraper.py "{args.keyword}" --market {market}'
        if run_command(command, "Step 1: Keyword Discovery"):
            success_count += 1
        else:
            print("⚠️  Continuing with next step...")
    
    # Step 2: Category Generation
    if not args.skip_keywords:
        total_steps += 1
        command = f'python ai-category-generator.py "{args.keyword}" --language {args.language} --min-categories {args.min_categories} --max-categories {args.max_categories}'
        if run_command(command, "Step 2: Category Generation"):
            success_count += 1
        else:
            print("⚠️  Continuing with next step...")
    
    # Step 3: Product Scraping
    if not args.skip_products:
        total_steps += 1
        command = f'python amazon-product-scraper.py --country {args.country}'
        if run_command(command, "Step 3: Product Scraping"):
            success_count += 1
        else:
            print("⚠️  Continuing with next step...")
    
    # Step 4: Create Category-Products Index
    if not args.skip_products:
        total_steps += 1
        command = 'python create-category-products-index.py'
        if run_command(command, "Step 4: Create Category-Products Index"):
            success_count += 1
        else:
            print("⚠️  Continuing with next step...")
    
    # Step 5: AI Product Enhancement
    if not args.skip_enhancement:
        total_steps += 1
        command = f'python ai-product-enhancer.py --language {args.language} --mode ultra-fast --workers {args.workers}'
        if run_command(command, "Step 5: AI Product Enhancement"):
            success_count += 1
        else:
            print("⚠️  Continuing with next step...")
    
    # Step 6: AI Category Enhancement
    if not args.skip_categories:
        total_steps += 1
        command = f'python ai_category_enhancer.py --language {args.language} --all'
        if run_command(command, "Step 6: AI Category Enhancement"):
            success_count += 1
        else:
            print("⚠️  Continuing with next step...")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 PIPELINE SUMMARY")
    print("=" * 60)
    print(f"✅ Successful steps: {success_count}/{total_steps}")
    print(f"❌ Failed steps: {total_steps - success_count}/{total_steps}")
    
    if success_count == total_steps:
        print("🎉 Pipeline completed successfully!")
        return 0
    elif success_count > 0:
        print("⚠️  Pipeline completed with some failures")
        return 1
    else:
        print("💥 Pipeline failed completely")
        return 2

if __name__ == "__main__":
    sys.exit(main())
