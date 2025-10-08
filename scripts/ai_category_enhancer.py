#!/usr/bin/env python3
"""
AI Category Enhancer
Generates individual JSON files with SEO-optimized descriptions for each category
"""

import json
import os
import re
from datetime import datetime
import time
import random
from pathlib import Path
import concurrent.futures
import threading

def safe_print(message):
    """Thread-safe print function that handles encoding issues"""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('utf-8', errors='ignore').decode('utf-8'))

class AICategoryEnhancer:
    def __init__(self, output_language='german'):
        self.categories_file = "data/categories.json"
        self.categories_dir = "data/categories"
        self.config_file = "scripts/ai-config.json"
        self.output_language = output_language  # Language for output content
        
        # Language mapping for better AI understanding
        self.language_map = {
            'german': 'German',
            'spanish': 'Spanish', 
            'french': 'French',
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
        
        # Create directories if they don't exist
        os.makedirs(self.categories_dir, exist_ok=True)
        
        # Load AI configuration
        self.ai_config = self.load_ai_config()
        
        # Performance settings - ULTRA-FAST MODE
        self.request_delay = 0  # NO DELAY
        self.batch_size = 100  # Process 100 categories at once
        self.max_concurrent = 50  # Maximum concurrency - INCREASED
    
    def load_ai_config(self):
        """Load AI configuration from config file"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            safe_print(f"[WARNING] Could not load AI config: {e}")
        
        # Default fallback config
        return {
            "seo_settings": {
                "default_price": "from 19€",
                "store_name": "Your Store"
            }
        }
    
    def get_product_keywords(self):
        """Get product-specific keywords from config"""
        return self.ai_config.get("keywords", ["products", "best price", "offer", "free shipping", "warranty", "quality", "easy use"])
    
    def get_default_price(self):
        """Get default price from config"""
        return self.ai_config.get("seo_settings", {}).get("default_price", "from 19€")
    
    def get_ai_response(self, prompt, max_retries=3):
        """
        Get AI response using Google Gemini 2.5 Flash
        """
        try:
            import google.generativeai as genai
            
            # Configure Gemini with your API key
            API_KEY = "AIzaSyBdYz04o9vVORDLQ56eDGwMEFpjccIGWtQ"
            
            if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
                safe_print("[ERROR] Please set your Gemini API key in the script!")
                return self.get_fallback_response(prompt)
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # System prompt for SEO expert (in English)
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            system_prompt = f"You are an expert SEO and digital marketing specialist for e-commerce products. Always respond in {language_name} with clear, persuasive, and SEO-optimized content. Focus on product categories and airfryer-related content."
            
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # No delay for maximum speed
            
            response = model.generate_content(full_prompt)
            
            if response and response.text:
                return response.text.strip()
            else:
                return self.get_fallback_response(prompt)
                
        except ImportError:
            safe_print("[ERROR] Google AI library not installed!")
            safe_print("[INSTALL] Run: pip install google-generativeai")
            return self.get_fallback_response(prompt)
        except Exception as e:
            safe_print(f"[ERROR] Gemini request failed: {e}")
            return self.get_fallback_response(prompt)
    
    
    def enhance_category_description(self, category_name):
        """Generate SEO-optimized description for a category"""
        keywords = self.get_product_keywords()
        default_price = self.get_default_price()
        
        prompt = f"""Create a short SEO description (maximum 80 characters) for: {category_name}

REQUIREMENTS:
- Include key benefits for the product
- Mention price ({default_price})
- Create urgency (free shipping)
- Target buyers
- Use relevant keywords: {', '.join(keywords[:3])}

EXAMPLE: "{category_name} ✅ Premium Quality. {default_price} Free Shipping!"

Respond ONLY with the description:"""
        
        return self.get_ai_response(prompt)
    
    def enhance_category_title(self, category_name):
        """Generate SEO-optimized title for a category"""
        keywords = self.get_product_keywords()
        
        prompt = f"""Create a short SEO title (maximum 50 characters) for: {category_name}

REQUIREMENTS:
- Include main keywords
- Mention key product benefits
- Target buyers
- Use keywords: {', '.join(keywords[:2])}

EXAMPLE: "{category_name} | Premium Quality"

Respond ONLY with the title:"""
        
        return self.get_ai_response(prompt)
    
    def enhance_category_keywords(self, category_name):
        """Generate SEO keywords for a category"""
        keywords = self.get_product_keywords()
        
        prompt = f"""Generate 5 SEO keywords for: {category_name}

REQUIREMENTS:
- Include long-tail terms
- Mention key product benefits
- Include geographic terms (country-specific)
- Include purchase terms (cheap, offer)
- Based on existing keywords: {', '.join(keywords[:3])}

Format: keyword1, keyword2, keyword3, etc.
Respond ONLY with the keywords:"""
        
        response = self.get_ai_response(prompt)
        # Convert to array
        keywords = [kw.strip() for kw in response.split(',') if kw.strip()]
        return keywords[:5]  # Limit to 5 keywords
    
    def generate_category_faq(self, category_name):
        """Generate FAQ for a category"""
        keywords = self.get_product_keywords()
        
        prompt = f"""Create exactly 3 specific FAQ questions for: {category_name}

REQUIREMENTS:
- Questions people search on Google about {category_name}
- Specific and useful answers (maximum 50 words)
- Focus on specific product benefits
- Avoid keyword repetition
- Valid JSON format MANDATORY
- Consider keywords: {', '.join(keywords[:2])}

EXAMPLE:
[
  {{"question": "What is the battery life of airfryer?", "answer": "Airfryers have battery life of 15-30km depending on model and battery."}},
  {{"question": "Is airfryer easy to use?", "answer": "Yes, airfryers are very easy to use with automatic acceleration."}},
  {{"question": "Is there warranty on airfryers?", "answer": "Yes, all our airfryers include complete 2-year warranty."}}
]

IMPORTANT: Respond ONLY with valid JSON, no additional text:"""
        
        # Retry up to 3 times to get valid JSON
        for attempt in range(3):
            try:
                response = self.get_ai_response(prompt)
                
                # Clean the response - remove any markdown formatting
                clean_response = response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response.replace('```json', '').replace('```', '').strip()
                elif clean_response.startswith('```'):
                    clean_response = clean_response.replace('```', '').strip()
                
                # Try to find JSON array in the response
                if '[' in clean_response and ']' in clean_response:
                    json_match = re.search(r'\[.*\]', clean_response, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        parsed = json.loads(json_str)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            safe_print(f"[SUCCESS] Generated {len(parsed)} FAQ items for {category_name}")
                            return parsed
                
                safe_print(f"[RETRY {attempt + 1}/3] Invalid JSON format for {category_name}")
                safe_print(f"[DEBUG] Response: {response[:200]}...")
                
            except Exception as e:
                safe_print(f"[RETRY {attempt + 1}/3] Exception for {category_name}: {e}")
        
        # If all retries failed, raise an exception
        raise Exception(f"Failed to generate valid FAQ JSON for {category_name} after 3 attempts")
    
    def generate_category_content(self, category_name):
        """Generate concise SEO content for a category"""
        keywords = self.get_product_keywords()
        default_price = self.get_default_price()
        
        prompt = f"""Create very short SEO content (100-150 words) for: {category_name}

REQUIREMENTS:
- Simple HTML structure
- Include key product benefits
- Mention price ({default_price})
- Target buyers
- Avoid excessive keyword repetition
- Focus on products, not text
- Use keywords: {', '.join(keywords[:3])}

STRUCTURE:
<div>
<h2>Best {category_name}</h2>
<p>Discover the best {category_name} designed for maximum quality and ease of use.</p>
<h3>Key Features</h3>
<ul><li>Premium quality</li><li>Easy to use</li><li>Warranty included</li><li>Free shipping</li></ul>
<p>{default_price} with free shipping. Find the perfect model for you!</p>
</div>

Respond ONLY with the HTML:"""
        
        response = self.get_ai_response(prompt)
        
        # Clean HTML response
        response = response.strip()
        if '```html' in response:
            response = re.sub(r'```html\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        # Ensure proper HTML structure
        if not response.startswith('<div'):
            response = f"<div>\n{response}"
        if not response.endswith('</div>'):
            response = f"{response}\n</div>"
            
        return response
    
    
    def enhance_single_category_fast(self, category, index):
        """Enhance a single category with all content in one go for maximum speed"""
        try:
            category_name = category.get('categoryNameCanonical', f'Category {index}')
            category_id = category.get('categoryId', index)
            
            # Generate all content in one AI call for maximum speed
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            keywords = self.get_product_keywords()
            default_price = self.get_default_price()
            
            prompt = f"""Generate complete SEO content for: {category_name}

REQUIREMENTS:
- Language: {language_name}
- Product type: airfryer
- Price: {default_price}
- Keywords: {', '.join(keywords[:3])}

RESPOND WITH JSON ONLY:
{{
  "title": "SEO title (max 60 chars)",
  "description": "SEO description (max 80 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "faq": [
    {{"question": "Question 1", "answer": "Answer 1"}},
    {{"question": "Question 2", "answer": "Answer 2"}},
    {{"question": "Question 3", "answer": "Answer 3"}}
  ],
  "content": "<div><h2>Title</h2><p>Content</p></div>"
}}

