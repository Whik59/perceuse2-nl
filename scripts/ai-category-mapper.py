#!/usr/bin/env python3
"""
AI Category Mapper
Uses Gemini AI to organize keywords into hierarchical categories
"""

import google.generativeai as genai
import json
import sys
from datetime import datetime

def safe_print(message):
    """Print message with Unicode characters replaced for Windows compatibility"""
    if sys.platform == "win32":
        replacements = {
            '✅': '[OK]',
            '❌': '[ERROR]',
            '⚠️': '[WARNING]',
            '🤖': '[AI]',
            '📊': '[STATS]',
            '💾': '[SAVE]'
        }
        for unicode_char, replacement in replacements.items():
            message = message.replace(unicode_char, replacement)
    print(message)

class AICategoryMapper:
    def __init__(self, api_key="AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def load_keywords(self, file_path):
        """Load keywords from various file formats"""
        keywords = []
        
        try:
            if file_path.endswith('.json'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'keywords' in data:
                        keywords = data['keywords']
                    elif isinstance(data, list):
                        keywords = data
            
            elif file_path.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    keywords = [line.strip() for line in f if line.strip()]
            
            elif file_path.endswith('.csv'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Skip header if present
                    start_idx = 1 if lines and 'keyword' in lines[0].lower() else 0
                    keywords = [line.strip().strip('"') for line in lines[start_idx:] if line.strip()]
            
            safe_print(f"[OK] Loaded {len(keywords)} keywords from {file_path}")
            return keywords
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to load keywords: {e}")
            return []
    
    def create_categories_with_ai(self, keywords, batch_size=50):
        """Use AI to create hierarchical categories from keywords"""
        safe_print(f"[AI] Processing {len(keywords)} keywords with AI...")
        
        # Process in batches to avoid token limits
        all_categories = []
        category_id_counter = 1
        
        for i in range(0, len(keywords), batch_size):
            batch = keywords[i:i + batch_size]
            safe_print(f"[AI] Processing batch {i//batch_size + 1}: {len(batch)} keywords")
            
            batch_categories = self.process_batch(batch, category_id_counter)
            if batch_categories:
                all_categories.extend(batch_categories)
                category_id_counter += len(batch_categories)
        
        # Merge and deduplicate categories
        final_categories = self.merge_categories(all_categories)
        safe_print(f"[OK] Generated {len(final_categories)} final categories")
        
        return final_categories
    
    def process_batch(self, keywords, start_id):
        """Process a batch of keywords with AI"""
        keywords_str = "\n".join(keywords)
        
        prompt = f"""
Analyse ces mots-clés français et crée une structure de catégories hiérarchique (maximum 3 niveaux).
Concentre-toi sur les types de produits, marques, et caractéristiques principales.

MOTS-CLÉS:
{keywords_str}

RÈGLES:
1. Crée des catégories PRINCIPALES basées sur les types de produits (ex: "Friteuse Sans Huile", "Friteuse à Huile")
2. Crée des SOUS-CATÉGORIES basées sur les marques (ex: "Ninja", "Philips", "Moulinex")
3. Crée des SOUS-SOUS-CATÉGORIES pour les modèles spécifiques si mentionnés
4. Garde les noms courts et clairs
5. Pas de descriptions, juste la structure
6. categoryId commence à {start_id}

FORMAT JSON:
[
  {{
    "categoryId": {start_id},
    "categoryNameCanonical": "Friteuse Sans Huile",
    "parentCategoryId": null,
    "slug": "friteuse-sans-huile",
    "level": 0,
    "productCount": 0
  }},
  {{
    "categoryId": {start_id + 1},
    "categoryNameCanonical": "Ninja",
    "parentCategoryId": {start_id},
    "slug": "ninja",
    "level": 1,
    "productCount": 0
  }}
]

Réponds UNIQUEMENT avec le JSON, rien d'autre.
"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up the response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            
            categories = json.loads(result_text)
            safe_print(f"  [OK] AI generated {len(categories)} categories")
            return categories
            
        except Exception as e:
            safe_print(f"  [ERROR] AI processing failed: {e}")
            return []
    
    def merge_categories(self, all_categories):
        """Merge and deduplicate categories"""
        # Simple deduplication by name
        seen_names = set()
        unique_categories = []
        
        for category in all_categories:
            name = category.get('categoryNameCanonical', '').lower()
            if name and name not in seen_names:
                seen_names.add(name)
                unique_categories.append(category)
        
        # Reassign IDs sequentially
        for i, category in enumerate(unique_categories, 1):
            old_id = category['categoryId']
            category['categoryId'] = i
            
            # Update parent references
            for other_cat in unique_categories:
                if other_cat.get('parentCategoryId') == old_id:
                    other_cat['parentCategoryId'] = i
        
        return unique_categories
    
    def save_categories(self, categories, output_file="data/categories.json"):
        """Save categories to JSON file"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(categories, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[SAVE] Categories saved to: {output_file}")
            
            # Print summary
            levels = {}
            for cat in categories:
                level = cat.get('level', 0)
                levels[level] = levels.get(level, 0) + 1
            
            safe_print(f"[STATS] Category breakdown:")
            for level in sorted(levels.keys()):
                safe_print(f"  Level {level}: {levels[level]} categories")
            
            return True
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to save categories: {e}")
            return False

if __name__ == "__main__":
    import argparse
    import os
    
    parser = argparse.ArgumentParser(description="Create categories from keywords using AI")
    parser.add_argument('--keywords', default='data/keywords.txt', help='Path to keywords file (default: data/keywords.txt)')
    parser.add_argument('--output', default='data/categories.json', help='Output file path')
    args = parser.parse_args()
    
    safe_print("[START] AI Category Mapper")
    safe_print("=" * 50)
    
    # Check if keywords file exists
    if not os.path.exists(args.keywords):
        safe_print(f"[ERROR] Keywords file not found: {args.keywords}")
        safe_print("[INFO] Run the keyword scraper first to generate keywords.txt")
        sys.exit(1)
    
    mapper = AICategoryMapper()
    
    # Load keywords
    keywords = mapper.load_keywords(args.keywords)
    if not keywords:
        safe_print("[ERROR] No keywords loaded!")
        sys.exit(1)
    
    # Create categories
    categories = mapper.create_categories_with_ai(keywords)
    if not categories:
        safe_print("[ERROR] No categories generated!")
        sys.exit(1)
    
    # Save results
    if mapper.save_categories(categories, args.output):
        safe_print(f"\n[OK] Success! {len(categories)} categories created")
        safe_print(f"Categories saved to: {args.output}")
    else:
        safe_print("[ERROR] Failed to save categories!")
        sys.exit(1) 