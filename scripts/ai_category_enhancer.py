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

# Set cache directory to data folder
os.environ['PYTHONPYCACHEPREFIX'] = os.path.join(os.getcwd(), 'data', '__pycache__')

def safe_print(message):
    """Thread-safe print function that handles encoding issues"""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('utf-8', errors='ignore').decode('utf-8'))

class AICategoryEnhancer:
    def __init__(self, output_language='french'):
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
        
        # Performance settings - MEGA-FAST MODE
        self.request_delay = 0  # NO DELAY
        self.batch_size = 200  # Process 200 categories at once
        self.max_concurrent = 100  # Maximum concurrency - MEGA-FAST
        
    
    def load_ai_config(self):
        """Load AI configuration from config file"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            safe_print(f"[WARNING] Could not load AI config: {e}")
        
        # Default fallback config
        return {}
    
    def get_product_keywords(self):
        """Get product-specific keywords from config"""
        return self.ai_config.get("keywords", [])
    
    def get_category_price_range(self, category_id):
        """No price information - return empty string"""
        return ""
    
    def parse_json_response(self, response, expected_keys=None):
        """Robust JSON parsing with multiple fallback strategies"""
        try:
            # Clean the response
            clean_response = response.strip()
            
            # Remove markdown code blocks
            if clean_response.startswith('```json'):
                clean_response = clean_response.replace('```json', '').replace('```', '').strip()
            elif clean_response.startswith('```'):
                clean_response = clean_response.replace('```', '').strip()
            
            # Strategy 1: Try direct parsing
            try:
                parsed = json.loads(clean_response)
                if expected_keys and all(key in parsed for key in expected_keys):
                    return parsed
            except json.JSONDecodeError as e:
                if "Extra data" in str(e):
                    # Try to extract just the JSON part before the extra data
                    try:
                        # Find the end of the first complete JSON object
                        brace_count = 0
                        json_end = 0
                        for i, char in enumerate(clean_response):
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    json_end = i + 1
                                    break
                        
                        if json_end > 0:
                            json_part = clean_response[:json_end]
                            parsed = json.loads(json_part)
                            if expected_keys and all(key in parsed for key in expected_keys):
                                return parsed
                    except:
                        pass
            except:
                pass
            
            # Strategy 2: Find JSON object in response
            if '{' in clean_response and '}' in clean_response:
                json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    try:
                        parsed = json.loads(json_str)
                        if expected_keys and all(key in parsed for key in expected_keys):
                            return parsed
                    except:
                        pass
            
            # Strategy 3: Fix common JSON issues
            fixed_response = clean_response
            # Fix missing commas between objects
            fixed_response = re.sub(r'\}\s*\{', '},{', fixed_response)
            # Fix trailing commas
            fixed_response = re.sub(r',\s*}', '}', fixed_response)
            # Fix missing quotes around keys
            fixed_response = re.sub(r'(\w+):', r'"\1":', fixed_response)
            
            try:
                parsed = json.loads(fixed_response)
                if expected_keys and all(key in parsed for key in expected_keys):
                    return parsed
            except:
                pass
            
            # Strategy 4: Extract and reconstruct JSON manually
            if 'sections' in clean_response.lower():
                sections_match = re.search(r'"sections"\s*:\s*\[(.*?)\]', clean_response, re.DOTALL)
                if sections_match:
                    sections_content = sections_match.group(1)
                    # Try to extract individual sections
                    section_pattern = r'\{\s*"heading"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]+)"\s*\}'
                    sections = re.findall(section_pattern, sections_content)
                    
                    if sections:
                        reconstructed = {
                            "title": f"Guide d'Achat : {category_name}",
                            "sections": [
                                {"heading": heading, "content": content}
                                for heading, content in sections
                            ]
                        }
                        return reconstructed
            
            return None
            
        except Exception as e:
            safe_print(f"[ERROR] JSON parsing failed: {e}")
            return None
    
    def get_ai_response(self, prompt, max_retries=1):
        """
        Get AI response using Google Gemini 2.5 Flash - MEGA-FAST MODE
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
            
            # System prompt for SEO expert (language-agnostic)
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            system_prompt = f"You are an SEO expert and digital marketing specialist for e-commerce products. CRITICAL: You MUST respond ONLY in {language_name}. Do NOT use  other languages. Use ONLY words, phrases and expressions in {language_name}. Focus on product categories and content related to products."
            
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
    
    def get_fallback_response(self, prompt):
        """No fallback - only AI content"""
        raise Exception("AI generation failed - no fallback content allowed")
    
    
    def enhance_category_description(self, category_name, category_id=None):
        """Generate SEO-optimized description for a category"""
        keywords = self.get_product_keywords()
        price_range = self.get_category_price_range(category_id) if category_id else "from 200€"
        
        # Get actual product information for better description
        product_context = ""
        if category_id:
            try:
                # Load category-products mapping
                category_products_path = os.path.join("data", "indices", "category-products.json")
                if os.path.exists(category_products_path):
                    with open(category_products_path, 'r', encoding='utf-8') as f:
                        category_products = json.load(f)
                    
                    product_ids = category_products.get(str(category_id), [])
                    if product_ids:
                        # Get sample product data for context
                        products_dir = os.path.join("data", "products")
                        sample_product = None
                        for product_id in product_ids[:1]:  # Check first product
                            product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                            if os.path.exists(product_file):
                                try:
                                    with open(product_file, 'r', encoding='utf-8') as f:
                                        sample_product = json.load(f)
                                    break
                                except Exception:
                                    continue
                        
                        if sample_product:
                            product_context = f"Product example: {sample_product.get('name', '')[:100]}... Price: {sample_product.get('price', 'N/A')}€"
            except Exception:
                pass
        
        prompt = f"""Create a comprehensive SEO description (maximum 120 characters) for: {category_name}

CRITICAL LANGUAGE REQUIREMENT: Write ONLY in {self.language_map.get(self.output_language, self.output_language.title())}. Do NOT use Spanish, English, or any other language.

REQUIREMENTS:
- Write EXCLUSIVELY in {self.language_map.get(self.output_language, self.output_language.title())}
- Include key benefits and features for the product
- Create urgency (free shipping, limited offer, best quality)
- Target buyers with specific use cases
- Use relevant keywords: {', '.join(keywords[:3])}
- DO NOT mention specific prices or price ranges
{'- Product context: ' + product_context if product_context else ''}

EXAMPLE: "{category_name} ✅ Premium Quality & Smart Features. Free Shipping! Perfect for [specific use case]."

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
    
    def generate_category_faq(self, category_name, category_id=None):
        """Generate FAQ for a category based on actual products"""
        keywords = self.get_product_keywords()
        
        # Get actual product information for better FAQ generation
        product_context = ""
        if category_id:
            try:
                # Load category-products mapping
                category_products_path = os.path.join("data", "indices", "category-products.json")
                if os.path.exists(category_products_path):
                    with open(category_products_path, 'r', encoding='utf-8') as f:
                        category_products = json.load(f)
                    
                    product_ids = category_products.get(str(category_id), [])
                    if product_ids:
                        # Get sample product data for context
                        products_dir = os.path.join("data", "products")
                        sample_product = None
                        for product_id in product_ids[:2]:  # Check first 2 products
                            product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                            if os.path.exists(product_file):
                                try:
                                    with open(product_file, 'r', encoding='utf-8') as f:
                                        sample_product = json.load(f)
                                    break
                                except Exception:
                                    continue
                        
                        if sample_product:
                            product_context = f"Product example: {sample_product.get('name', '')[:100]}... Price: {sample_product.get('price', 'N/A')}€"
            except Exception:
                pass
        
        prompt = f"""Create exactly 6 specific FAQ questions for: "{category_name}"

