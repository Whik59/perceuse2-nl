#!/usr/bin/env python3
"""
AI Category Generator using Gemini 2.5 Flash
Generates comprehensive category hierarchies based on keywords
"""

import json
import os
import re
import time
from datetime import datetime
import google.generativeai as genai

def safe_print(message):
    """Thread-safe print function that handles encoding issues"""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('utf-8', errors='ignore').decode('utf-8'))

class AICategoryGenerator:
    def __init__(self, api_key=None, language='french'):
        self.language = language
        self.api_key = api_key or "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
        
        # Language mapping
        self.language_map = {
            'french': 'French',
            'german': 'German', 
            'spanish': 'Spanish',
            'italian': 'Italian',
            'dutch': 'Dutch',
            'polish': 'Polish',
            'swedish': 'Swedish',
            'english': 'English',
            'portuguese': 'Portuguese',
            'russian': 'Russian',
            'chinese': 'Chinese',
            'japanese': 'Japanese',
            'korean': 'Korean'
        }
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-pro')
        
    def create_slug(self, text):
        """Create SEO-friendly slug from text"""
        slug = text.lower()
        
        # Handle accented characters
        slug = re.sub(r'[áàäâãāăą]', 'a', slug)
        slug = re.sub(r'[éèëêēĕėę]', 'e', slug)
        slug = re.sub(r'[íìïîīĭį]', 'i', slug)
        slug = re.sub(r'[óòöôõōŏő]', 'o', slug)
        slug = re.sub(r'[úùüûūŭůű]', 'u', slug)
        slug = re.sub(r'[ýỳÿŷ]', 'y', slug)
        slug = re.sub(r'[ñńņň]', 'n', slug)
        slug = re.sub(r'[çćĉċč]', 'c', slug)
        slug = re.sub(r'[ß]', 'ss', slug)
        
        # Remove special characters and replace spaces with hyphens
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        
        return slug
    
    def get_ai_response(self, prompt, max_retries=3):
        """Get response from Gemini AI with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                safe_print(f"[RETRY {attempt + 1}] AI request failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    raise Exception(f"AI request failed after {max_retries} attempts: {e}")
    
    def analyze_keywords(self, keyword):
        """Analyze existing keywords to understand search patterns"""
        # Try both possible paths depending on where script is run from
        keywords_file = "data/keywords.txt"
        if not os.path.exists(keywords_file):
            keywords_file = "../data/keywords.txt"
        try:
            with open(keywords_file, 'r', encoding='utf-8') as f:
                keywords = [line.strip() for line in f.readlines() if line.strip()]
            
            # Filter keywords related to our main keyword
            related_keywords = [kw for kw in keywords if keyword.lower() in kw.lower()]
            
            safe_print(f"📊 Found {len(related_keywords)} related keywords for '{keyword}'")
            return related_keywords[:30]  # Limit to first 30 for analysis to avoid prompt length issues
        except FileNotFoundError:
            safe_print(f"⚠️ Keywords file not found at {keywords_file}")
            return []
    
    def generate_categories(self, keyword, min_categories=40, max_categories=70):
        """Generate comprehensive category hierarchy based on real Amazon search intent"""
        language_name = self.language_map.get(self.language, self.language.title())
        
        # Analyze existing keywords first
        related_keywords = self.analyze_keywords(keyword)
        
        # Create keyword context for AI
        keyword_context = ""
        if related_keywords:
            keyword_context = f"""
REAL AMAZON KEYWORDS ANALYSIS:
Here are actual keywords scraped from Amazon for "{keyword}" products:
{', '.join(related_keywords[:20])}

Use these real search terms to understand:
- What materials people actually search for (bois, metal, plastique, velours, etc.)
- What features are most important to buyers (pliante, ergonomique, gaming, etc.)
- What use cases are most common (bureau, salle a manger, camping, etc.)
- What naming patterns customers use
"""
        
        prompt = f"""You are an expert Amazon SEO specialist and e-commerce analyst. Generate a practical category hierarchy for "{keyword}" products in {language_name} based on REAL Amazon search patterns and actual buyer behavior.

{keyword_context}

CORE PRINCIPLES:
1. Focus on MATERIALS, FEATURES, and USE CASES that people actually search for
2. Use simple, direct naming that matches Amazon's category structure
3. Prioritize high-search-volume terms over trendy or poetic names
4. Keep subcategories practical and specific to real product variations

CATEGORY STRUCTURE RULES:
- Generate EXACTLY between {min_categories} and {max_categories} main categories (MANDATORY RANGE)
- Each main category: 3-5 subcategories maximum
- Subcategories should be MATERIAL-BASED or FEATURE-BASED, not style-based
- Use consistent naming patterns throughout
- DO NOT generate fewer than {min_categories} categories - this is a hard requirement

NAMING PATTERNS TO FOLLOW:
Main Category: "[Product Type] de [Use Case]" or "[Product Type] [Material/Feature]"
Subcategory: "[Product Type] [Material/Feature] pour [Use Case]" or "[Product Type] en [Material]" or "[Product Type] [Specific Feature]"

EXAMPLES OF GOOD SUBCATEGORY NAMES:
- "Chaises Transparentes pour Salle à Manger"
- "Chaises en Bois pour Bureau" 
- "Chaises Pliantes pour Camping"
- "Chaises Ergonomiques pour Gaming"

EXAMPLES OF GOOD CATEGORIES WITH PROPER SUBCATEGORY NAMES:
- "Chaises de Salle à Manger" → "Chaises en Bois pour Salle à Manger", "Chaises en Velours pour Salle à Manger", "Chaises avec Accoudoirs pour Salle à Manger"
- "Chaises de Bureau" → "Chaises Ergonomiques pour Bureau", "Chaises en Cuir pour Bureau", "Chaises à Roulettes pour Bureau"
- "Chaises de Jardin" → "Chaises en Plastique pour Jardin", "Chaises Pliantes pour Jardin", "Chaises en Métal pour Jardin"

