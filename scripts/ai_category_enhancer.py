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
    def __init__(self):
        self.categories_file = "data/categories.json"
        self.categories_dir = "data/categories"
        self.config_file = "scripts/ai-config.json"
        
        # Create directories if they don't exist
        os.makedirs(self.categories_dir, exist_ok=True)
        
        # Load AI configuration
        self.ai_config = self.load_ai_config()
        
        # Performance settings - ULTRA-FAST TEMPLATE MODE
        self.request_delay = 0  # NO DELAY - TEMPLATE MODE
        self.batch_size = 100  # Process 100 categories at once for maximum speed
        self.max_concurrent = 20  # Maximum concurrency
    
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
            "spanish_keywords": [
                "productos",
                "mejor precio",
                "oferta",
                "envio gratis",
                "garantia",
                "calidad",
                "fácil uso",
                "españa"
            ],
            "seo_settings": {
                "default_price": "desde 19€",
                "store_name": "Tu Tienda"
            }
        }
    
    def get_product_keywords(self):
        """Get product-specific keywords from config"""
        return self.ai_config.get("spanish_keywords", ["productos", "mejor precio", "oferta"])
    
    def get_default_price(self):
        """Get default price from config"""
        return self.ai_config.get("seo_settings", {}).get("default_price", "desde 19€")
    
    def get_ai_response(self, prompt, max_retries=3):
        """
        Get AI response using Google Gemini 2.5 Flash
        """
        try:
            import google.generativeai as genai
            
            # Configure Gemini with your API key
            API_KEY = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
            
            if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
                safe_print("[ERROR] Please set your Gemini API key in the script!")
                return self.get_fallback_response(prompt)
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # System prompt for Spanish SEO expert
            system_prompt = "Eres un experto en SEO y marketing digital para productos en España. Siempre respondes en español de forma clara, persuasiva y optimizada para SEO."
            
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Add delay to avoid rate limiting
            time.sleep(self.request_delay)
            
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
        
        prompt = f"""Crea una descripción SEO corta (máximo 80 caracteres) para: {category_name}

REQUISITOS:
- Incluir beneficios clave para el producto
- Mencionar precio ({default_price})
- Crear urgencia (envío gratis)
- Dirigirse a compradores
- Usar palabras clave relevantes: {', '.join(keywords[:3])}

EJEMPLO: "{category_name} ✅ Calidad Premium. {default_price} ¡Envío Gratis!"

Responde SOLO la descripción:"""
        
        return self.get_ai_response(prompt)
    
    def enhance_category_title(self, category_name):
        """Generate SEO-optimized title for a category"""
        keywords = self.get_product_keywords()
        
        prompt = f"""Crea un título SEO corto (máximo 50 caracteres) para: {category_name}

REQUISITOS:
- Incluir palabras clave principales
- Mencionar beneficios clave del producto
- Dirigirse a compradores
- Usar palabras clave: {', '.join(keywords[:2])}

EJEMPLO: "{category_name} | Calidad Premium"

Responde SOLO el título:"""
        
        return self.get_ai_response(prompt)
    
    def enhance_category_keywords(self, category_name):
        """Generate SEO keywords for a category"""
        keywords = self.get_product_keywords()
        
        prompt = f"""Genera 5 palabras clave SEO para: {category_name}

REQUISITOS:
- Incluir términos de cola larga
- Mencionar beneficios clave del producto
- Incluir términos geográficos (España)
- Incluir términos de compra (barato, oferta)
- Basarse en palabras clave existentes: {', '.join(keywords[:3])}

Formato: palabra1, palabra2, palabra3, etc.
Responde SOLO las palabras clave:"""
        
        response = self.get_ai_response(prompt)
        # Convert to array
        keywords = [kw.strip() for kw in response.split(',') if kw.strip()]
        return keywords[:5]  # Limit to 5 keywords
    
    def generate_category_faq(self, category_name):
        """Generate FAQ for a category"""
        keywords = self.get_product_keywords()
        
        prompt = f"""Crea exactamente 3 preguntas FAQ específicas para: {category_name}

REQUISITOS:
- Preguntas que la gente busca en Google sobre {category_name}
- Respuestas específicas y útiles (máximo 50 palabras)
- Enfocarse en beneficios específicos del producto
- Evitar repetición de palabras clave
- Formato JSON válido OBLIGATORIO
- Considerar palabras clave: {', '.join(keywords[:2])}

EJEMPLO:
[
  {{"question": "¿Cuál es la autonomía del patinete eléctrico?", "answer": "Los patinetes eléctricos tienen autonomía de 15-30km según el modelo y batería."}},
  {{"question": "¿Es fácil de usar el patinete eléctrico?", "answer": "Sí, los patinetes eléctricos son muy fáciles de usar con aceleración automática."}},
  {{"question": "¿Hay garantía en los patinetes eléctricos?", "answer": "Sí, todos nuestros patinetes eléctricos incluyen garantía completa de 2 años."}}
]

IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional:"""
        
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
        
        prompt = f"""Crea contenido SEO muy corto (100-150 palabras) para: {category_name}

REQUISITOS:
- Estructura HTML simple
- Incluir beneficios clave del producto
- Mencionar precio ({default_price})
- Dirigirse a compradores
- Evitar repetición excesiva de palabras clave
- Enfoque en productos, no texto
- Usar palabras clave: {', '.join(keywords[:3])}

ESTRUCTURA:
<div>
<h2>Los Mejores {category_name}</h2>
<p>Descubre los mejores {category_name} diseñados para máxima calidad y facilidad de uso.</p>
<h3>Características Principales</h3>
<ul><li>Calidad premium</li><li>Fácil de usar</li><li>Garantía incluida</li><li>Envío gratis</li></ul>
<p>{default_price} con envío gratis. ¡Encuentra el modelo perfecto para ti!</p>
</div>

Responde SOLO el HTML:"""
        
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
        safe_print(f"[WARNING] Estimated time: {len(categories) * 4 / 60:.1f} minutes")
        
        # Ask for confirmation
        confirm = input("\n⚠️  Continue with full enhancement? (y/n): ").strip().lower()
        if confirm != 'y':
            safe_print("[CANCELLED] Full enhancement cancelled")
            return
        
        enhanced_count = 0
        failed_count = 0
        
        for i, category in enumerate(categories, 1):
            try:
                category_name = category.get('categoryNameCanonical', f'Category {i}')
                category_id = category.get('categoryId', i)
                
                safe_print(f"[PROGRESS] {i}/{len(categories)} - Enhancing: {category_name}")
                
                # Generate all content
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
                safe_print(f"[SUCCESS] Saved: {category_filepath}")
                
                # Small delay to avoid overwhelming the API
                time.sleep(0.5)
                
            except Exception as e:
                failed_count += 1
                safe_print(f"[ERROR] Failed to enhance category {i}: {str(e)}")
        
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
        prompt = f"""Crea un título SEO de máximo 60 caracteres para: "{category_name}"

REGLAS ESTRICTAS:
- SOLO mencionar productos relacionados con "{category_name}"
- Incluir beneficio clave específico del producto
- Usar palabras de acción (Comprar, Descubre, Mejores)

EJEMPLO para "patinete electrico": "Patinetes Eléctricos - Mejor Precio y Calidad"
Responde SOLO el título:"""
        
        return self.get_ai_response(prompt)

    def enhance_category_description_fast(self, category_name):
        """Generate SEO description focused ONLY on the specific category"""
        prompt = f"""Crea una descripción SEO de máximo 80 caracteres para: "{category_name}"

REGLAS ESTRICTAS:
- SOLO mencionar "{category_name}" y productos directamente relacionados
- Usar emoji ✅

EJEMPLO para "patinete electrico": "Patinetes Eléctricos ✅ Calidad Premium. Desde 19€ ¡Envío Gratis!"
Responde SOLO la descripción:"""
        
        return self.get_ai_response(prompt)

    def enhance_category_keywords_fast(self, category_name):
        """Generate keywords focused ONLY on the specific category"""
        prompt = f"""Crea 5 palabras clave SEO para: "{category_name}"

REGLAS ESTRICTAS:
- SOLO palabras relacionadas con "{category_name}"
- Formato: lista simple separada por comas

EJEMPLO para "patinete electrico": "patinete electrico, mejor precio patinete, oferta patinete electrico, envio gratis patinete, patinete calidad"
Responde SOLO las palabras clave separadas por comas:"""
        
        response = self.get_ai_response(prompt)
        return [kw.strip() for kw in response.split(',') if kw.strip()]

    def generate_category_faq_fast(self, category_name):
        """Generate FAQ focused ONLY on the specific category"""
        prompt = f"""Crea exactamente 3 preguntas frecuentes específicas para: "{category_name}"

REGLAS ESTRICTAS:
- SOLO preguntas sobre "{category_name}" y productos directamente relacionados
- Preguntas que la gente realmente busca en Google
- Respuestas específicas y útiles (máximo 50 palabras)
- Formato JSON válido OBLIGATORIO
- NO usar comillas dobles dentro de las respuestas

EJEMPLO para "patinete electrico":
[
  {{"question": "¿Cuál es la autonomía del patinete eléctrico?", "answer": "Los patinetes eléctricos tienen autonomía de 15-30km según el modelo y batería."}},
  {{"question": "¿Es fácil de usar el patinete eléctrico?", "answer": "Sí, los patinetes eléctricos son muy fáciles de usar con aceleración automática y controles simples."}},
  {{"question": "¿Hay garantía en los patinetes eléctricos?", "answer": "Sí, todos nuestros patinetes eléctricos incluyen garantía completa de 2 años."}}
]

IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional:"""
        
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
        prompt = f"""Crea contenido HTML SEO para: "{category_name}"

REGLAS ESTRICTAS:
- SOLO escribir sobre "{category_name}" y productos directamente relacionados
- Incluir H2, H3, lista con características específicas del producto
- Mencionar precio desde 19€ y envío gratis
- Máximo 300 palabras
- Formato HTML válido
- NO usar ```html o ``` - solo el HTML puro

EJEMPLO para "patinete electrico":
<div>
<h2>Los Mejores Patinetes Eléctricos</h2>
<p>Descubre los mejores <b>patinetes eléctricos</b> con la mejor calidad y precio.</p>
<h3>Características Principales</h3>
<ul>
<li><b>Autonomía Extendida</b>: Hasta 30km de autonomía</li>
<li><b>Fácil Manejo</b>: Control intuitivo y estable</li>
<li><b>Plegable</b>: Fácil transporte y almacenamiento</li>
</ul>
<p>Desde <b>19€</b> con envío gratis.</p>
</div>

Responde SOLO el HTML sin ```html:"""
        
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
    enhancer = AICategoryEnhancer()
    
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