REQUIREMENTS:
- Write in {self.language_map.get(self.output_language, self.output_language.title())}
- Questions people search on Google about "{category_name}"
- Specific and useful answers (maximum 50 words)
- Focus on product benefits and practical use
- Avoid keyword repetition
- CRITICAL: Return ONLY valid JSON format - no markdown, no explanations
- Consider keywords: {', '.join(keywords[:2])}
{'- Product context: ' + product_context if product_context else ''}

EXAMPLE for any product category:
[
  {{"question": "What is the best {category_name} for home use?", "answer": "The best {category_name} combines quality, ease of use, and good value. Look for models with positive reviews and reliable performance."}},
  {{"question": "How to choose the right {category_name}?", "answer": "Consider your specific needs, budget, and space requirements. Compare features, reviews, and warranty options to find the perfect match."}},
  {{"question": "Is {category_name} worth the investment?", "answer": "Yes, a quality {category_name} provides excellent value through improved efficiency, convenience, and long-term durability."}},
  {{"question": "What features should I look for in a {category_name}?", "answer": "Key features include reliability, ease of use, energy efficiency, and good customer support. Check reviews for real-world performance."}},
  {{"question": "How long does a {category_name} typically last?", "answer": "Quality {category_name} products last 3-7 years with proper maintenance. Look for models with good warranty coverage and spare parts availability."}},
  {{"question": "Can I use {category_name} in different environments?", "answer": "Most {category_name} models adapt to various conditions. Check specifications for temperature ranges, humidity tolerance, and space requirements."}}
]

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:"""
        
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
    
    def load_category_products(self, category_id):
        """Load products for a specific category"""
        try:
            # Load category-products mapping
            category_products_path = os.path.join("data", "indices", "category-products.json")
            if not os.path.exists(category_products_path):
                return []
            
            with open(category_products_path, 'r', encoding='utf-8') as f:
                category_products = json.load(f)
            
            product_ids = category_products.get(str(category_id), [])
            if not product_ids:
                return []
            
            # Load actual product data
            products = []
            products_dir = os.path.join("data", "products")
            
            for product_id in product_ids[:10]:  # Limit to first 10 for performance
                product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                if os.path.exists(product_file):
                    try:
                        with open(product_file, 'r', encoding='utf-8') as f:
                            product_data = json.load(f)
                        
                        # Extract relevant product information
                        product_info = {
                            'name': product_data.get('name', ''),
                            'price': product_data.get('price', '0'),
                            'rating': product_data.get('rating', ''),
                            'features': product_data.get('features', []),
                            'description': product_data.get('description', ''),
                            'shortDescription': product_data.get('shortDescription', ''),
                            'slug': product_data.get('slug', ''),
                            'productId': product_data.get('productId', '')
                        }
                        products.append(product_info)
                    except Exception:
                        continue
            
            return products
        except Exception as e:
            safe_print(f"[WARNING] Could not load products for category {category_id}: {e}")
            return []

    def generate_top5_products(self, category_name, category_id=None):
        """Generate Top 5 products list for a category"""
        products = self.load_category_products(category_id) if category_id else []
        
        if not products:
            return ""
        
        # Sort products by price (descending) and take top 5
        sorted_products = sorted(products, key=lambda x: float(x.get('price', 0)), reverse=True)[:5]
        
        prompt = f"""Create a "Top 5 {category_name}" list in {self.language_map.get(self.output_language, self.output_language.title())}.

ACTUAL PRODUCTS DATA:
{json.dumps([{
    'name': p.get('name', ''),
    'price': p.get('price', ''),
    'rating': p.get('rating', ''),
    'features': p.get('features', [])[:3] if isinstance(p.get('features'), list) else [],
    'description': p.get('shortDescription', '')[:100] if p.get('shortDescription') else p.get('description', '')[:100] if p.get('description') else '',
    'slug': p.get('slug', '')
} for p in sorted_products], ensure_ascii=False, indent=2)}

REQUIREMENTS:
- Write EXCLUSIVELY in {self.language_map.get(self.output_language, self.output_language.title())}
- Use ONLY the actual product names and data provided above
- Create an HTML list with exactly 5 products from the data
- Include actual product names, prices, and key features
- Rank by value/quality, not just price
- Use <h3>Top 5 {category_name}</h3> as title
- Each item should be <li><strong>[Actual Product Name]</strong> - [Key benefit/feature] - Price: [Actual Price]€</li>
- Add brief explanations for each choice based on actual product data
- Focus on helping users make informed decisions

Respond ONLY with the HTML:"""

        response = self.get_ai_response(prompt)
        return response.strip()


    def generate_category_content(self, category_name, category_id=None):
        """Generate comprehensive SEO content for a category with internal linking"""
        keywords = self.get_product_keywords()
        price_range = self.get_category_price_range(category_id) if category_id else "from 200€"
        
        # Get actual product information and related categories for internal linking
        product_context = ""
        internal_links_context = ""
        
        if category_id:
            try:
                # Load category-products mapping
                category_products_path = os.path.join("data", "indices", "category-products.json")
                if os.path.exists(category_products_path):
                    with open(category_products_path, 'r', encoding='utf-8') as f:
                        category_products = json.load(f)
                    
                    product_ids = category_products.get(str(category_id), [])
                    if product_ids:
                        # Get sample product data for context
                        products_dir = os.path.join("data", "products")
                        sample_products = []
                        for product_id in product_ids[:3]:  # Get first 3 products for linking
                            product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                            if os.path.exists(product_file):
                                try:
                                    with open(product_file, 'r', encoding='utf-8') as f:
                                        product_data = json.load(f)
                                        sample_products.append({
                                            'name': product_data.get('name', ''),
                                            'slug': product_data.get('slug', ''),
                                            'price': product_data.get('price', 'N/A')
                                        })
                                except Exception:
                                    continue
                        
                        if sample_products:
                            product_context = f"Available products: {', '.join([p['name'][:50] for p in sample_products[:2]])}"
                            # Create internal links context
                            internal_links_context = f"""