AVOID:
- Poetic or trendy names without search volume
- Overly specific micro-categories
- Style-based subcategories (unless high search volume)
- Duplicate or overlapping categories

OUTPUT FORMAT (JSON):
{{
  "categories": [
    {{
      "slug": "category-slug",
      "name": "Category Name",
      "description": "Brief practical description focusing on materials and use cases",
      "subcategories": [
        {{
          "slug": "subcategory-slug",
          "name": "Subcategory Name", 
          "description": "Brief description of material/feature/use case"
        }}
      ]
    }}
  ]
}}

IMPORTANT REQUIREMENTS:
- You MUST generate at least {min_categories} categories - this is non-negotiable.
- If you need more categories, consider: price ranges, brands, sizes, colors, specific use cases, professional vs consumer, etc.
- Base categories on actual Amazon product listings and customer search patterns.
- Focus on products that customers actually buy.

Generate categories that reflect how customers actually search for "{keyword}" products on Amazon, focusing on materials, features, and practical use cases.

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:"""
        
        safe_print(f"🤖 Generating categories for keyword: '{keyword}' (AI will determine optimal number)")
        safe_print(f"🌍 Language: {language_name}")
        safe_print(f"📊 Target range: {min_categories}-{max_categories} categories")
        safe_print("=" * 60)
        
        try:
            response = self.get_ai_response(prompt)
            
            # Clean up response
            response = response.strip()
            if '```json' in response:
                response = re.sub(r'```json\s*', '', response)
            if '```' in response:
                response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
            
            # Parse JSON
            data = json.loads(response)
            categories = data.get('categories', [])
            
            # Process and validate categories
            processed_categories = []
            for category in categories:
                # Create slug if not provided
                category_slug = category.get('slug', self.create_slug(category['name']))
                
                # Process subcategories
                subcategories = []
                for subcat in category.get('subcategories', []):
                    subcat_slug = subcat.get('slug', self.create_slug(subcat['name']))
                    subcategories.append({
                        'slug': subcat_slug,
                        'name': subcat['name'],
                        'description': subcat.get('description', '')
                    })
                
                processed_categories.append({
                    'slug': category_slug,
                    'name': category['name'],
                    'description': category.get('description', ''),
                    'subcategories': subcategories
                })
            
            safe_print(f"✅ Generated {len(processed_categories)} categories")
            return processed_categories
            
        except Exception as e:
            safe_print(f"❌ Error generating categories: {e}")
            return []
    
    def save_categories(self, categories, output_file=None):
        """Save categories to JSON file"""
        if not output_file:
            # Try both possible paths depending on where script is run from
            output_file = "data/categories.json"
            if not os.path.exists("data"):
                output_file = "../data/categories.json"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(categories, f, indent=2, ensure_ascii=False)
            
            safe_print(f"💾 Categories saved to: {output_file}")
            return output_file
            
        except Exception as e:
            safe_print(f"❌ Error saving categories: {e}")
            return None
    
    def print_summary(self, categories):
        """Print summary of generated categories"""
        total_categories = len(categories)
        total_subcategories = sum(len(cat['subcategories']) for cat in categories)
        
        safe_print("\n📊 GENERATION SUMMARY")
        safe_print("=" * 40)
        safe_print(f"Main Categories: {total_categories}")
        safe_print(f"Subcategories: {total_subcategories}")
        safe_print(f"Total Categories: {total_categories + total_subcategories}")
        
        # Show first few categories as examples
        safe_print("\n🔍 SAMPLE CATEGORIES:")
        for i, category in enumerate(categories[:5]):
            safe_print(f"\n{i+1}. {category['name']} ({category['slug']})")
            safe_print(f"   Description: {category['description']}")
            safe_print(f"   Subcategories ({len(category['subcategories'])}):")
            for subcat in category['subcategories'][:3]:  # Show first 3
                safe_print(f"     - {subcat['name']} ({subcat['slug']})")
            if len(category['subcategories']) > 3:
                safe_print(f"     ... and {len(category['subcategories']) - 3} more")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Category Generator using Gemini 2.5 Pro')
    parser.add_argument('keyword', help='Main keyword to generate categories for')
    parser.add_argument('--language', '-l', default='french', 
                       choices=['french', 'german', 'spanish', 'italian', 'dutch', 'polish', 'swedish', 'english', 'portuguese', 'russian', 'chinese', 'japanese', 'korean'],
                       help='Output language (default: french)')
    parser.add_argument('--min-categories', type=int, default=40,
                       help='Minimum number of main categories (default: 40)')
    parser.add_argument('--max-categories', type=int, default=70,
                       help='Maximum number of main categories (default: 70)')
    parser.add_argument('--output', '-o', 
                       help='Output file path (default: auto-generated)')
    
    args = parser.parse_args()
    
    # Initialize generator
    generator = AICategoryGenerator(language=args.language)
    
    # Generate categories
    categories = generator.generate_categories(
        keyword=args.keyword,
        min_categories=args.min_categories,
        max_categories=args.max_categories
    )
    
    if categories:
        # Save to file
        output_file = generator.save_categories(categories, args.output)
        
        # Print summary
        generator.print_summary(categories)
        
        if output_file:
            safe_print(f"\n🎉 Success! Categories generated and saved to: {output_file}")
        else:
            safe_print("\n⚠️ Categories generated but could not save to file")
    else:
        safe_print("\n❌ Failed to generate categories")

if __name__ == "__main__":
    main()