IMPORTANT: Respond ONLY with valid JSON, no additional text."""
            
            try:
                response = self.get_ai_response(prompt)
                
                # Clean response
                clean_response = response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response.replace('```json', '').replace('```', '').strip()
                elif clean_response.startswith('```'):
                    clean_response = clean_response.replace('```', '').strip()
                
                # Extract JSON
                if '{' in clean_response and '}' in clean_response:
                    json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        content = json.loads(json_str)
                    else:
                        raise Exception("No JSON found in response")
                else:
                    raise Exception("Invalid response format")
                    
            except Exception as e:
                safe_print(f"[WARNING] AI generation failed for {category_name}: {e}")
                # Fallback content
                content = {
                    "title": f"Best {category_name.title()} - Premium Quality",
                    "description": f"Discover premium {category_name} with 2-year warranty and free shipping.",
                    "keywords": ["airfryer", "premium", "quality", "warranty", "free shipping"],
                    "faq": [
                        {"question": "What warranty is included?", "answer": "2-year manufacturer warranty."},
                        {"question": "Is shipping free?", "answer": "Yes, free shipping on all orders."},
                        {"question": "How to use?", "answer": "Very easy to use with automatic settings."}
                    ],
                    "content": f"<div><h2>Premium {category_name.title()}</h2><p>High-quality airfryer with excellent performance and 2-year warranty.</p></div>"
                }
            
            # Create enhanced category data
            enhanced_category = {
                "categoryId": category_id,
                "categoryNameCanonical": category_name,
                "slug": self.create_category_slug(category_name),
                "parentCategoryId": category.get('parentCategoryId'),
                "level": category.get('level', 0),
                "description": content["description"],
                "content": content["content"],
                "seo": {
                    "title": content["title"],
                    "description": content["description"],
                    "keywords": content["keywords"],
                    "enhancedAt": datetime.now().isoformat()
                },
                "faq": content["faq"],
                "productCount": category.get('productCount', 0),
                "enhancedAt": datetime.now().isoformat()
            }
            
            # Save individual category file
            category_filename = f"{category_id}.json"
            category_filepath = os.path.join(self.categories_dir, category_filename)
            
            with open(category_filepath, 'w', encoding='utf-8') as f:
                json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to enhance category {category_name}: {e}")
            return False

    def create_category_slug(self, category_name):
        """Create URL-friendly slug from category name"""
        slug = category_name.lower()
        # Replace spaces and special characters
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = slug.strip('-')
        return slug
    
    def load_categories(self):
        """Load categories from the categories.json file"""
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return []
        
        try:
            with open(self.categories_file, 'r', encoding='utf-8') as f:
                categories = json.load(f)
            return categories
        except Exception as e:
            safe_print(f"[ERROR] Failed to load categories: {str(e)}")
            return []
    
    def test_single_category(self):
        """Test enhancement on a single category"""
        safe_print("[START] AI Category Enhancement - TEST MODE")
        safe_print("=" * 50)
        
        # Load categories
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return
        
        with open(self.categories_file, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        
        if not categories:
            safe_print("[ERROR] No categories found")
            return
        
        # Test with the first category
        test_category = categories[0]
        category_name = test_category.get('categoryNameCanonical', 'Test Category')
        category_id = test_category.get('categoryId', 1)
        
        safe_print(f"[TEST] Testing with category: {category_name} (ID: {category_id})")
        safe_print("-" * 40)
        
        try:
            # Generate all content
            safe_print("[AI] Generating title...")
            seo_title = self.enhance_category_title(category_name)
            safe_print(f"[RESULT] Title: {seo_title}")
            
            safe_print("\n[AI] Generating description...")
            seo_description = self.enhance_category_description(category_name)
            safe_print(f"[RESULT] Description: {seo_description}")
            
            safe_print("\n[AI] Generating keywords...")
            seo_keywords = self.enhance_category_keywords(category_name)
            safe_print(f"[RESULT] Keywords: {', '.join(seo_keywords)}")
            
            safe_print("\n[AI] Generating FAQ...")
            faq = self.generate_category_faq(category_name)
            safe_print(f"[RESULT] FAQ: {len(faq)} questions generated")
            
            safe_print("\n[AI] Generating long-form content...")
            seo_content = self.generate_category_content(category_name)
            safe_print(f"[RESULT] Content: {len(seo_content)} characters generated")
            
            # Create enhanced category data
            enhanced_category = {
                "categoryId": category_id,
                "categoryNameCanonical": category_name,
                "slug": self.create_category_slug(category_name),
                "parentCategoryId": test_category.get('parentCategoryId'),
                "level": test_category.get('level', 0),
                "description": seo_description,
                "content": seo_content,
                "seo": {
                    "title": seo_title,
                    "description": seo_description,
                    "keywords": seo_keywords,
                    "enhancedAt": datetime.now().isoformat()
                },
                "faq": faq,
                "productCount": test_category.get('productCount', 0),
                "enhancedAt": datetime.now().isoformat()
            }
            
            safe_print(f"\n[SUCCESS] Complete enhanced category data:")
            safe_print("=" * 30)
            safe_print(f"Category: {category_name}")
            safe_print(f"Description: {seo_description}")
            safe_print(f"FAQ Questions: {len(faq)}")
            safe_print(f"Keywords: {len(seo_keywords)}")
            safe_print("=" * 30)
            
            # Ask if user wants to save this test
            save_test = input("\n💾 Save this test result as individual category file? (y/n): ").strip().lower()
            if save_test == 'y':
                # Save individual category file
                category_filename = f"{category_id}.json"
                category_filepath = os.path.join(self.categories_dir, category_filename)
                
                with open(category_filepath, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
                
                safe_print(f"[SAVED] Category saved to: {category_filepath}")
                safe_print(f"[INFO] You can view it at: /category/{enhanced_category['slug']}")
            else:
                safe_print("[SKIP] Test result not saved")
                
        except Exception as e:
            safe_print(f"[ERROR] Test failed: {str(e)}")

    def enhance_all_categories(self):
        """Enhance all categories and create individual JSON files"""
        safe_print("[START] AI Category Enhancement - INDIVIDUAL FILES MODE")
        safe_print("=" * 60)
        
        # Load categories
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return
        
        with open(self.categories_file, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        
        safe_print(f"[INFO] Found {len(categories)} categories to enhance")
        safe_print(f"[WARNING] This will create {len(categories)} individual JSON files")
        safe_print(f"[WARNING] Estimated time: {len(categories) * 0.2 / 60:.1f} minutes")
        
        # Ask for confirmation
        confirm = input("\n⚠️  Continue with full enhancement? (y/n): ").strip().lower()
        if confirm != 'y':
            safe_print("[CANCELLED] Full enhancement cancelled")
            return
        
        enhanced_count = 0
        failed_count = 0
        
        # Process categories concurrently for maximum speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
            # Submit all enhancement tasks
            future_to_category = {
                executor.submit(self.enhance_single_category_fast, category, i): (category, i) 
                for i, category in enumerate(categories, 1)
            }
            
            # Process completed tasks as they finish
            for future in concurrent.futures.as_completed(future_to_category):
                category, i = future_to_category[future]
                category_name = category.get('categoryNameCanonical', f'Category {i}')
                
                try:
                    success = future.result()
                    if success:
                        enhanced_count += 1
                        safe_print(f"[PROGRESS] {i}/{len(categories)} - ✅ {category_name}")
                    else:
                        failed_count += 1
                        safe_print(f"[PROGRESS] {i}/{len(categories)} - ❌ {category_name}")
                        
                except Exception as e:
                    failed_count += 1
                    safe_print(f"[PROGRESS] {i}/{len(categories)} - ❌ {category_name} - {e}")
        
        safe_print(f"\n[SUMMARY] Individual Category Files Enhancement Complete")
        safe_print("=" * 50)
        safe_print(f"✅ Enhanced: {enhanced_count}")
        safe_print(f"❌ Failed: {failed_count}")
        safe_print(f"📁 Category files directory: {self.categories_dir}")
        safe_print(f"📁 Total files created: {len(os.listdir(self.categories_dir)) if os.path.exists(self.categories_dir) else 0}")

    def enhance_categories_ultra_fast(self):
        """ULTRA-FAST category enhancement with optimized templates"""
        safe_print("[START] ULTRA-FAST Category Enhancement")
        safe_print("=" * 60)
        
        # Load categories
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return
        
        with open(self.categories_file, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        
        safe_print(f"[INFO] Found {len(categories)} categories to enhance")
        safe_print(f"[INFO] ULTRA-FAST mode: Batch size: {self.batch_size}")
        safe_print(f"[INFO] Estimated time: {len(categories) * 0.5 / 60:.1f} minutes")
        
        # Ask for confirmation
        confirm = input("\n⚠️  Continue with ULTRA-FAST enhancement? (y/n): ").strip().lower()
        if confirm != 'y':
            safe_print("[CANCELLED] ULTRA-FAST enhancement cancelled")
            return
        
        enhanced_count = 0
        failed_count = 0
        
        # Process in batches for efficiency
        for i in range(0, len(categories), self.batch_size):
            batch = categories[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (len(categories) + self.batch_size - 1) // self.batch_size
            
            safe_print(f"\n[BATCH] Processing batch {batch_num}/{total_batches} ({len(batch)} categories)")
            
            for category in batch:
                try:
                    category_name = category.get('categoryNameCanonical', f'Category {enhanced_count + 1}')
                    category_id = category.get('categoryId', enhanced_count + 1)
                    
                    safe_print(f"[PROGRESS] Enhancing: {category_name}")
                    
                    # Generate optimized content
                    seo_title = self.enhance_category_title(category_name)
                    seo_description = self.enhance_category_description(category_name)
                    seo_keywords = self.enhance_category_keywords(category_name)
                    faq = self.generate_category_faq(category_name)
                    seo_content = self.generate_category_content(category_name)
                    
                    # Create enhanced category data
                    enhanced_category = {
                        "categoryId": category_id,
                        "categoryNameCanonical": category_name,
                        "slug": self.create_category_slug(category_name),
                        "parentCategoryId": category.get('parentCategoryId'),
                        "level": category.get('level', 0),
                        "description": seo_description,
                        "content": seo_content,
                        "seo": {
                            "title": seo_title,
                            "description": seo_description,
                            "keywords": seo_keywords,
                            "enhancedAt": datetime.now().isoformat()
                        },
                        "faq": faq,
                        "productCount": category.get('productCount', 0),
                        "enhancedAt": datetime.now().isoformat()
                    }
                    
                    # Save individual category file
                    category_filename = f"{category_id}.json"
                    category_filepath = os.path.join(self.categories_dir, category_filename)
                    
                    with open(category_filepath, 'w', encoding='utf-8') as f:
                        json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
                    
                    enhanced_count += 1
                    safe_print(f"[SUCCESS] Enhanced: {category_name}")
                    
                    # Minimal delay for speed
                    time.sleep(self.request_delay)
                    
                except Exception as e:
                    failed_count += 1
                    safe_print(f"[ERROR] Failed to enhance category: {str(e)[:100]}")
            
            safe_print(f"[BATCH] Completed: {enhanced_count} enhanced, {failed_count} failed")
        
        # Summary
        safe_print(f"\n[SUMMARY] ULTRA-FAST Enhancement Complete")
        safe_print("=" * 40)
        safe_print(f"✅ Enhanced: {enhanced_count}")
        safe_print(f"❌ Failed: {failed_count}")
        safe_print(f"📁 Category files directory: {self.categories_dir}")
        safe_print(f"⚡ Speed: ULTRA-FAST mode with optimized templates")

    def enhance_categories_mega_fast(self):
        """MEGA-FAST enhancement for 1000+ categories - MINIMAL CONTENT"""
        safe_print("🚀 MEGA-FAST MODE: Processing 1000+ categories with minimal content...")
        
        # Load categories
        categories = self.load_categories()
        if not categories:
            safe_print("❌ No categories found!")
            return
        
        safe_print(f"📊 Found {len(categories)} categories to enhance")
        safe_print(f"⚡ MEGA-FAST: Batch size {self.batch_size}, Delay {self.request_delay}s")
        
        # Process in large batches for maximum speed
        total_categories = len(categories)
        enhanced_count = 0
        failed_count = 0
        
        for i in range(0, total_categories, self.batch_size):
            batch = categories[i:i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            total_batches = (total_categories + self.batch_size - 1) // self.batch_size
            
            safe_print(f"⚡ Processing batch {batch_num}/{total_batches} ({len(batch)} categories)")
            
            # Process batch concurrently for maximum speed
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
                future_to_category = {
                    executor.submit(self.enhance_category_minimal, category): category 
                    for category in batch
                }
                
                for future in concurrent.futures.as_completed(future_to_category):
                    category = future_to_category[future]
                    try:
                        enhanced_category = future.result()
                        
                        # Save individual category file
                        category_id = category.get('categoryId')
                        category_name = category.get('categoryNameCanonical', 'Unknown')
                        category_filename = f"{category_id}.json"
                        category_filepath = os.path.join(self.categories_dir, category_filename)
                        
                        with open(category_filepath, 'w', encoding='utf-8') as f:
                            json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
                        
                        enhanced_count += 1
                        safe_print(f"✅ Enhanced: {category_name}")
                        
                    except Exception as e:
                        failed_count += 1
                        category_id = category.get('categoryId', 'Unknown')
                        safe_print(f"❌ Failed to enhance category {category_id}: {str(e)[:100]}")
            
            # Progress update
            progress = ((i + len(batch)) / total_categories) * 100
            safe_print(f"📈 Progress: {progress:.1f}% ({enhanced_count} enhanced, {failed_count} failed)")
        
        # Final summary
        safe_print(f"\n🎉 MEGA-FAST ENHANCEMENT COMPLETE!")
        safe_print(f"✅ Enhanced: {enhanced_count} categories")
        safe_print(f"❌ Failed: {failed_count} categories")
        safe_print(f"📁 Files saved to: {self.categories_dir}")
        safe_print(f"⚡ Optimized for 1000+ categories with minimal content")
    
    def enhance_category_minimal(self, category):
        """ULTRA-FAST category enhancement - AI WITH MAXIMUM CONCURRENCY"""
        category_id = category.get('categoryId')
        category_name = category.get('categoryNameCanonical', 'Unknown')
        
        # Generate content using AI with category-specific prompts
        enhanced_category = {
            'categoryId': category_id,
            'name': category_name,
            'slug': self.create_category_slug(category_name),
            'seo_title': self.enhance_category_title_fast(category_name),
            'seo_description': self.enhance_category_description_fast(category_name),
            'keywords': self.enhance_category_keywords_fast(category_name),
            'faq': self.generate_category_faq_fast(category_name),
            'content': self.generate_category_content_fast(category_name),
            'enhanced': True,
            'enhanced_at': datetime.now().isoformat(),
            'enhancement_version': 'ultra_fast_ai_v1'
        }
        
        return enhanced_category

    def enhance_category_title_fast(self, category_name):
        """Generate SEO title focused ONLY on the specific category"""
        prompt = f"""Create an SEO title maximum 60 characters for: "{category_name}"