INTERNAL LINKING REQUIREMENTS:
- Include links to specific products: {', '.join([f'<a href="/product/{p["slug"]}">{p["name"][:30]}...</a>' for p in sample_products[:2]])}
- Mention related subcategories when relevant
- Use natural, contextual linking within the content
"""
                
                        
            except Exception:
                pass
        
        prompt = f"""Create comprehensive SEO content (200-300 words) for: {category_name}

CRITICAL LANGUAGE REQUIREMENT: Write ONLY in {self.language_map.get(self.output_language, self.output_language.title())}. Do NOT use Spanish, English, or any other language.

REQUIREMENTS:
- Write EXCLUSIVELY in {self.language_map.get(self.output_language, self.output_language.title())}
- Detailed HTML structure with multiple sections
- Include key product benefits and features
- Target buyers with specific use cases and scenarios
- Avoid excessive keyword repetition
- Focus on helping users understand the product
- Use keywords: {', '.join(keywords[:3])}
- DO NOT mention specific prices or price ranges
{'- Product context: ' + product_context if product_context else ''}
{internal_links_context if internal_links_context else ''}

INTERNAL LINKING STRATEGY:
- Include 2-3 natural internal links to specific products using <a href="/product/[slug]">[product name]</a>
- Mention related categories/subcategories with <a href="/category/[slug]">[category name]</a>
- Links should be contextual and add value to the content
- Use anchor text that describes what users will find

STRUCTURE:
<div>
<h2>Best {category_name.title()} - Complete Guide</h2>
<p>Discover everything you need to know about {category_name}... [Include internal link to specific product]</p>
<h3>Key Features & Benefits</h3>
<ul><li>Feature 1 with explanation</li><li>Feature 2 with explanation</li><li>Feature 3 with explanation</li></ul>
<h3>Perfect For</h3>
<p>Specific use cases and scenarios... [Mention related category if relevant]</p>
<h3>Why Choose Our {category_name.title()}</h3>
<p>Quality, warranty, support benefits... [Include another product link]</p>
<p>Free shipping. Find the perfect model for your needs!</p>
</div>

Respond ONLY with the HTML:"""
        
        response = self.get_ai_response(prompt)
        
        # Clean HTML response
        response = response.strip()
        if '```html' in response:
            response = re.sub(r'```html\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        # Don't add Top 5 list to content - it's handled separately in comparison table
        full_content = response
        
        # Ensure proper HTML structure
        if not full_content.startswith('<div'):
            full_content = f"<div>\n{full_content}"
        if not full_content.endswith('</div>'):
            full_content = f"{full_content}\n</div>"
            
        return full_content
    
    
    def enhance_single_category_fast(self, category, index):
        """Enhance a single category with all content in one go for maximum speed"""
        try:
            category_name = category.get('categoryNameCanonical', f'Category {index}')
            category_id = category.get('categoryId', index)
            
            # Generate all content in one AI call for maximum speed
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            keywords = self.get_product_keywords()
            price_range = self.get_category_price_range(category_id)
            
            prompt = f"""Generate complete SEO content for: {category_name}

