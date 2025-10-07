#!/usr/bin/env python3
"""
AI-Powered Category Organizer
Uses AI to intelligently categorize keywords and create a clean category hierarchy.
"""

import json
import os
import re
from datetime import datetime
from collections import defaultdict

def load_keywords_from_file(filepath):
    """Load keywords from a text file, one per line"""
    keywords = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    keywords.append(line)
    except FileNotFoundError:
        print(f"Warning: File {filepath} not found")
        return []
    
    return keywords

def analyze_keywords_with_ai(keywords):
    """
    Analyze keywords and create a hierarchical structure using AI-like logic.
    This function groups keywords into main categories and subcategories.
    """
    
    # Define main category patterns and their subcategories
    category_patterns = {
        # Material-based categories
        "airfryer acero": {
            "keywords": ["acero", "inox", "inoxidable", "stainless steel", "metal"],
            "subcategories": []
        },
        "airfryer cristal": {
            "keywords": ["cristal", "glass", "vidrio", "transparente"],
            "subcategories": []
        },
        "airfryer ceramica": {
            "keywords": ["ceramic", "ceramica", "non toxic", "sin toxicos"],
            "subcategories": []
        },
        
        # Brand-based categories
        "airfryer ninja": {
            "keywords": ["ninja"],
            "subcategories": []
        },
        "airfryer philips": {
            "keywords": ["philips", "phillips"],
            "subcategories": []
        },
        "airfryer cosori": {
            "keywords": ["cosori"],
            "subcategories": []
        },
        "airfryer xiaomi": {
            "keywords": ["xiaomi"],
            "subcategories": []
        },
        "airfryer cecotec": {
            "keywords": ["cecotec"],
            "subcategories": []
        },
        "airfryer moulinex": {
            "keywords": ["moulinex"],
            "subcategories": []
        },
        "airfryer russell hobbs": {
            "keywords": ["russell", "hobbs"],
            "subcategories": []
        },
        
        # Size-based categories
        "airfryer mini": {
            "keywords": ["mini", "pequeña", "small", "3l", "3,5l", "4l"],
            "subcategories": []
        },
        "airfryer grande": {
            "keywords": ["grande", "xl", "xxl", "large", "10l", "8l", "6l", "5l"],
            "subcategories": []
        },
        
        # Feature-based categories
        "airfryer dual": {
            "keywords": ["dual", "doble", "double", "dupla", "dos cestas", "dos compartimentos"],
            "subcategories": []
        },
        "airfryer digital": {
            "keywords": ["digital", "smart", "programmable"],
            "subcategories": []
        },
        "airfryer sin aceite": {
            "keywords": ["sin aceite", "no usa aceite", "oil free"],
            "subcategories": []
        },
        
        # Color-based categories
        "airfryer blanca": {
            "keywords": ["blanca", "white"],
            "subcategories": []
        },
        "airfryer negra": {
            "keywords": ["negra", "black"],
            "subcategories": []
        },
        
        # Accessories
        "airfryer accesorios": {
            "keywords": ["accesorios", "accessories", "paper", "papel", "liner", "gloves", "tools", "rack", "protector"],
            "subcategories": []
        },
        
        # Special features
        "airfryer horno": {
            "keywords": ["horno", "oven", "combo", "y horno"],
            "subcategories": []
        },
        "airfryer grill": {
            "keywords": ["grill", "with grill"],
            "subcategories": []
        }
    }
    
    # Process each keyword and assign it to categories
    keyword_assignments = defaultdict(list)
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        assigned = False
        
        # Check each category pattern
        for category_name, category_data in category_patterns.items():
            for pattern in category_data["keywords"]:
                if pattern in keyword_lower:
                    keyword_assignments[category_name].append(keyword)
                    assigned = True
                    break
            if assigned:
                break
        
        # If no specific category found, try to infer from keyword structure
        if not assigned:
            # Extract potential brand names (words that appear after "airfryer")
            words = keyword_lower.split()
            if len(words) > 1 and words[0] == "airfryer":
                potential_brand = words[1]
                
                # Check if it's a brand we haven't categorized yet
                if len(potential_brand) > 2 and potential_brand not in [cat.split()[-1] for cat in category_patterns.keys()]:
                    brand_category = f"airfryer {potential_brand}"
                    if brand_category not in category_patterns:
                        category_patterns[brand_category] = {
                            "keywords": [potential_brand],
                            "subcategories": []
                        }
                    keyword_assignments[brand_category].append(keyword)
                    assigned = True
        
        # If still not assigned, put in a general category
        if not assigned:
            keyword_assignments["airfryer general"].append(keyword)
    
    return keyword_assignments, category_patterns

