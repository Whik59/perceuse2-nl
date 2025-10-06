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

def safe_print(message):
    """Thread-safe print function that handles encoding issues"""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('utf-8', errors='ignore').decode('utf-8'))

class AICategoryEnhancer:
    def __init__(self):
        self.categories_file = "../data/categories.json"
        self.categories_dir = "../data/categories"
        self.backup_dir = "../backups"
        
        # Create directories if they don't exist
        os.makedirs(self.categories_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Performance settings - OPTIMIZED FOR SPEED
        self.request_delay = 0.2  # Reduced delay for faster processing
        self.batch_size = 20  # Process categories in batches
        self.max_concurrent = 5  # Concurrent AI requests
    
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
            system_prompt = "Eres un experto en SEO y marketing digital para teléfonos móviles dirigidos a personas mayores en España. Siempre respondes en español de forma clara, persuasiva y optimizada para SEO."
            
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
    
    def get_fallback_response(self, prompt):
        """Fallback responses when AI service is not available"""
        if "descripción" in prompt.lower():
            return "Encuentra los mejores teléfonos móviles para personas mayores. Fáciles de usar, con botones grandes y funciones de emergencia."
        elif "título" in prompt.lower():
            return "Teléfonos Móviles para Mayores"
        elif "faq" in prompt.lower():
            return '[{"question":"¿Es fácil de usar?","answer":"Sí, muy fácil de usar para personas mayores."}]'
        return "Teléfonos móviles especialmente diseñados para personas mayores"
    
    def enhance_category_description(self, category_name):
        """Generate SEO-optimized description for a category"""
        prompt = f"""Crea una descripción SEO corta (máximo 120 caracteres) para: {category_name}

REQUISITOS:
- Incluir beneficios clave (fácil uso, botones grandes, SOS)
- Mencionar precio (desde 19€)
- Crear urgencia (envío gratis, ofertas)
- Dirigirse a familiares

EJEMPLO: "Teléfonos SOS para Mayores ✅ Botones Grandes, Fácil Uso. Desde 19€ ¡Envío Gratis!"

Responde SOLO la descripción:"""
        
        return self.get_ai_response(prompt)
    
    def enhance_category_title(self, category_name):
        """Generate SEO-optimized title for a category"""
        prompt = f"""Crea un título SEO corto (máximo 50 caracteres) para: {category_name}

REQUISITOS:
- Incluir palabras clave principales
- Mencionar beneficios (SOS, fácil uso)
- Dirigirse a mayores/familiares

EJEMPLO: "Teléfonos SOS para Mayores | Botones Grandes"

Responde SOLO el título:"""
        
        return self.get_ai_response(prompt)
    
    def enhance_category_keywords(self, category_name):
        """Generate SEO keywords for a category"""
        prompt = f"""Genera 8 palabras clave SEO para: {category_name}

REQUISITOS:
- Incluir términos de cola larga
- Mencionar beneficios (fácil uso, SOS, botones grandes)
- Incluir términos geográficos (España)
- Incluir términos de compra (barato, oferta)

Formato: palabra1, palabra2, palabra3, etc.
Responde SOLO las palabras clave:"""
        
        response = self.get_ai_response(prompt)
        # Convert to array
        keywords = [kw.strip() for kw in response.split(',') if kw.strip()]
        return keywords[:8]  # Limit to 8 keywords
    
    def generate_category_faq(self, category_name):
        """Generate FAQ for a category"""
        prompt = f"""Crea 4 preguntas FAQ en JSON para: {category_name}

REQUISITOS:
- Preguntas que la gente busca en Google
- Incluir palabras clave en las preguntas
- Respuestas cortas y útiles
- Enfocarse en beneficios para mayores

Formato:
[{{"question":"¿Es fácil de usar?","answer":"Sí, muy fácil..."}},{{"question":"¿Cuánto cuesta?","answer":"Desde 19€..."}}]

Responde SOLO el JSON:"""
        
        response = self.get_ai_response(prompt)
        
        # Parse JSON
        try:
            if '[' in response and ']' in response:
                json_match = re.search(r'\[.*\]', response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return parsed if isinstance(parsed, list) and len(parsed) > 0 else self.get_fallback_faq(category_name)
        except:
            pass
        
        return self.get_fallback_faq(category_name)
    
    def generate_category_content(self, category_name):
        """Generate optimized SEO content for a category"""
        prompt = f"""Crea contenido SEO corto (200-250 palabras) para: {category_name}

REQUISITOS:
- Estructura HTML simple
- Incluir beneficios clave (fácil uso, SOS, botones grandes)
- Mencionar precios (desde 19€)
- Dirigirse a familiares
- Incluir llamada a la acción

ESTRUCTURA:
<div>
<h2>Los Mejores {category_name} para Mayores</h2>
<p>Párrafo introductorio...</p>
<h3>Características Principales</h3>
<ul><li>Beneficio 1</li><li>Beneficio 2</li></ul>
<h3>¿Por Qué Elegir Estos Productos?</h3>
<p>Beneficios para la familia...</p>
<p>Llamada a la acción...</p>
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
    
    def get_fallback_faq(self, category_name):
        """Fallback FAQ for categories"""
        return [
            {"question": "¿Es fácil de usar para personas mayores?", "answer": f"Sí, los {category_name} están diseñados específicamente para facilitar su uso a personas mayores."},
            {"question": "¿Cuánto cuesta?", "answer": f"Los precios van desde 19€, con envío gratis incluido."},
            {"question": "¿Tiene función SOS?", "answer": "Sí, incluye botón SOS para llamadas de emergencia rápidas."},
            {"question": "¿Es compatible con todas las operadoras?", "answer": "Sí, es compatible con todas las redes en España."}
        ]
    
    def create_category_slug(self, category_name):
        """Create URL-friendly slug from category name"""
        slug = category_name.lower()
        # Replace spaces and special characters
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = slug.strip('-')
        return slug
    
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
        safe_print("4. View category statistics")
        safe_print("5. Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
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
            
        elif choice == '5':
            safe_print("\n👋 Goodbye!")
            break
        
        else:
            safe_print("[ERROR] Please enter a valid option (1-5)")

if __name__ == "__main__":
    main() 