STRICT RULES:
- ONLY mention products related to "{category_name}"
- Include specific key benefit of the product
- Use action words (Buy, Discover, Best)

EXAMPLE for "airfryer": "Airfryers - Best Price and Quality"
Respond ONLY with the title:"""
        
        return self.get_ai_response(prompt)

    def enhance_category_description_fast(self, category_name):
        """Generate SEO description focused ONLY on the specific category"""
        prompt = f"""Create an SEO description maximum 80 characters for: "{category_name}"

STRICT RULES:
- ONLY mention "{category_name}" and directly related products
- Use emoji ✅

EXAMPLE for "airfryer": "Airfryers ✅ Premium Quality. From 19€ Free Shipping!"
Respond ONLY with the description:"""
        
        return self.get_ai_response(prompt)

    def enhance_category_keywords_fast(self, category_name):
        """Generate keywords focused ONLY on the specific category"""
        prompt = f"""Create 5 SEO keywords for: "{category_name}"

STRICT RULES:
- ONLY words related to "{category_name}"
- Format: simple list separated by commas

EXAMPLE for "airfryer": "airfryer, best price airfryer, airfryer offer, free shipping airfryer, airfryer quality"
Respond ONLY with keywords separated by commas:"""
        
        response = self.get_ai_response(prompt)
        return [kw.strip() for kw in response.split(',') if kw.strip()]

    def generate_category_faq_fast(self, category_name):
        """Generate FAQ focused ONLY on the specific category"""
        prompt = f"""Create exactly 3 specific FAQ questions for: "{category_name}"