def create_category_structure(keyword_assignments, category_patterns):
    """
    Create the final category JSON structure
    """
    categories_json = []
    category_id_counter = 1
    
    # Create main categories
    for category_name, keywords in keyword_assignments.items():
        if not keywords:  # Skip empty categories
            continue
            
        # Create slug from category name
        slug = re.sub(r'[^a-z0-9]+', '-', category_name.lower()).strip('-')
        
        # Determine if this category should have subcategories
        has_subcategories = len(keywords) > 5  # If more than 5 keywords, create subcategories
        
        # Create main category (level 0)
        parent_category_id = category_id_counter
        category_obj = {
            "categoryId": parent_category_id,
            "categoryNameCanonical": category_name,
            "parentCategoryId": None,
            "slug": slug,
            "level": 0,
            "description": f"Explore our selection of {category_name}",
            "productCount": 0,
            "seo": {
                "title": f"{category_name.title()} - Best Products & Reviews",
                "description": f"Find the best {category_name} products with detailed reviews and comparisons. Free shipping and best prices guaranteed.",
                "keywords": [category_name.lower(), "productos", "mejores", "ofertas"]
            },
            "has_subcategories": has_subcategories,
            "needs_products": not has_subcategories,
            "recommended_products": 0 if has_subcategories else 15,
            "scraping_strategy": "subcategories" if has_subcategories else "direct"
        }
        
        categories_json.append(category_obj)
        category_id_counter += 1
        
        # Create subcategories if needed
        if has_subcategories:
            # Group keywords into logical subcategories
            subcategories = group_keywords_into_subcategories(keywords)
            
            for subcat_name, subcat_keywords in subcategories.items():
                subcat_slug = re.sub(r'[^a-z0-9]+', '-', subcat_name.lower()).strip('-')
                
                subcat_obj = {
                    "categoryId": category_id_counter,
                    "categoryNameCanonical": subcat_name,
                    "parentCategoryId": parent_category_id,
                    "slug": subcat_slug,
                    "level": 1,
                    "description": f"Discover {subcat_name} with detailed product information and reviews",
                    "productCount": 0,
                    "seo": {
                        "title": f"{subcat_name.title()} - Expert Reviews & Best Deals",
                        "description": f"Compare {subcat_name} products with expert reviews. Find the best deals and free shipping options.",
                        "keywords": [subcat_name.lower(), category_name.lower(), "productos", "mejores"]
                    },
                    "has_subcategories": False,
                    "needs_products": True,
                    "recommended_products": 5,
                    "scraping_strategy": "direct"
                }
                
                categories_json.append(subcat_obj)
                category_id_counter += 1
    
    return categories_json

def group_keywords_into_subcategories(keywords):
    """
    Group keywords into logical subcategories based on patterns
    """
    subcategories = defaultdict(list)
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        
        # Size-based grouping
        if any(size in keyword_lower for size in ["mini", "pequeña", "small", "3l", "3,5l", "4l"]):
            subcategories["airfryer mini"].append(keyword)
        elif any(size in keyword_lower for size in ["grande", "xl", "xxl", "large", "10l", "8l", "6l", "5l"]):
            subcategories["airfryer grande"].append(keyword)
        
        # Material-based grouping
        elif any(material in keyword_lower for material in ["cristal", "glass", "vidrio"]):
            subcategories["airfryer cristal"].append(keyword)
        elif any(material in keyword_lower for material in ["acero", "inox", "inoxidable", "stainless"]):
            subcategories["airfryer acero"].append(keyword)
        
        # Feature-based grouping
        elif any(feature in keyword_lower for feature in ["dual", "doble", "double"]):
            subcategories["airfryer dual"].append(keyword)
        elif any(feature in keyword_lower for feature in ["digital", "smart"]):
            subcategories["airfryer digital"].append(keyword)
        
        # Color-based grouping
        elif any(color in keyword_lower for color in ["blanca", "white"]):
            subcategories["airfryer blanca"].append(keyword)
        elif any(color in keyword_lower for color in ["negra", "black"]):
            subcategories["airfryer negra"].append(keyword)
        
        # Default grouping
        else:
            subcategories["airfryer general"].append(keyword)
    
    return dict(subcategories)

# Backup functionality removed as requested

def main():
    """Main function to process keywords and create AI-organized hierarchy"""
    print("🤖 Starting AI-Powered Category Organizer...")
    
    # File paths
    keywords_file = "data/keywords.txt"
    output_file = "data/categories.json"
    
    # Load keywords
    print("📖 Loading keywords...")
    keywords = load_keywords_from_file(keywords_file)
    print(f"   Found {len(keywords)} keywords")
    
    if not keywords:
        print("❌ No keywords loaded. Please check file path and content.")
        return
    
    # Analyze keywords with AI-like logic
    print("🧠 Analyzing keywords with AI logic...")
    keyword_assignments, category_patterns = analyze_keywords_with_ai(keywords)
    
    # Show analysis results
    print(f"\n📊 Analysis Results:")
    for category, keywords_list in keyword_assignments.items():
        print(f"   {category}: {len(keywords_list)} keywords")
        if len(keywords_list) <= 5:  # Show keywords for small categories
            print(f"      Keywords: {keywords_list}")
    
    # Create category structure
    print("\n📝 Building category structure...")
    categories_json = create_category_structure(keyword_assignments, category_patterns)
    
    # Statistics
    main_categories = [cat for cat in categories_json if cat['level'] == 0]
    subcategories = [cat for cat in categories_json if cat['level'] == 1]
    categories_with_subcats = len([cat for cat in main_categories if cat['has_subcategories']])
    
    print(f"\n📊 Final Structure:")
    print(f"   Total main categories: {len(main_categories)}")
    print(f"   Categories with subcategories: {categories_with_subcats}")
    print(f"   Total subcategories: {len(subcategories)}")
    print(f"   Total entries: {len(categories_json)}")
    
    # Show examples
    print(f"\n🔍 Examples:")
    for i, cat in enumerate(categories_json[:8]):  # Show first 8 entries
        level_icon = "📂" if cat['level'] == 0 else "  └─ 📄"
        parent_info = f" (parent: {cat['parentCategoryId']})" if cat['parentCategoryId'] else ""
        print(f"   {level_icon} ID:{cat['categoryId']} {cat['categoryNameCanonical']}{parent_info}")
    
    # Save new structure directly (no backup)
    print(f"\n💾 Saving AI-organized categories to {output_file}...")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(categories_json, f, indent=2, ensure_ascii=False)
        print("✅ AI-organized categories saved successfully!")
        
    except Exception as e:
        print(f"❌ Failed to save categories: {e}")

if __name__ == "__main__":
    main()