REQUIREMENTS:
- Language: {language_name}
- Product type: {category_name.lower()}
- Price: {price_range}
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
                
                # Extract JSON with better parsing
                if '{' in clean_response and '}' in clean_response:
                    # Try to find the complete JSON object
                    json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        try:
                            content = json.loads(json_str)
                        except json.JSONDecodeError as e:
                            # If there's extra data after the JSON, try to extract just the JSON part
                            safe_print(f"[WARNING] JSON parsing error: {e}")
                            # Try to find the end of the JSON object more precisely
                            brace_count = 0
                            json_end = 0
                            for i, char in enumerate(json_str):
                                if char == '{':
                                    brace_count += 1
                                elif char == '}':
                                    brace_count -= 1
                                    if brace_count == 0:
                                        json_end = i + 1
                                        break
                            
                            if json_end > 0:
                                json_str = json_str[:json_end]
                                content = json.loads(json_str)
                            else:
                                raise Exception(f"Could not parse JSON: {e}")
                    else:
                        raise Exception("No JSON found in response")
                else:
                    raise Exception("Invalid response format")
                    
            except Exception as e:
                safe_print(f"[ERROR] AI generation failed for {category_name}: {e}")
                raise Exception(f"Failed to generate AI content for {category_name}: {e}")
            
            # Generate Top 5 list and comparison table separately
            top5_content = ""
            comparison_table = None
            buying_guide = None
            
            try:
                top5_content = self.generate_top5_products(category_name, category_id)
                comparison_table = self.generate_comparison_table(category_name, category_id)
                buying_guide = self.generate_buying_guide(category_name, category_id)
            except Exception as e:
                safe_print(f"[WARNING] Could not generate Top 5/Comparison/Buying Guide for {category_name}: {e}")
            
            # Create enhanced category data with separate fields
            enhanced_category = {
                "categoryId": category_id,
                "categoryNameCanonical": category_name,
                "slug": category.get('slug', self.create_category_slug(category_name)),
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
            
            # Add separate fields for comparison table and buying guide
            if comparison_table:
                enhanced_category["comparisonTable"] = comparison_table
            if buying_guide:
                enhanced_category["buyingGuide"] = buying_guide
            
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
        # Convert accented characters to their non-accented equivalents
        slug = re.sub(r'[áàäâã]', 'a', slug)
        slug = re.sub(r'[éèëê]', 'e', slug)
        slug = re.sub(r'[íìïî]', 'i', slug)
        slug = re.sub(r'[óòöôõ]', 'o', slug)
        slug = re.sub(r'[úùüû]', 'u', slug)
        slug = re.sub(r'[ñ]', 'n', slug)
        slug = re.sub(r'[ç]', 'c', slug)
        # Replace spaces and special characters
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = slug.strip('-')
        return slug
    
    def load_categories(self):
        """Load categories from the categories.json file and convert to flat structure"""
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return []
        
        try:
            with open(self.categories_file, 'r', encoding='utf-8') as f:
                hierarchical_categories = json.load(f)
            
            # Convert hierarchical structure to flat structure for compatibility
            flat_categories = []
            category_id_counter = 1
            
            for main_category in hierarchical_categories:
                # Add main category
                main_category_data = {
                    'categoryId': category_id_counter,
                    'categoryNameCanonical': main_category['name'],
                    'slug': main_category['slug'],
                    'parentCategoryId': None,
                    'level': 0,
                    'description': main_category['description'],
                    'productCount': 0
                }
                flat_categories.append(main_category_data)
                category_id_counter += 1
                
                # Add subcategories
                if 'subcategories' in main_category:
                    for subcategory in main_category['subcategories']:
                        subcategory_data = {
                            'categoryId': category_id_counter,
                            'categoryNameCanonical': subcategory['name'],
                            'slug': f"{main_category['slug']}/{subcategory['slug']}",
                            'parentCategoryId': main_category_data['categoryId'],
                            'level': 1,
                            'description': subcategory['description'],
                            'productCount': 0
                        }
                        flat_categories.append(subcategory_data)
                        category_id_counter += 1
            
            return flat_categories
        except Exception as e:
            safe_print(f"[ERROR] Failed to load categories: {str(e)}")
            return []
    
    def test_single_category(self):
        """Test enhancement on a single category"""
        safe_print("[START] AI Category Enhancement - TEST MODE")
        safe_print("=" * 50)
        
        # Load categories using the load_categories method (converts hierarchical to flat)
        categories = self.load_categories()
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
            # Use the comprehensive enhancement method that includes comparison tables and buying guides
            safe_print("[AI] Generating comprehensive content with comparison tables and buying guides...")
            enhanced_category = self.enhance_category_comprehensive(test_category)
            
            if enhanced_category is None:
                safe_print("[ERROR] Failed to enhance category - no data returned")
                return
            
            # Add additional fields for compatibility
            enhanced_category.update({
                "parentCategoryId": test_category.get('parentCategoryId'),
                "level": test_category.get('level', 0),
                "productCount": test_category.get('productCount', 0)
            })
            
            safe_print(f"\n[SUCCESS] Complete enhanced category data:")
            safe_print("=" * 30)
            safe_print(f"Category: {category_name}")
            safe_print(f"Description: {enhanced_category.get('description', 'N/A')}")
            safe_print(f"FAQ Questions: {len(enhanced_category.get('faq', []))}")
            safe_print(f"Keywords: {len(enhanced_category.get('seo', {}).get('keywords', []))}")
            safe_print(f"Comparison Table: {'Yes' if enhanced_category.get('comparisonTable') else 'No'}")
            safe_print(f"Buying Guide: {'Yes' if enhanced_category.get('buyingGuide') else 'No'}")
            safe_print(f"Content Length: {len(enhanced_category.get('content', ''))} characters")
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
        
        # Load categories using the load_categories method (converts hierarchical to flat)
        categories = self.load_categories()
        if not categories:
            safe_print("[ERROR] No categories found")
            return
        
        main_categories = len([c for c in categories if c.get('level') == 0])
        subcategories = len([c for c in categories if c.get('level') == 1])
        safe_print(f"[INFO] Found {len(categories)} categories to enhance")
        safe_print(f"[INFO] Main categories: {main_categories}")
        safe_print(f"[INFO] Subcategories: {subcategories}")
        safe_print(f"[WARNING] This will create {len(categories)} individual JSON files")
        safe_print(f"[WARNING] Estimated time: {len(categories) * 0.2 / 60:.1f} minutes")
        
        # Start enhancement automatically
        
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

    def enhance_categories_mega_fast(self):
        """MEGA-FAST category enhancement with optimized templates"""
        safe_print("[START] MEGA-FAST Category Enhancement")
        safe_print("=" * 60)
        
        # Load categories using the load_categories method (converts hierarchical to flat)
        categories = self.load_categories()
        if not categories:
            safe_print("[ERROR] No categories found")
            return
        
        main_categories = len([c for c in categories if c.get('level') == 0])
        subcategories = len([c for c in categories if c.get('level') == 1])
        safe_print(f"[INFO] Found {len(categories)} categories to enhance")
        safe_print(f"[INFO] Main categories: {main_categories}")
        safe_print(f"[INFO] Subcategories: {subcategories}")
        safe_print(f"[INFO] MEGA-FAST mode: Batch size: {self.batch_size}")
        safe_print(f"[INFO] Estimated time: {len(categories) * 0.2 / 60:.1f} minutes")
        
        # Start MEGA-FAST enhancement automatically
        
        enhanced_count = 0
        failed_count = 0
        
        # Process categories concurrently for maximum speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
            # Submit all enhancement tasks
            future_to_category = {
                executor.submit(self.enhance_category_comprehensive, category): category 
                for category in categories
            }
            
            # Process completed tasks as they finish
            for future in concurrent.futures.as_completed(future_to_category):
                category = future_to_category[future]
                category_name = category.get('categoryNameCanonical', 'Unknown')
                category_id = category.get('categoryId', 'Unknown')
                
                try:
                    enhanced_category = future.result()
                    
                    # Save individual category file
                    category_filename = f"{category_id}.json"
                    category_filepath = os.path.join(self.categories_dir, category_filename)
                    
                    with open(category_filepath, 'w', encoding='utf-8') as f:
                        json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
                    
                    enhanced_count += 1
                    safe_print(f"[SUCCESS] Enhanced: {category_name}")
                    
                except Exception as e:
                    failed_count += 1
                    safe_print(f"[ERROR] Failed to enhance category {category_name}: {str(e)[:100]}")
        
        # Summary
        safe_print(f"\n[SUMMARY] MEGA-FAST Enhancement Complete")
        safe_print("=" * 40)
        safe_print(f"✅ Enhanced: {enhanced_count}")
        safe_print(f"❌ Failed: {failed_count}")
        safe_print(f"📁 Category files directory: {self.categories_dir}")
        safe_print(f"⚡ Speed: MEGA-FAST mode with {self.max_concurrent} concurrent workers")
        safe_print(f"📊 Features: Comparison tables, buying guides, FAQ, SEO optimization")

    
    def enhance_category_minimal(self, category):
        """ULTRA-FAST category enhancement - AI WITH MAXIMUM CONCURRENCY"""
        category_id = category.get('categoryId')
        category_name = category.get('categoryNameCanonical', 'Unknown')
        
        # Ensure categoryId is not None
        if not category_id:
            safe_print(f"[WARNING] Category {category_name} has no categoryId, skipping comparison table generation")
            category_id = None
        
        try:
            pass  # Placeholder for try block
        except:
            pass
    
    def enhance_category_ultra_batch(self, category_name, category_id=None):
        """Single AI call for ALL category content - MASSIVE COST SAVINGS"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        
        prompt = f"""Complete SEO data for: "{category_name}" in {language_name}

JSON only:
{{
  "title": "SEO title (60 chars)",
  "description": "SEO desc (80 chars)", 
  "keywords": ["kw1", "kw2", "kw3"],
  "faq": [{{"q": "Q1", "a": "A1"}}, {{"q": "Q2", "a": "A2"}}],
  "content": "<div><h2>Title</h2><p>Content</p></div>",
  "comparison": {{"title": "Top 3", "products": [{{"name": "P1", "price": "100"}}]}},
  "guide": {{"title": "Guide", "sections": [{{"h": "H1", "c": "Content"}}]}}
}}"""
        
        response = self.get_ai_response(prompt)
        
        try:
            import json
            clean_response = response.strip()
            if '```json' in clean_response:
                clean_response = clean_response.replace('```json', '').replace('```', '').strip()
            
            data = json.loads(clean_response)
            return {
                'title': data.get('title', f"{category_name} - Best Quality"),
                'description': data.get('description', f"{category_name} ✅ Premium Quality"),
                'keywords': data.get('keywords', [category_name.lower()]),
                'faq': data.get('faq', []),
                'content': data.get('content', f"<div><h2>{category_name}</h2><p>Quality products</p></div>"),
                'comparisonTable': data.get('comparison'),
                'buyingGuide': data.get('guide')
            }
        except Exception as e:
            safe_print(f"[ERROR] Batch parsing failed: {e}")
            return self.enhance_category_fallback(category_name, category_id)
            
            # Generate comparison table and buying guide separately
            try:
                safe_print(f"[DEBUG] Generating comparison table for {category_name} with category_id: {category_id}")
                comparison_table = self.generate_comparison_table(category_name, category_id)
                if comparison_table:
                    enhanced_category['comparisonTable'] = comparison_table
                    safe_print(f"[SUCCESS] Generated comparison table for {category_name}")
                else:
                    safe_print(f"[WARNING] No comparison table generated for {category_name} (category_id: {category_id})")
            except Exception as e:
                safe_print(f"[WARNING] Comparison table failed for {category_name}: {e}")
            
            try:
                buying_guide = self.generate_buying_guide(category_name, category_id)
                if buying_guide:
                    enhanced_category['buyingGuide'] = buying_guide
                    safe_print(f"[SUCCESS] Generated buying guide for {category_name}")
                else:
                    safe_print(f"[WARNING] No buying guide generated for {category_name}")
            except Exception as e:
                safe_print(f"[WARNING] Buying guide failed for {category_name}: {e}")
            
            # Generate FAQ with internal links
            try:
                faq = self.generate_category_faq_fast(category_name, category_id)
                if faq:
                    enhanced_category['faq'] = faq
            except Exception as e:
                safe_print(f"[WARNING] FAQ failed for {category_name}: {e}")
            
            # Generate internal links for SEO (separate from content)
            try:
                internal_links = self.generate_internal_links(category_name, category_id)
                if internal_links:
                    enhanced_category['internalLinks'] = internal_links
            except Exception as e:
                safe_print(f"[WARNING] Internal links failed for {category_name}: {e}")
            
            try:
                # Generate content without comparison table (we'll add it separately)
                content = self.generate_category_content_fast(category_name, category_id)
                if content:
                    # Remove any comparison tables or JSON data from content
                    import re
                    # Remove comparison table JSON patterns
                    content = re.sub(r"\{'title': 'Comparatif des.*?\}", "", content, flags=re.DOTALL)
                    # Remove any other JSON-like structures
                    content = re.sub(r"\{.*?'rank':.*?\}", "", content, flags=re.DOTALL)
                    # Remove Top 5 lists that might be embedded
                    content = re.sub(r"<h3>Top 5.*?</ul>", "", content, flags=re.DOTALL)
                    # Clean up extra whitespace and newlines
                    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
                    content = content.strip()
                    
                    enhanced_category['content'] = content
            except Exception as e:
                safe_print(f"[WARNING] Content failed for {category_name}: {e}")
            
            return enhanced_category
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to enhance category {category_name}: {e}")
            raise e

    def enhance_category_comprehensive(self, category):
        """Comprehensive category enhancement matching the example structure"""
        category_id = category.get('categoryId')
        category_name = category.get('categoryNameCanonical', 'Unknown')
        
        # Generate comprehensive content matching the example structure
        enhanced_category = {
            'categoryId': category_id,
            'categoryNameCanonical': category_name,
            'slug': self.create_category_slug(category_name),
            'description': self.enhance_category_description(category_name, category_id),
            'content': self.generate_category_content(category_name, category_id),
            'seo': {
                'title': self.enhance_category_title(category_name),
                'description': self.enhance_category_description(category_name, category_id),
                'keywords': self.enhance_category_keywords(category_name),
                'enhancedAt': datetime.now().isoformat()
            },
            'faq': self.generate_category_faq(category_name, category_id),
            'comparisonTable': self.generate_comparison_table(category_name, category_id),
            'buyingGuide': self.generate_buying_guide(category_name, category_id),
            'internalLinks': self.generate_internal_links(category_name, category_id),
            'productCount': category.get('productCount', 0),
            'enhancedAt': datetime.now().isoformat()
        }
        
        return enhanced_category

    def enhance_category_title_fast(self, category_name):
        """Generate SEO title focused ONLY on the specific category"""
        prompt = f"""SEO title (60 chars) for: "{category_name}". Include benefit. Return only title."""
        
        return self.get_ai_response(prompt)

    def enhance_category_description_fast(self, category_name, category_id=None):
        """Generate SEO description focused ONLY on the specific category"""
        prompt = f"""SEO desc (80 chars) for: "{category_name}". Use emoji ✅. Return only description."""
        
        return self.get_ai_response(prompt)

    def enhance_category_batch_ai(self, category_name, category_id=None):
        """Single AI call for ALL category content - MASSIVE COST SAVINGS"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        
        prompt = f"""Complete SEO data for: "{category_name}" in {language_name}

IMPORTANT: 
- Use {language_name} language - use appropriate terms for the target language
- Generate UNIQUE products only - no duplicates
- Return ONLY valid JSON format

JSON only:
{{
  "title": "SEO title (60 chars)",
  "description": "SEO desc (80 chars)", 
  "keywords": ["kw1", "kw2", "kw3"],
  "faq": [{{"q": "Q1", "a": "A1"}}, {{"q": "Q2", "a": "A2"}}],
  "content": "<div><h2>Title</h2><p>Content</p></div>"
}}"""
        
        response = self.get_ai_response(prompt)
        
        try:
            import json
            clean_response = response.strip()
            if '```json' in clean_response:
                clean_response = clean_response.replace('```json', '').replace('```', '').strip()
            
            data = json.loads(clean_response)
            return {
                'title': data.get('title', f"{category_name} - Best Quality"),
                'description': data.get('description', f"{category_name} ✅ Premium Quality"),
                'keywords': data.get('keywords', [category_name.lower()]),
                'faq': data.get('faq', []),
                'content': data.get('content', f"<div><h2>{category_name}</h2><p>Quality products</p></div>")
            }
        except Exception as e:
            safe_print(f"[ERROR] Batch parsing failed: {e}")
            return self.enhance_category_fallback(category_name, category_id)


    def generate_category_faq_fast(self, category_name, category_id=None):
        """Generate FAQ focused ONLY on the specific category"""
        # Get actual product information for better FAQ generation
        product_context = ""
        if category_id:
            try:
                # Load category-products mapping
                category_products_path = os.path.join("data", "indices", "category-products.json")
                if os.path.exists(category_products_path):
                    with open(category_products_path, 'r', encoding='utf-8') as f:
                        category_products = json.load(f)
                    
                    product_ids = category_products.get(str(category_id), [])
                    if product_ids:
                        # Get sample product data for context
                        products_dir = os.path.join("data", "products")
                        sample_product = None
                        for product_id in product_ids[:1]:  # Check first product
                            product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                            if os.path.exists(product_file):
                                try:
                                    with open(product_file, 'r', encoding='utf-8') as f:
                                        sample_product = json.load(f)
                                    break
                                except Exception:
                                    continue
                        
                        if sample_product:
                            product_context = f"Product: {sample_product.get('name', '')[:80]}... Price: {sample_product.get('price', 'N/A')}€"
            except Exception:
                pass
        
        prompt = f"""Create exactly 6 specific FAQ questions for: "{category_name}"

STRICT RULES:
- ONLY questions about "{category_name}" and directly related products
- Questions people actually search on Google
- Specific and useful answers (maximum 50 words)
- CRITICAL: Return ONLY valid JSON format - no markdown, no explanations
- DO NOT use double quotes inside answers
{'- Product context: ' + product_context if product_context else ''}

EXAMPLE for any product category:
[
  {{"question": "What is the best {category_name} for home use?", "answer": "The best {category_name} combines quality, ease of use, and good value. Look for models with positive reviews and reliable performance."}},
  {{"question": "How to choose the right {category_name}?", "answer": "Consider your specific needs, budget, and space requirements. Compare features, reviews, and warranty options to find the perfect match."}},
  {{"question": "Is {category_name} worth the investment?", "answer": "Yes, a quality {category_name} provides excellent value through improved efficiency, convenience, and long-term durability."}},
  {{"question": "What features should I look for in a {category_name}?", "answer": "Key features include reliability, ease of use, energy efficiency, and good customer support. Check reviews for real-world performance."}},
  {{"question": "How long does a {category_name} typically last?", "answer": "Quality {category_name} products last 3-7 years with proper maintenance. Look for models with good warranty coverage and spare parts availability."}},
  {{"question": "Can I use {category_name} in different environments?", "answer": "Most {category_name} models adapt to various conditions. Check specifications for temperature ranges, humidity tolerance, and space requirements."}}
]

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:"""
        
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

    def generate_category_content_fast(self, category_name, category_id=None):
        """Generate content focused ONLY on the specific category with internal linking"""
        price_range = self.get_category_price_range(category_id) if category_id else "from 200€"
        
        # No internal links in content generation
        
        prompt = f"""Create SEO HTML content for: "{category_name}"

STRICT RULES:
- ONLY write about "{category_name}" and directly related products
- Include H2, H3, list with specific product features
- Mention free shipping and quality benefits
- Maximum 300 words
- Valid HTML format
- DO NOT use ```html or ``` - only pure HTML
- DO NOT mention specific prices or price ranges
- DO NOT include comparison tables or product comparisons
- DO NOT include JSON data or structured product lists
- DO NOT include internal links or product links
- Focus on descriptive content about the category benefits and features

EXAMPLE for "{category_name.lower()}":
<div>
<h2>Best {category_name}</h2>
<p>Discover the best <b>{category_name.lower()}</b> with premium quality and advanced features for superior performance.</p>
<h3>Key Features</h3>
<ul>
<li><b>Professional Quality</b>: High-quality materials and construction</li>
<li><b>Easy to Use</b>: Simple and intuitive operation</li>
<li><b>Effective Results</b>: Proven effectiveness and reliability</li>
</ul>
<p>Free shipping and quality guarantee.</p>
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

    def regenerate_content_with_links(self, category_ids=None):
        """Regenerate content for existing categories to include internal linking"""
        safe_print("[START] Regenerating Content with Internal Links")
        safe_print("=" * 60)
        
        # Load categories
        if not os.path.exists(self.categories_file):
            safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
            return
        
        with open(self.categories_file, 'r', encoding='utf-8') as f:
            categories_data = json.load(f)
        
        # Flatten categories
        all_categories = []
        for cat in categories_data:
            all_categories.append(cat)
            if cat.get('subcategories'):
                for sub in cat['subcategories']:
                    all_categories.append(sub)
        
        # Filter categories if specific IDs provided
        if category_ids:
            all_categories = [cat for cat in all_categories if cat.get('categoryId') in category_ids]
        
        safe_print(f"[INFO] Found {len(all_categories)} categories to regenerate")
        
        for i, category in enumerate(all_categories, 1):
            try:
                category_name = category.get('categoryNameCanonical', f'Category {i}')
                category_id = category.get('categoryId', i)
                
                safe_print(f"\n[{i}/{len(all_categories)}] Regenerating: {category_name}")
                
                # Generate new content with internal links
                new_content = self.generate_category_content(category_name, category_id)
                
                # Update the category with new content
                category['content'] = new_content
                category['enhancedAt'] = datetime.now().isoformat()
                
                # Save individual category file
                category_file = os.path.join("data", "categories", f"{category_id}.json")
                with open(category_file, 'w', encoding='utf-8') as f:
                    json.dump(category, f, ensure_ascii=False, indent=2)
                
                safe_print(f"[SUCCESS] Updated {category_name} with internal links")
                
                # Add delay to avoid rate limiting
                time.sleep(1)
                
            except Exception as e:
                safe_print(f"[ERROR] Failed to regenerate {category_name}: {e}")
                continue
        
        safe_print(f"\n[COMPLETE] Regenerated content for {len(all_categories)} categories with internal linking")

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
                seo_description = self.enhance_category_description(category_name, category_id)
                seo_keywords = self.enhance_category_keywords(category_name)
                faq = self.generate_category_faq(category_name, category_id)
                seo_content = self.generate_category_content(category_name, category_id)
                
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

    def generate_comparison_table(self, category_name, category_id=None):
        """Generate comparison table with top 5 products for a category"""
        safe_print(f"[DEBUG] generate_comparison_table called with category_id: {category_id}")
        if not category_id:
            safe_print(f"[DEBUG] No category_id provided, returning None")
            return None
            
        try:
            # Load category-products mapping
            category_products_path = os.path.join("data", "indices", "category-products.json")
            if not os.path.exists(category_products_path):
                safe_print(f"[DEBUG] category-products.json not found")
                return None
                
            with open(category_products_path, 'r', encoding='utf-8') as f:
                category_products = json.load(f)
            
            product_ids = category_products.get(str(category_id), [])
            safe_print(f"[DEBUG] Found {len(product_ids)} products for category_id {category_id}")
            if not product_ids:
                safe_print(f"[DEBUG] No products found for category_id {category_id}")
                return None
            
            # Get product data for top 5 products
            products_dir = os.path.join("data", "products")
            products_data = []
            
            for product_id in product_ids[:5]:  # Top 5 products
                product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                if os.path.exists(product_file):
                    try:
                        with open(product_file, 'r', encoding='utf-8') as f:
                            product_data = json.load(f)
                        products_data.append(product_data)
                    except Exception:
                        continue
            
            if not products_data:
                return None
            
            # Generate comparison table using AI
            prompt = f"""Create a comparison table for the {len(products_data)} available {category_name} products.

PRODUCTS DATA (ONLY USE THESE {len(products_data)} PRODUCTS - DO NOT INVENT ANY ADDITIONAL PRODUCTS):
{json.dumps([{
    'name': p.get('name', ''),
    'price': p.get('price', ''),
    'rating': p.get('amazonRating', 0),
    'description': p.get('description', ''),
    'slug': p.get('slug', ''),
    'images': p.get('images', []),
    'brand': p.get('brand', ''),
    'originalName': p.get('originalName', ''),
    'specifications': p.get('specifications', {})
} for p in products_data], ensure_ascii=False, indent=2)}

REQUIREMENTS:
- Write in {self.language_map.get(self.output_language, self.output_language.title())}
- Create a comparison table with ONLY columns that have meaningful data for ALL products
- Include ALL {len(products_data)} products provided above - DO NOT INVENT OR ADD ANY OTHER PRODUCTS
- Each product must be UNIQUE - do not repeat the same product multiple times
- Rank the provided products by value/quality (rank 1 to {len(products_data)})
- Extract ALL specifications from product descriptions, names, and specifications field - NEVER use "N/A" or "Nicht angegeben"
- If a specification is not explicitly mentioned, infer it from the product name, description, and context
- Use realistic specifications based on product names, descriptions, and category context
- Use the actual product images from the images array (first image)
- Use internal product page URLs (/product/[slug]) instead of Amazon URLs
- CRITICAL: Return ONLY valid JSON format - no markdown, no explanations
- CRITICAL: Include ALL {len(products_data)} products provided - do not skip any products
- CRITICAL: Each product must be different - no duplicates allowed
- CRITICAL: NEVER use "N/A", "Nicht angegeben", or empty values - always infer realistic specifications
- CRITICAL: Include "Rang" column with numbers 1, 2, 3, etc. for ranking
- CRITICAL: Format prices with € symbol (e.g., "190.0€" not "190.0")
- CRITICAL: Do NOT include "Modell" column - product names are shown in the table rows
- CRITICAL: Only include columns where ALL products have meaningful, non-empty values
- CRITICAL: If a column would have "N/A" or empty values for any product, DO NOT include that column
- CRITICAL: Include product images in the ranking display (show image next to rank number)

EXAMPLE STRUCTURE:
{{
  "title": "Vergleich der {len(products_data)} besten {category_name}",
  "columns": ["Rang", "Preis", "Bewertung", "Material", "Anwendungsbereich", "Besondere Eigenschaft"],
  "products": [
    {{
      "rank": 1,
      "rang": "1",
      "rangWithImage": "1 [IMAGE: https://actual-product-image-url.jpg]",
      "name": "Actual Product Name from data",
      "preis": "6.0€",
      "bewertung": "4.5/5",
      "material": "Rosenquarz (inferred from product name/description)",
      "anwendungsbereich": "Gesichtspflege (inferred from category context)",
      "besondere_eigenschaft": "Hohe Qualität (inferred from brand/description)",
      "productUrl": "/product/actual-product-slug",
      "image": "https://actual-product-image-url.jpg"
    }},
    {{
      "rank": 2,
      "rang": "2",
      "rangWithImage": "2 [IMAGE: https://second-product-image-url.jpg]",
      "name": "Second Product Name from data",
      "preis": "12.99€",
      "bewertung": "4.2/5",
      "material": "Jade (inferred from product name/description)",
      "anwendungsbereich": "Körperpflege (inferred from category context)",
      "besondere_eigenschaft": "Langlebig (inferred from brand/description)",
      "productUrl": "/product/second-product-slug",
      "image": "https://second-product-image-url.jpg"
    }}
  ]
}}

IMPORTANT RULES:
- NEVER include "URL Produit" or "Image" in the columns array
- ALWAYS include rank as a number (1, 2, 3, etc.) - never "N/A"
- Price should include € symbol (e.g., "6.0€" not "6.0")
- Rating should be in X.X/5 format
- Include productUrl and image in each product object but NOT in columns
- ALWAYS infer realistic specifications from product names, descriptions, and category context
- NEVER use "N/A", "Nicht angegeben", "Non spécifié", or empty values
- ONLY include columns where ALL products have meaningful, non-empty values
- If any product would have "N/A" for a column, DO NOT include that column at all
- Include "rangWithImage" field showing rank number with image URL for frontend display

CRITICAL: Extract specifications from descriptions, names, and specifications field. If not explicit, infer realistic values from context. NEVER use "N/A" or empty values.

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:"""
            
            # Retry up to 3 times to get valid JSON
            for attempt in range(3):
                try:
                    response = self.get_ai_response(prompt)
                    
                    # Use robust JSON parsing
                    parsed = self.parse_json_response(response, expected_keys=['products'])
                    if parsed:
                        return parsed
                    
                    safe_print(f"[RETRY {attempt + 1}] Invalid JSON format for comparison table, retrying...")
                    time.sleep(1)
                    
                except Exception as e:
                    safe_print(f"[ERROR] Comparison table generation failed for {category_name}: {e}")
                    if attempt == 2:  # Last attempt
                        return None
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to load products for comparison table: {e}")
        
        return None

    def generate_buying_guide(self, category_name, category_id=None):
        """Generate buying guide with relevant sections for a category"""
        keywords = self.get_product_keywords()
        
        # Get actual product information for better buying guide generation
        product_context = ""
        if category_id:
            try:
                # Load category-products mapping
                category_products_path = os.path.join("data", "indices", "category-products.json")
                if os.path.exists(category_products_path):
                    with open(category_products_path, 'r', encoding='utf-8') as f:
                        category_products = json.load(f)
                    
                    product_ids = category_products.get(str(category_id), [])
                    if product_ids:
                        # Get sample product data for context
                        products_dir = os.path.join("data", "products")
                        sample_product = None
                        for product_id in product_ids[:2]:  # Check first 2 products
                            product_file = os.path.join(products_dir, f"{product_id.lower()}.json")
                            if os.path.exists(product_file):
                                try:
                                    with open(product_file, 'r', encoding='utf-8') as f:
                                        sample_product = json.load(f)
                                    break
                                except Exception:
                                    continue
                        
                        if sample_product:
                            product_context = f"Product example: {sample_product.get('name', '')[:100]}... Price: {sample_product.get('price', 'N/A')}€"
            except Exception:
                pass
        
        prompt = f"""Create a comprehensive buying guide for: "{category_name}"

REQUIREMENTS:
- Write in {self.language_map.get(self.output_language, self.output_language.title())}
- Create exactly 5 sections with practical advice
- Each section should have a clear heading and helpful content (maximum 80 words)
- Focus on key features buyers should consider
- Include specific recommendations and tips
- CRITICAL: Return ONLY valid JSON format - no markdown, no explanations
- Consider keywords: {', '.join(keywords[:2])}
{'- Product context: ' + product_context if product_context else ''}

STRICT JSON FORMAT REQUIRED:
{{
  "title": "Buying Guide: How to Choose the Best {category_name}?",
  "sections": [
    {{
      "heading": "1. Function/Feature",
      "content": "Detailed explanation and recommendation for this function..."
    }},
    {{
      "heading": "2. Important Aspect", 
      "content": "Practical advice and tips for this aspect..."
    }},
    {{
      "heading": "3. Third Key Point",
      "content": "Important considerations and recommendations..."
    }},
    {{
      "heading": "4. Fourth Essential Factor",
      "content": "Critical advice for buyers..."
    }},
    {{
      "heading": "5. Final Recommendation",
      "content": "Summary and final buying tips..."
    }}
  ]
}}

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT:"""
        
        # Retry up to 3 times to get valid JSON
        for attempt in range(3):
            try:
                response = self.get_ai_response(prompt)
                
                # Use robust JSON parsing
                parsed = self.parse_json_response(response, expected_keys=['sections'])
                if parsed:
                    return parsed
                
                safe_print(f"[RETRY {attempt + 1}] Invalid JSON format for buying guide, retrying...")
                time.sleep(1)
                
            except Exception as e:
                safe_print(f"[ERROR] Buying guide generation failed for {category_name}: {e}")
                if attempt == 2:  # Last attempt
                    return None
        
        return None

    def generate_internal_links(self, category_name, category_id=None):
        """Generate internal links for better SEO"""
        try:
            # Load categories to find related ones
            if os.path.exists(self.categories_file):
                with open(self.categories_file, 'r', encoding='utf-8') as f:
                    categories = json.load(f)
                
                # Find related categories (exclude current one)
                related_links = []
                for category in categories:
                    if category.get('slug') != category_name.lower().replace(' ', '-'):
                        related_links.append({
                            "text": f"View all {category.get('name', '').lower()}",
                            "url": f"/category/{category.get('slug', '')}"
                        })
                
                # Add subcategory links if available
                for category in categories:
                    if category.get('slug') == category_name.lower().replace(' ', '-'):
                        subcategories = category.get('subcategories', [])
                        for subcat in subcategories[:2]:  # Limit to 2 subcategories
                            related_links.append({
                                "text": f"Discover {subcat.get('name', '').lower()}",
                                "url": f"/category/{subcat.get('slug', '')}"
                            })
                        break
                
                return related_links[:3]  # Limit to 3 links
                
        except Exception as e:
            safe_print(f"[ERROR] Failed to generate internal links: {e}")
        
        return []

    def enhance_categories_comprehensive(self, category_ids=None):
        """Enhance categories with comprehensive structure including comparison tables and buying guides"""
        try:
            # Load categories
            if not os.path.exists(self.categories_file):
                safe_print(f"[ERROR] Categories file not found: {self.categories_file}")
                return
            
            with open(self.categories_file, 'r', encoding='utf-8') as f:
                categories = json.load(f)
            
            # Filter categories if specific IDs provided
            if category_ids:
                categories = [cat for cat in categories if cat.get('categoryId') in category_ids]
            
            if not categories:
                safe_print("[ERROR] No categories found to enhance")
                return
            
            safe_print(f"\n🚀 Starting comprehensive enhancement for {len(categories)} categories...")
            safe_print("=" * 60)
            
            enhanced_count = 0
            failed_count = 0
            
            for category in categories:
                try:
                    category_id = category.get('categoryId')
                    category_name = category.get('categoryNameCanonical', 'Unknown')
                    
                    safe_print(f"[PROCESSING] Enhancing: {category_name} (ID: {category_id})")
                    
                    # Generate comprehensive enhancement
                    enhanced_category = self.enhance_category_comprehensive(category)
                    
                    # Save to individual file
                    filename = f"{category_id}.json"
                    filepath = os.path.join(self.categories_dir, filename)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(enhanced_category, f, ensure_ascii=False, indent=2)
                    
                    enhanced_count += 1
                    safe_print(f"[SUCCESS] Enhanced: {category_name}")
                    
                    # Small delay to avoid rate limiting
                    time.sleep(0.5)
                    
                except Exception as e:
                    failed_count += 1
                    safe_print(f"[ERROR] Failed to enhance category {category_id}: {str(e)[:100]}")
            
            # Summary
            safe_print(f"\n[SUMMARY] Comprehensive Enhancement Complete")
            safe_print("=" * 50)
            safe_print(f"✅ Enhanced: {enhanced_count} categories")
            safe_print(f"❌ Failed: {failed_count} categories")
            safe_print(f"📁 Files saved to: {self.categories_dir}")
            safe_print(f"📊 Features included: Comparison tables, Buying guides, Internal links, SEO optimization")
            
        except Exception as e:
            safe_print(f"[ERROR] Comprehensive enhancement failed: {e}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Category Enhancer with Multi-Language Support')
    parser.add_argument('--language', '-l', default='french', 
                       choices=['german', 'spanish', 'french', 'italian', 'dutch', 'polish', 'swedish', 'english', 'portuguese', 'russian', 'chinese', 'japanese', 'korean'],
                       help='Output language for generated content (default: french)')
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
        # Auto-run MEGA-FAST enhancement for 1000+ categories
        safe_print("\n🏷️ AI Category Enhancer - Auto Mode")
        safe_print("Automatically running MEGA-FAST enhancement for 1000+ categories")
        safe_print("=" * 60)
        safe_print("\n⚡ Starting MEGA-FAST enhancement for 1000+ categories...")
        enhancer.enhance_categories_mega_fast()

if __name__ == "__main__":
    main() 