STRICT RULES:
- ONLY questions about "{category_name}" and directly related products
- Questions people actually search on Google
- Specific and useful answers (maximum 50 words)
- Valid JSON format MANDATORY
- DO NOT use double quotes inside answers

EXAMPLE for "airfryer":
[
  {{"question": "What is the battery life of airfryer?", "answer": "Airfryers have battery life of 15-30km depending on model and battery."}},
  {{"question": "Is airfryer easy to use?", "answer": "Yes, airfryers are very easy to use with automatic acceleration and simple controls."}},
  {{"question": "Is there warranty on airfryers?", "answer": "Yes, all our airfryers include complete 2-year warranty."}}
]

IMPORTANT: Respond ONLY with valid JSON, no additional text:"""
        
        # Retry up to 3 times to get valid JSON
        for attempt in range(3):
            try:
                response = self.get_ai_response(prompt)
                
                # Clean the response - remove any markdown formatting
                clean_response = response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response.replace('```json', '').replace('```', '').strip()
                elif clean_response.startswith('```'):
                    clean_response = clean_response.replace('```', '').strip()
                
                # Try to find JSON array in the response
                if '[' in clean_response and ']' in clean_response:
                    json_match = re.search(r'\[.*\]', clean_response, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        parsed = json.loads(json_str)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            safe_print(f"[SUCCESS] Generated {len(parsed)} FAQ items for {category_name}")
                            return parsed
                
                safe_print(f"[RETRY {attempt + 1}/3] Invalid JSON format for {category_name}")
                safe_print(f"[DEBUG] Response: {response[:200]}...")
                
            except Exception as e:
                safe_print(f"[RETRY {attempt + 1}/3] Exception for {category_name}: {e}")
        
        # If all retries failed, raise an exception
        raise Exception(f"Failed to generate valid FAQ JSON for {category_name} after 3 attempts")

    def generate_category_content_fast(self, category_name):
        """Generate content focused ONLY on the specific category"""
        prompt = f"""Create SEO HTML content for: "{category_name}"

