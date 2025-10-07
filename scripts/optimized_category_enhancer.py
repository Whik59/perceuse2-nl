#!/usr/bin/env python3
"""
Universal AI-Powered Category Enhancer
Creates individual JSON files + index with unique AI-generated content for any product category
"""

import json
import os
from datetime import datetime
import concurrent.futures
import time
import re
import asyncio
import aiohttp
from threading import Semaphore

def safe_print(message):
    """Thread-safe print function"""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('utf-8', errors='ignore').decode('utf-8'))

class OptimizedCategoryEnhancer:
    def __init__(self):
        self.categories_file = "data/categories.json"
        self.categories_dir = "data/categories"
        self.backup_dir = "backups"
        self.config_file = "scripts/ai-config.json"
        
        # Create directories
        os.makedirs(self.categories_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Load AI configuration
        self.ai_config = self.load_ai_config()
        
        # Performance settings - MAXIMUM CONCURRENCY
        self.batch_size = 10  # Smaller batches for maximum AI concurrency
        self.max_workers = 15  # Higher concurrency for AI calls
        self.request_delay = 0.01  # Minimal delay for maximum speed
        self.max_concurrent_requests = 25  # Max concurrent AI requests
        self.ai_semaphore = Semaphore(self.max_concurrent_requests)  # Control concurrent AI calls
    
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
            "ai_service": {
                "provider": "gemini",
                "api_key": "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg",
                "model": "gemini-2.5-flash"
            }
        }
    
    def get_ai_response_fast(self, prompt, max_retries=2):
        """ULTRA-FAST AI response with maximum concurrency"""
        with self.ai_semaphore:  # Control concurrent requests
            try:
                import google.generativeai as genai
                
                # Configure Gemini with API key
                api_key = self.ai_config.get("ai_service", {}).get("api_key")
                if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
                    raise Exception("AI service required - no fallbacks allowed")
                
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                
                # System prompt for Spanish SEO expert
                system_prompt = "Eres un experto en SEO y marketing digital para productos en España. Siempre respondes en español de forma clara, persuasiva y optimizada para SEO."
                
                full_prompt = f"{system_prompt}\n\n{prompt}"
                
                # Ultra-minimal delay for maximum speed
                time.sleep(self.request_delay)
                
                response = model.generate_content(full_prompt)
                
                if response and response.text:
                    return response.text.strip()
                else:
                    raise Exception("Empty AI response")
                    
            except ImportError:
                raise Exception("Google AI library not installed!")
            except Exception as e:
                raise Exception(f"AI request failed: {e}")
    
    def get_ai_response(self, prompt, max_retries=3):
        """Legacy method - redirects to fast version"""
        return self.get_ai_response_fast(prompt, max_retries)
    
    def get_fallback_response(self, prompt):
        """No fallbacks - force AI generation"""
        raise Exception("AI service required - no fallbacks allowed")
    
    def generate_ai_seo_title(self, category_name):
        """Generate unique SEO-optimized title using AI - TRANSACTIONAL FOCUS"""
        prompt = f"""Crea un título SEO optimizado para COMPRAR {category_name} (máximo 60 caracteres)

ENFOQUE TRANSACCIONAL:
- Palabras de compra: "Comprar", "Oferta", "Precio", "Barato"
- Beneficios específicos del producto
- Urgencia: "¡Ahora!", "Oferta limitada", "Envío gratis"
- Precio atractivo: "desde 199€"
- Llamada a la acción clara

EJEMPLO: "Comprar {category_name} Barato ✅ desde 199€ ¡Envío Gratis!"

Responde SOLO el título:"""
        
        return self.get_ai_response_fast(prompt)
    
    def generate_ai_seo_description(self, category_name):
        """Generate unique SEO-optimized description using AI - CATEGORY-SPECIFIC"""
        prompt = f"""Crea una descripción SEO específica y única para: {category_name} (máximo 160 caracteres)

ENFOQUE ESPECÍFICO:
- Incluir información específica del producto/marca/modelo
- Mencionar características técnicas relevantes
- Beneficios específicos del producto
- Evitar frases genéricas como "desde 199€"
- Hacer la descripción única para este producto específico

EJEMPLOS:
- Para "patinete eléctrico xiaomi": "Descubre los patinetes Xiaomi Mi Electric Scooter con diseño minimalista, batería de larga duración y velocidad hasta 25km/h. Modelos Pro 2, 3 y 4 Ultra disponibles."
- Para "patinete eléctrico acer": "Patinetes eléctricos Acer con motor potente, autonomía extendida y diseño robusto. Perfectos para movilidad urbana con garantía oficial Acer."

Responde SOLO la descripción específica para {category_name}:"""
        
        return self.get_ai_response_fast(prompt)
    
    def generate_ai_keywords(self, category_name):
        """Generate unique SEO keywords using AI - CATEGORY-SPECIFIC"""
        prompt = f"""Genera 5 palabras clave SEO específicas para: {category_name}

ENFOQUE ESPECÍFICO:
- Incluir términos específicos del producto/marca/modelo
- Características técnicas relevantes
- Beneficios específicos del producto
- Evitar términos genéricos
- Hacer las palabras clave únicas para este producto

EJEMPLOS:
- Para "patinete eléctrico xiaomi": "xiaomi mi electric scooter, patinete xiaomi pro 2, scooter xiaomi 4 ultra, xiaomi scooter batería, patinete xiaomi velocidad"
- Para "patinete eléctrico acer": "acer patinete eléctrico, scooter acer motor, patinete acer autonomía, acer scooter características, patinete acer garantía"

Formato: palabra1, palabra2, palabra3, etc.
Responde SOLO las palabras clave específicas para {category_name}:"""
        
        response = self.get_ai_response_fast(prompt)
        # Convert to array
        keywords = [kw.strip() for kw in response.split(',') if kw.strip()]
        return keywords[:5]  # Limit to 5 keywords
    
    def generate_ai_faq(self, category_name):
        """Generate unique FAQ using AI - CATEGORY-SPECIFIC"""
        prompt = f"""Crea 4 preguntas FAQ específicas en JSON para: {category_name}

ENFOQUE ESPECÍFICO:
- Preguntas específicas sobre este producto/marca/modelo
- Respuestas técnicas relevantes
- Características específicas del producto
- Evitar preguntas genéricas
- Hacer preguntas únicas para este producto específico

EJEMPLOS:
- Para "patinete eléctrico xiaomi": preguntas sobre modelos específicos, batería Xiaomi, velocidad, autonomía
- Para "patinete eléctrico acer": preguntas sobre características Acer, motor, garantía oficial

Formato: [{{"question":"¿Cuál es la autonomía del Xiaomi Pro 2?","answer":"El Xiaomi Pro 2 ofrece hasta 45km de autonomía..."}},{{"question":"¿Qué velocidad alcanza?","answer":"Puede alcanzar hasta 25km/h..."}}]
Responde SOLO el JSON específico para {category_name}:"""
        
        response = self.get_ai_response_fast(prompt)
        
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
    
    def generate_ai_content(self, category_name):
        """Generate unique SEO content using AI - CATEGORY-SPECIFIC"""
        prompt = f"""Crea contenido SEO específico (150-200 palabras) para: {category_name}

ENFOQUE ESPECÍFICO:
- Información específica del producto/marca/modelo
- Características técnicas relevantes
- Beneficios específicos del producto
- Evitar contenido genérico
- Hacer el contenido único para este producto específico

EJEMPLOS:
- Para "patinete eléctrico xiaomi": hablar sobre modelos Xiaomi específicos, batería, velocidad, diseño minimalista
- Para "patinete eléctrico acer": hablar sobre características Acer, motor, autonomía, garantía oficial

ESTRUCTURA HTML:
<div class="category-content">
<h2>{category_name} - Características y Especificaciones</h2>
<p>Descubre las características específicas de {category_name}...</p>
<h3>Características Principales</h3>
<ul><li>Característica específica 1</li><li>Característica específica 2</li></ul>
<p>Información específica sobre {category_name}...</p>
</div>

Responde SOLO el HTML específico para {category_name}:"""
        
        response = self.get_ai_response_fast(prompt)
        
        # Clean HTML response
        response = response.strip()
        if '```html' in response:
            response = re.sub(r'```html\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        # Ensure proper HTML structure
        if not response.startswith('<div'):
            response = f"<div class=\"category-content\">\n{response}"
        if not response.endswith('</div>'):
            response = f"{response}\n</div>"
            
        return response
    
    def get_fallback_faq(self, category_name):
        """Fallback FAQ for categories - UNIVERSAL"""
        return [
            {"question": f"¿Qué es {category_name}?", "answer": f"Los {category_name} son productos de alta calidad diseñados para máxima satisfacción del cliente."},
            {"question": "¿Cuál es el precio?", "answer": "Los precios varían según el modelo, desde 199€ con envío gratis incluido."},
            {"question": "¿Tiene garantía?", "answer": "Sí, todos nuestros productos incluyen garantía completa de 2 años."},
            {"question": "¿Cuánto tarda el envío?", "answer": "Envío gratuito en 24-48 horas a toda España peninsular."}
        ]
    
    def load_categories(self):
        """Load categories from main file"""
        if not os.path.exists(self.categories_file):
            safe_print(f"❌ Categories file not found: {self.categories_file}")
            return []
        
        try:
            with open(self.categories_file, 'r', encoding='utf-8') as f:
                categories = json.load(f)
            return categories
        except Exception as e:
            safe_print(f"❌ Failed to load categories: {str(e)}")
            return []
    
    def enhance_category_fast(self, category):
        """AI-powered category enhancement with unique content"""
        category_id = category.get('categoryId')
        category_name = category.get('categoryNameCanonical', 'Unknown')
        
        # Create SEO-optimized slug
        slug = self.create_seo_slug(category_name)
        
        # Generate AI-powered unique content
        safe_print(f"🤖 Generating AI content for: {category_name}")
        
        # Generate all AI content
        seo_title = self.generate_ai_seo_title(category_name)
        seo_description = self.generate_ai_seo_description(category_name)
        seo_keywords = self.generate_ai_keywords(category_name)
        faq = self.generate_ai_faq(category_name)
        content = self.generate_ai_content(category_name)
        
        enhanced_category = {
            'categoryId': category_id,
            'categoryNameCanonical': category_name,
            'slug': slug,
            'seo': {
                'title': seo_title,
                'description': seo_description,
                'keywords': seo_keywords
            },
            'faq': faq,
            'content': content,
            'meta': {
                'enhanced': True,
                'enhanced_at': datetime.now().isoformat(),
                'version': 'ai_powered_v1',
                'ai_generated': True,
                'file_size': 0  # Will be calculated after saving
            }
        }
        
        return enhanced_category
    
    def create_seo_slug(self, category_name):
        """Create SEO-optimized slug"""
        slug = category_name.lower()
        # Replace spaces and special characters
        slug = slug.replace(' ', '-')
        slug = slug.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
        slug = slug.replace('ñ', 'n')
        # Remove special characters
        slug = ''.join(c for c in slug if c.isalnum() or c == '-')
        # Remove multiple dashes
        while '--' in slug:
            slug = slug.replace('--', '-')
        # Remove leading/trailing dashes
        slug = slug.strip('-')
        return slug
    
    
    def save_category_file(self, enhanced_category):
        """Save individual category file"""
        category_id = enhanced_category['categoryId']
        filename = f"{category_id}.json"
        filepath = os.path.join(self.categories_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
            
            # Calculate file size
            file_size = os.path.getsize(filepath)
            enhanced_category['meta']['file_size'] = file_size
            
            return True, filename, file_size
        except Exception as e:
            return False, filename, str(e)
    
    
    def process_categories_parallel(self, categories):
        """Process categories with MAXIMUM CONCURRENCY"""
        safe_print(f"🚀 Processing {len(categories)} categories with MAXIMUM CONCURRENCY...")
        safe_print(f"⚡ Settings: Batch size {self.batch_size}, Workers {self.max_workers}, Concurrent AI calls {self.max_concurrent_requests}")
        
        enhanced_categories = []
        successful_count = 0
        failed_count = 0
        
        # Process in ultra-small batches for maximum AI concurrency
        for i in range(0, len(categories), self.batch_size):
            batch = categories[i:i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            total_batches = (len(categories) + self.batch_size - 1) // self.batch_size
            
            safe_print(f"⚡ Processing batch {batch_num}/{total_batches} ({len(batch)} categories)")
            
            # Process batch with MAXIMUM concurrency
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all enhancement tasks immediately
                future_to_category = {
                    executor.submit(self.enhance_category_fast, category): category 
                    for category in batch
                }
                
                # Collect results as they complete (no waiting)
                for future in concurrent.futures.as_completed(future_to_category):
                    category = future_to_category[future]
                    try:
                        enhanced_category = future.result()
                        
                        # Save file immediately
                        success, filename, result = self.save_category_file(enhanced_category)
                        
                        if success:
                            enhanced_categories.append(enhanced_category)
                            successful_count += 1
                            safe_print(f"✅ {enhanced_category['categoryNameCanonical']} -> {filename}")
                        else:
                            failed_count += 1
                            safe_print(f"❌ Failed to save {filename}: {result}")
                            
                    except Exception as e:
                        failed_count += 1
                        safe_print(f"❌ Failed to enhance {category.get('categoryNameCanonical', 'Unknown')}: {str(e)[:100]}")
            
            # No delay between batches for maximum speed
            if i + self.batch_size < len(categories):
                time.sleep(0.01)  # Ultra-minimal delay
        
        return enhanced_categories, successful_count, failed_count
    
    def test_single_category(self):
        """Test AI enhancement on a single category"""
        safe_print("🧪 AI Category Enhancement - TEST MODE")
        safe_print("=" * 50)
        
        # Load categories
        categories = self.load_categories()
        if not categories:
            safe_print("❌ No categories found!")
            return
        
        # Test with the first category
        test_category = categories[0]
        category_name = test_category.get('categoryNameCanonical', 'Test Category')
        category_id = test_category.get('categoryId', 1)
        
        safe_print(f"🧪 Testing with category: {category_name} (ID: {category_id})")
        safe_print("-" * 40)
        
        try:
            # Generate AI content
            enhanced_category = self.enhance_category_fast(test_category)
            
            safe_print(f"\n✅ AI Enhancement Complete!")
            safe_print("=" * 30)
            safe_print(f"Category: {category_name}")
            safe_print(f"SEO Title: {enhanced_category['seo']['title']}")
            safe_print(f"SEO Description: {enhanced_category['seo']['description']}")
            safe_print(f"Keywords: {', '.join(enhanced_category['seo']['keywords'])}")
            safe_print(f"FAQ Questions: {len(enhanced_category['faq'])}")
            safe_print(f"Content Length: {len(enhanced_category['content'])} characters")
            safe_print("=" * 30)
            
            # Ask if user wants to save this test
            save_test = input("\n💾 Save this test result? (y/n): ").strip().lower()
            if save_test == 'y':
                # Save individual category file
                category_filename = f"{category_id}.json"
                category_filepath = os.path.join(self.categories_dir, category_filename)
                
                with open(category_filepath, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_category, f, indent=2, ensure_ascii=False)
                
                safe_print(f"✅ Category saved to: {category_filepath}")
            else:
                safe_print("⏭️ Test result not saved")
                
        except Exception as e:
            safe_print(f"❌ Test failed: {str(e)}")
    
    def run_optimization(self):
        """Run the complete AI-powered optimization process with MAXIMUM CONCURRENCY"""
        safe_print("🤖 Universal AI-Powered Category Enhancer - MAXIMUM CONCURRENCY")
        safe_print("=" * 70)
        
        # Load categories
        categories = self.load_categories()
        if not categories:
            return
        
        safe_print(f"📊 Found {len(categories)} categories to optimize")
        safe_print(f"⚡ MAXIMUM CONCURRENCY: {self.max_workers} workers, {self.max_concurrent_requests} concurrent AI calls")
        safe_print(f"⏱️ Estimated time: {len(categories) * 0.3 / 60:.1f} minutes")
        
        # Process categories with MAXIMUM CONCURRENCY
        start_time = time.time()
        enhanced_categories, successful_count, failed_count = self.process_categories_parallel(categories)
        end_time = time.time()
        
        # Final statistics
        total_size = sum(cat['meta']['file_size'] for cat in enhanced_categories)
        avg_size = total_size / len(enhanced_categories) if enhanced_categories else 0
        
        safe_print(f"\n🎉 MAXIMUM CONCURRENCY OPTIMIZATION COMPLETE!")
        safe_print(f"✅ Enhanced: {successful_count} categories")
        safe_print(f"❌ Failed: {failed_count} categories")
        safe_print(f"⏱️ Time taken: {end_time - start_time:.2f} seconds")
        safe_print(f"📁 Individual files: {self.categories_dir}/")
        safe_print(f"📊 Total size: {total_size / 1024:.2f} KB")
        safe_print(f"📊 Average file size: {avg_size:.2f} bytes")
        safe_print(f"⚡ Speed: MAXIMUM CONCURRENCY mode")

def main():
    enhancer = OptimizedCategoryEnhancer()
    
    while True:
        safe_print("\n🤖 Universal AI-Powered Category Enhancer")
        safe_print("Creating unique AI-generated content for any product category")
        safe_print("=" * 60)
        safe_print("📋 Options:")
        safe_print("1. Test single category with AI (RECOMMENDED)")
        safe_print("2. Process all categories with AI")
        safe_print("3. View category statistics")
        safe_print("4. Exit")
        
        choice = input("\nSelect option (1-4): ").strip()
        
        if choice == '1':
            safe_print("\n🧪 Starting AI test on single category...")
            enhancer.test_single_category()
            
        elif choice == '2':
            safe_print("\n🤖 Starting full AI enhancement...")
            enhancer.run_optimization()
            
        elif choice == '3':
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
            safe_print(f"   AI-enhanced files: {categories_created}")
            safe_print(f"   Remaining: {total_categories - categories_created}")
            safe_print(f"   Categories directory: {enhancer.categories_dir}")
            safe_print(f"   Source file: {enhancer.categories_file}")
            
        elif choice == '4':
            safe_print("\n👋 Goodbye!")
            break
        
        else:
            safe_print("[ERROR] Please enter a valid option (1-4)")

if __name__ == "__main__":
    main()
