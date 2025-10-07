#!/usr/bin/env python3
"""
Sitemap Generator for Airfryer Kaufen
Generates a sitemap.xml file with categories and products URLs
"""

import json
import os
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any
import argparse

# Configuration
SITE_URL = "https://airfryer-kaufen.com"  # Update this to your actual domain
SITEMAP_FILE = "public/sitemap.xml"
CATEGORIES_FILE = "data/categories.json"
PRODUCTS_DIR = "data/products"

# Priority settings
PRIORITY_HOMEPAGE = 1.0
PRIORITY_CATEGORIES = 0.8
PRIORITY_PRODUCTS = 0.6

# Change frequency settings
CHANGEFREQ_HOMEPAGE = "daily"
CHANGEFREQ_CATEGORIES = "weekly"
CHANGEFREQ_PRODUCTS = "monthly"

def load_categories(categories_file: str) -> List[Dict[str, Any]]:
    """Load categories from JSON file"""
    try:
        with open(categories_file, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        print(f"Loaded {len(categories)} categories")
        return categories
    except FileNotFoundError:
        print(f"Error: {categories_file} not found")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing categories JSON: {e}")
        return []

def load_products(products_dir: str) -> List[Dict[str, Any]]:
    """Load all products from JSON files"""
    products = []
    
    if not os.path.exists(products_dir):
        print(f"Error: {products_dir} directory not found")
        return products
    
    product_files = [f for f in os.listdir(products_dir) if f.endswith('.json')]
    print(f"Found {len(product_files)} product files")
    
    for filename in product_files:
        try:
            filepath = os.path.join(products_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                product = json.load(f)
                products.append(product)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading {filename}: {e}")
            continue
    
    print(f"Successfully loaded {len(products)} products")
    return products

def create_url_element(urlset: ET.Element, url: str, priority: float, changefreq: str, lastmod: str = None) -> None:
    """Create a URL element and add it to the urlset"""
    url_elem = ET.SubElement(urlset, "url")
    
    # URL
    loc_elem = ET.SubElement(url_elem, "loc")
    loc_elem.text = url
    
    # Last modification date
    if lastmod:
        lastmod_elem = ET.SubElement(url_elem, "lastmod")
        lastmod_elem.text = lastmod
    
    # Change frequency
    changefreq_elem = ET.SubElement(url_elem, "changefreq")
    changefreq_elem.text = changefreq
    
    # Priority
    priority_elem = ET.SubElement(url_elem, "priority")
    priority_elem.text = str(priority)

def generate_sitemap(categories: List[Dict[str, Any]], products: List[Dict[str, Any]]) -> str:
    """Generate sitemap XML content"""
    
    # Create root element
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    
    # Add homepage
    create_url_element(
        urlset, 
        SITE_URL, 
        PRIORITY_HOMEPAGE, 
        CHANGEFREQ_HOMEPAGE,
        datetime.now().strftime("%Y-%m-%d")
    )
    
    # Add categories page
    create_url_element(
        urlset,
        f"{SITE_URL}/categories",
        PRIORITY_CATEGORIES,
        CHANGEFREQ_CATEGORIES,
        datetime.now().strftime("%Y-%m-%d")
    )
    
    # Add individual category pages
    for category in categories:
        if category.get('slug'):
            category_url = f"{SITE_URL}/category/{category['slug']}"
            create_url_element(
                urlset,
                category_url,
                PRIORITY_CATEGORIES,
                CHANGEFREQ_CATEGORIES,
                datetime.now().strftime("%Y-%m-%d")
            )
    
    # Add individual product pages
    for product in products:
        if product.get('slug'):
            product_url = f"{SITE_URL}/product/{product['slug']}"
            create_url_element(
                urlset,
                product_url,
                PRIORITY_PRODUCTS,
                CHANGEFREQ_PRODUCTS,
                datetime.now().strftime("%Y-%m-%d")
            )
    
    # Convert to string with proper formatting
    ET.indent(urlset, space="  ", level=0)
    xml_str = ET.tostring(urlset, encoding='unicode', xml_declaration=True)
    
    return xml_str

def save_sitemap(xml_content: str, output_file: str) -> None:
    """Save sitemap to file"""
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(xml_content)
        
        print(f"Sitemap saved to: {output_file}")
        
        # Get file size
        file_size = os.path.getsize(output_file)
        print(f"File size: {file_size:,} bytes")
        
    except IOError as e:
        print(f"Error saving sitemap: {e}")

def generate_robots_txt(site_url: str, sitemap_url: str) -> str:
    """Generate robots.txt content"""
    robots_content = f"""User-agent: *
Allow: /

# Sitemap
Sitemap: {sitemap_url}

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /scripts/
Disallow: /data/

# Allow important pages
Allow: /
Allow: /categories
Allow: /category/
Allow: /product/
"""
    return robots_content

def save_robots_txt(content: str, output_file: str) -> None:
    """Save robots.txt to file"""
    try:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Robots.txt saved to: {output_file}")
        
    except IOError as e:
        print(f"Error saving robots.txt: {e}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Generate sitemap.xml and robots.txt for Airfryer Kaufen')
    parser.add_argument('--site-url', default=SITE_URL, help='Site URL (default: https://airfryer-kaufen.com)')
    parser.add_argument('--sitemap-output', default=SITEMAP_FILE, help='Sitemap output file path (default: public/sitemap.xml)')
    parser.add_argument('--robots-output', default='public/robots.txt', help='Robots.txt output file path (default: public/robots.txt)')
    parser.add_argument('--categories', default=CATEGORIES_FILE, help='Categories JSON file path')
    parser.add_argument('--products-dir', default=PRODUCTS_DIR, help='Products directory path')
    
    args = parser.parse_args()
    
    # Use command line arguments
    site_url = args.site_url
    sitemap_file = args.sitemap_output
    robots_file = args.robots_output
    categories_file = args.categories
    products_dir = args.products_dir
    
    print("=" * 50)
    print("Airfryer Kaufen SEO Generator")
    print("=" * 50)
    print(f"Site URL: {site_url}")
    print(f"Sitemap output: {sitemap_file}")
    print(f"Robots.txt output: {robots_file}")
    print(f"Categories file: {categories_file}")
    print(f"Products directory: {products_dir}")
    print()
    
    # Load data
    print("Loading data...")
    categories = load_categories(categories_file)
    products = load_products(products_dir)
    
    if not categories and not products:
        print("No data found. Exiting.")
        return
    
    # Generate sitemap
    print("\nGenerating sitemap...")
    xml_content = generate_sitemap(categories, products)
    
    # Save sitemap
    print("\nSaving sitemap...")
    save_sitemap(xml_content, sitemap_file)
    
    # Generate robots.txt
    print("\nGenerating robots.txt...")
    sitemap_url = f"{site_url}/sitemap.xml"
    robots_content = generate_robots_txt(site_url, sitemap_url)
    
    # Save robots.txt
    print("Saving robots.txt...")
    save_robots_txt(robots_content, robots_file)
    
    # Summary
    print("\n" + "=" * 50)
    print("SEO FILES GENERATION COMPLETE")
    print("=" * 50)
    print(f"Total URLs in sitemap: {1 + 1 + len(categories) + len(products)}")  # homepage + categories page + categories + products
    print(f"- Homepage: 1")
    print(f"- Categories page: 1")
    print(f"- Category pages: {len(categories)}")
    print(f"- Product pages: {len(products)}")
    print(f"\nFiles generated:")
    print(f"- Sitemap: {sitemap_file}")
    print(f"- Robots.txt: {robots_file}")

if __name__ == "__main__":
    main()