STRICT RULES:
- ONLY write about "{category_name}" and directly related products
- Include H2, H3, list with specific product features
- Mention price from 19€ and free shipping
- Maximum 300 words
- Valid HTML format
- DO NOT use ```html or ``` - only pure HTML

EXAMPLE for "airfryer":
<div>
<h2>Best Airfryers</h2>
<p>Discover the best <b>airfryers</b> with the best quality and price.</p>
<h3>Key Features</h3>
<ul>
<li><b>Extended Battery Life</b>: Up to 30km range</li>
<li><b>Easy Handling</b>: Intuitive control and stable</li>
<li><b>Foldable</b>: Easy transport and storage</li>
</ul>
<p>From <b>19€</b> with free shipping.</p>
</div>

Respond ONLY with HTML without ```html:"""
        
        response = self.get_ai_response(prompt)
        
        # Clean up response - remove ```html and ``` if present
        if response.startswith('```html'):
            response = response[7:]  # Remove ```html
        if response.startswith('```'):
            response = response[3:]  # Remove ```
        if response.endswith('```'):
            response = response[:-3]  # Remove trailing ```
        
        return response.strip()

    def enhance_specific_categories(self, category_ids):
        """Enhance only specific categories by ID"""
        safe_print("[START] Custom Category Enhancement")
        safe_print("=" * 60)
        
        # Load categories
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return
        
        with open(self.categories_file, 'r', encoding='utf-8') as f:
            all_categories = json.load(f)
        
        # Filter categories by ID
        target_categories = [cat for cat in all_categories if cat.get('categoryId') in category_ids]
        
        if not target_categories:
            safe_print(f"[ERROR] No categories found with IDs: {category_ids}")
            return
        
        safe_print(f"[INFO] Found {len(target_categories)} categories to enhance")
        safe_print(f"[INFO] Category IDs: {category_ids}")
        safe_print(f"[INFO] Estimated time: {len(target_categories) * 0.5 / 60:.1f} minutes")
        
        enhanced_count = 0
        failed_count = 0
        
        for category in target_categories:
            try:
                category_name = category.get('categoryNameCanonical', f'Category {category.get("categoryId")}')
                category_id = category.get('categoryId')
                
                safe_print(f"[PROGRESS] Enhancing: {category_name} (ID: {category_id})")
                
                # Generate optimized content
                seo_title = self.enhance_category_title(category_name)
                seo_description = self.enhance_category_description(category_name)
                seo_keywords = self.enhance_category_keywords(category_name)
                faq = self.generate_category_faq(category_name)
                seo_content = self.generate_category_content(category_name)
                
                # Create enhanced category data
                enhanced_category = {
                    "categoryId": category_id,
                    "categoryNameCanonical": category_name,
                    "slug": self.create_category_slug(category_name),
                    "parentCategoryId": category.get('parentCategoryId'),
                    "level": category.get('level', 0),
                    "description": seo_description,
                    "content": seo_content,
                    "seo": {
                        "title": seo_title,
                        "description": seo_description,
                        "keywords": seo_keywords,
                        "enhancedAt": datetime.now().isoformat()
                    },
                    "faq": faq,
                    "productCount": category.get('productCount', 0),
                    "enhancedAt": datetime.now().isoformat()
                }
                
                # Save individual category file
                category_filename = f"{category_id}.json"
                category_filepath = os.path.join(self.categories_dir, category_filename)
                
                with open(category_filepath, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
                
                enhanced_count += 1
                safe_print(f"[SUCCESS] Enhanced: {category_name}")
                
                # Minimal delay for speed
                time.sleep(self.request_delay)
                
            except Exception as e:
                failed_count += 1
                safe_print(f"[ERROR] Failed to enhance category {category_id}: {str(e)[:100]}")
        
        # Summary
        safe_print(f"\n[SUMMARY] Custom Enhancement Complete")
        safe_print("=" * 40)
        safe_print(f"✅ Enhanced: {enhanced_count}")
        safe_print(f"❌ Failed: {failed_count}")
        safe_print(f"📁 Category files directory: {self.categories_dir}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Category Enhancer with Multi-Language Support')
    parser.add_argument('--language', '-l', default='german', 
                       choices=['german', 'spanish', 'french', 'italian', 'dutch', 'polish', 'swedish', 'english', 'portuguese', 'russian', 'chinese', 'japanese', 'korean'],
                       help='Output language for generated content (default: german)')
    parser.add_argument('--test', '-t', action='store_true',
                       help='Test mode: enhance just one category')
    parser.add_argument('--all', '-a', action='store_true',
                       help='Enhance all categories')
    
    args = parser.parse_args()
    
    enhancer = AICategoryEnhancer(output_language=args.language)
    
    safe_print(f"🌍 Language: {args.language.title()}")
    
    if args.test:
        safe_print("\n🧪 Starting category test...")
        enhancer.test_single_category()
    elif args.all:
        safe_print("\n🚀 Starting full category enhancement...")
        enhancer.enhance_all_categories()
    else:
        # Interactive mode
        while True:
            safe_print("\n🏷️ AI Category Enhancer - Individual Files")
            safe_print("Creating individual JSON files for each category")
            safe_print("=" * 60)
            safe_print("📋 Options:")
            safe_print("1. Test single category (RECOMMENDED)")
            safe_print("2. Enhance all categories (creates individual files)")
            safe_print("3. ULTRA-FAST enhancement (optimized templates) 🚀")
            safe_print("4. MEGA-FAST enhancement (1000+ categories) ⚡")
            safe_print("5. Enhance specific categories by ID")
            safe_print("6. View category statistics")
            safe_print("7. Exit")
            
            choice = input("\nSelect option (1-7): ").strip()
            
            if choice == '1':
                safe_print("\n🧪 Starting category test...")
                enhancer.test_single_category()
                
            elif choice == '2':
                safe_print("\n🚀 Starting full category enhancement...")
                enhancer.enhance_all_categories()
                
            elif choice == '3':
                safe_print("\n🚀 Starting ULTRA-FAST enhancement...")
                enhancer.enhance_categories_ultra_fast()
                
            elif choice == '4':
                safe_print("\n⚡ Starting MEGA-FAST enhancement for 1000+ categories...")
                enhancer.enhance_categories_mega_fast()
                
            elif choice == '5':
                safe_print("\n🎯 Custom category enhancement...")
                try:
                    category_ids_input = input("Enter category IDs (comma-separated, e.g., 1,2,3): ").strip()
                    category_ids = [int(id.strip()) for id in category_ids_input.split(',') if id.strip().isdigit()]
                    if category_ids:
                        enhancer.enhance_specific_categories(category_ids)
                    else:
                        safe_print("[ERROR] Please enter valid category IDs")
                except ValueError:
                    safe_print("[ERROR] Please enter valid numbers separated by commas")
                
            elif choice == '6':
                # Show statistics
                categories_created = 0
                if os.path.exists(enhancer.categories_dir):
                    categories_created = len([f for f in os.listdir(enhancer.categories_dir) if f.endswith('.json')])
                
                total_categories = 0
                if os.path.exists(enhancer.categories_file):
                    with open(enhancer.categories_file, 'r', encoding='utf-8') as f:
                        categories = json.load(f)
                    total_categories = len(categories)
                    
                safe_print(f"\n📊 Category Statistics")
                safe_print("=" * 30)
                safe_print(f"   Total categories: {total_categories}")
                safe_print(f"   Individual files created: {categories_created}")
                safe_print(f"   Remaining: {total_categories - categories_created}")
                safe_print(f"   Categories directory: {enhancer.categories_dir}")
                safe_print(f"   Source file: {enhancer.categories_file}")
                
            elif choice == '7':
                safe_print("\n👋 Goodbye!")
                break
                
            else:
                safe_print("[ERROR] Please enter a valid option (1-7)")

if __name__ == "__main__":
    main() 