#!/usr/bin/env python3
"""
AI Product Enhancer
Optimizes product data using AI for better SEO and user experience.
Enhances names, slugs, descriptions, specifications, and adds FAQs.
"""

import json
import os
import re
from datetime import datetime
import requests
import time
import random
from pathlib import Path
import asyncio
import aiohttp
import concurrent.futures
from threading import Lock
import threading

def safe_print(message):
    """Thread-safe print function that handles encoding issues"""
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode('utf-8', errors='ignore').decode('utf-8'))

def thread_safe_print(message, lock):
    """Thread-safe print with lock"""
    with lock:
        safe_print(message)

class AIProductEnhancer:
    def __init__(self, output_language='german'):
        # Fix path - check if we're in scripts directory or root
        if os.path.basename(os.getcwd()) == 'scripts':
            self.products_dir = "../data/products"
            self.config_file = "../scripts/ai-config.json"
        else:
            self.products_dir = "data/products"
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
        
        # Load AI configuration
        self.ai_config = self.load_ai_config()
        
        # Performance settings - ULTRA-FAST TEMPLATE MODE
        self.max_concurrent_requests = 50  # Maximum concurrent requests
        self.batch_size = 100  # Larger batch size for maximum speed
        self.request_delay = 0  # NO DELAY - TEMPLATE MODE
        self.print_lock = Lock()  # Thread-safe printing
        
        # Caching system for faster processing
        self.content_cache = {}  # Cache for similar content
        self.template_cache = {}  # Cache for templates
    
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
            "keywords": [
                "products",
                "best price",
                "offer",
                "free shipping",
                "warranty",
                "quality",
                "easy use",
                "premium"
            ],
            "seo_settings": {
                "default_price": "from 19€",
                "store_name": "Your Store"
            }
        }
    
    def get_product_keywords(self):
        """Get product-specific keywords from config"""
        return self.ai_config.get("keywords", ["products", "best price", "offer"])
    
    # OPTIMIZED AI prompts - shorter and more focused for speed
    def get_prompts(self):
        """Get dynamic prompts based on config"""
        keywords = self.get_product_keywords()
        return {
            'name_optimization': f"""
Optimize English product name for SEO (max 60 chars):
"{{original_name}}"

Requirements: English, appealing, key features, quality-focused
Keywords to consider: {', '.join(keywords[:3])}
Respond ONLY with the optimized name.
""",
            
            'slug_optimization': """
Create SEO slug (max 50 chars):
"{product_name}"

Requirements: lowercase, hyphens, no accents, readable
Respond ONLY with the slug.
""",
            
            'description_enhancement': f"""
Create English HTML description (max 300 words):
Product: {{product_name}}
Price: {{price}}€
Features: {{features}}

Requirements: English, HTML format, quality-focused, compelling, CTA
Keywords: {', '.join(keywords[:3])}
Respond ONLY with HTML content.
""",
            
            'specifications_enhancement': """
Create English specs JSON for: {product_name}
Original: {original_specs}

Requirements: English terms, product specs, quality-focused
Respond ONLY with JSON object.
""",
            
            'faq_generation': f"""
Create 5 English FAQ for: {{product_name}}
Price: {{price}}€

Requirements: Common concerns, easy use, durability, support
Keywords: {', '.join(keywords[:2])}
Respond ONLY with JSON array.
"""
        }
    
    def get_cache_key(self, prompt_type, product_data):
        """Generate cache key for similar products"""
        if prompt_type == 'name_optimization':
            # Cache by product category and price range
            category = product_data.get('category', '').split()[0] if product_data.get('category') else 'general'
            price_range = f"{int(float(product_data.get('price', 0)) // 10) * 10}-{int(float(product_data.get('price', 0)) // 10) * 10 + 9}"
            return f"{prompt_type}_{category}_{price_range}"
        return f"{prompt_type}_{hash(str(product_data)[:100])}"
    
    def get_cached_content(self, cache_key):
        """Get cached content if available"""
        return self.content_cache.get(cache_key)
    
    def cache_content(self, cache_key, content):
        """Cache content for future use"""
        if len(self.content_cache) < 1000:  # Limit cache size
            self.content_cache[cache_key] = content
    
    async def get_ai_response_async(self, prompt, session_id="", max_retries=3, cache_key=None):
        """
        OPTIMIZED Async AI response with caching and streaming
        """
        # Check cache first
        if cache_key and cache_key in self.content_cache:
            thread_safe_print(f"[CACHE] Using cached content for {session_id}", self.print_lock)
            return self.content_cache[cache_key]
        
        try:
            import google.generativeai as genai
            
            # Configure Gemini with your API key
            API_KEY = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
            
            if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
                thread_safe_print(f"[WARNING] No API key configured, using fallback", self.print_lock)
                return self.get_fallback_response(prompt)
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            
            # Minimal delay for speed
            await asyncio.sleep(self.request_delay)
            
            # Use streaming for faster response
            response = model.generate_content(full_prompt, stream=True)
            
            # Collect streaming response
            full_response = ""
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
            
            if full_response.strip():
                thread_safe_print(f"[AI] Response received for {session_id}", self.print_lock)
                result = full_response.strip()
                
                # Cache the result
                if cache_key:
                    self.cache_content(cache_key, result)
                
                return result
            else:
                thread_safe_print(f"[WARNING] Empty AI response for {session_id}, using fallback", self.print_lock)
                return self.get_fallback_response(prompt)
                
        except Exception as e:
            thread_safe_print(f"[ERROR] AI request failed for {session_id}: {str(e)[:100]}", self.print_lock)
            return self.get_fallback_response(prompt)
    
    def get_ai_response(self, prompt, max_retries=3):
        """
        Synchronous wrapper for backward compatibility
        """
        return asyncio.run(self.get_ai_response_async(prompt, "sync"))
    
    def get_fallback_response(self, prompt):
        """Fallback responses when AI service is not available"""
        keywords = self.get_product_keywords()
        main_keyword = keywords[0] if keywords else "product"
        
        if "name_optimization" in prompt:
            return f"{main_keyword.title()} Premium Quality - Easy to Use"
        elif "slug_optimization" in prompt:
            return f"{main_keyword.lower()}-premium-quality-easy-use"
        elif "description_enhancement" in prompt:
            return f"""<div class="product-description">
<h2>{main_keyword.title()} Premium Quality</h2>
<p>Discover the peace of mind of having a {main_keyword} that truly understands your needs. This product has been carefully designed with quality and ease of use in mind.</p>

<h3>Key Features:</h3>
<ul>
<li><strong>Premium Quality:</strong> High-quality materials for maximum durability</li>
<li><strong>Easy to Use:</strong> Intuitive design and simplified functionality</li>
<li><strong>Complete Warranty:</strong> Full protection for your peace of mind</li>
<li><strong>Free Shipping:</strong> Fast and secure delivery</li>
</ul>

<h3>Why Choose This Product?</h3>
<p>✓ <strong>Quality:</strong> Products of the highest quality<br>
✓ <strong>Trust:</strong> Complete warranty included<br>
✓ <strong>Durability:</strong> Robust construction for daily use<br>
✓ <strong>Support:</strong> Specialized customer service</p>

<div class="cta-section">
<p><strong>Make your life easier and safer!</strong> Perfect for you or as a perfect gift for your loved ones.</p>
</div>
</div>"""
        elif "specifications_enhancement" in prompt:
            return {
                "Material": "High quality",
                "Dimensions": "Compact and lightweight", 
                "Technology": "Advanced",
                "Battery": "Long-lasting",
                "Autonomy": "Long duration",
                "Memory": "Large capacity",
                "Connectivity": "Universal",
                "Charging": "USB / USB-C",
                "Weight": "Lightweight",
                "Resistance": "Shock resistant",
                "Language": "Multi-language",
                "Warranty": "2 years"
            }
        elif "faq_generation" in prompt:
            return [
                {
                    "question": "Is it really easy to use?",
                    "answer": f"Absolutely. This {main_keyword} is specifically designed to facilitate its use with simple controls and clear instructions. You don't need technical knowledge to use it."
                },
                {
                    "question": "What warranty is included?", 
                    "answer": f"This {main_keyword} includes a complete 2-year warranty, covering any manufacturing defects. Your satisfaction is guaranteed."
                },
                {
                    "question": "Is it shock resistant?",
                    "answer": f"This {main_keyword} is built to be resistant to normal shocks and falls. Its robust design protects it from daily use."
                },
                {
                    "question": "How long does the battery last?",
                    "answer": f"The battery is optimized for maximum duration. You can use it for days without needing to charge it constantly."
                },
                {
                    "question": "Does it include manual and technical support?",
                    "answer": f"Yes, it includes a detailed manual with clear instructions. In addition, our technical support team is available to help you with any questions."
                }
            ]
        
        return "Fallback response - please configure AI service"
    
    # OPTIMIZED Async versions for batch processing with caching
    async def optimize_product_name_async(self, original_name, session_id, product_data=None):
        """OPTIMIZED Async version with caching"""
        cache_key = self.get_cache_key('name_optimization', product_data or {}) if product_data else None
        
        # Ultra-short prompt for speed
        prompt = f"Optimiza nombre español SEO (60 chars): {original_name}"
        response = await self.get_ai_response_async(prompt, session_id, cache_key=cache_key)
        
        # Fast cleanup
        clean_name = response.split('\n')[0].strip()
        clean_name = re.sub(r'[*>#-]', '', clean_name).strip()
        return clean_name[:60] if clean_name else original_name[:60]
    
    async def enhance_description_async(self, product_name, features, price, session_id, product_data=None):
        """OPTIMIZED Async version with caching and templates"""
        cache_key = self.get_cache_key('description_enhancement', product_data or {}) if product_data else None
        
        # Use template for faster generation
        features_text = ", ".join(features[:2]) if features else "fácil de usar"
        prompt = f"""HTML español (300 words): {product_name}
Precio: {price}€
Características: {features_text[:100]}

Estructura: <div><h1>Título</h1><p>Intro</p><h2>Características</h2><ul><li>Lista</li></ul><p>CTA</p></div>"""
        
        response = await self.get_ai_response_async(prompt, session_id, cache_key=cache_key)
        
        # Fast HTML cleanup
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
    
    async def enhance_specifications_async(self, original_specs, product_name, session_id, product_data=None):
        """OPTIMIZED Async version with caching"""
        cache_key = self.get_cache_key('specifications_enhancement', product_data or {}) if product_data else None
        
        # Ultra-short prompt for speed
        prompt = f"""JSON español specs: {product_name}
Ejemplo: {{"Pantalla":"2.4 pulgadas","Batería":"800mAh","Peso":"120g"}}"""
        
        response = await self.get_ai_response_async(prompt, session_id, cache_key=cache_key)
        
        # Fast JSON parsing
        response = response.strip()
        if '```json' in response:
            response = re.sub(r'```json\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        try:
            if '{' in response and '}' in response:
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return parsed if isinstance(parsed, dict) else original_specs
        except:
            pass
        
        # Fast fallback
        return {
            "Pantalla": "2.4 pulgadas LCD",
            "Batería": "800mAh", 
            "Conectividad": "2G GSM",
            "Peso": "Ligero",
            "Memoria": "200 contactos"
        }
    
    async def generate_faq_async(self, product_name, features, price, session_id, product_data=None):
        """OPTIMIZED Async version with caching"""
        cache_key = self.get_cache_key('faq_generation', product_data or {}) if product_data else None
        
        # Ultra-short prompt for speed
        prompt = f"""5 FAQ español JSON: {product_name}
Precio: {price}€
Formato: [{{"question":"¿Es fácil?","answer":"Sí..."}}]"""
        
        response = await self.get_ai_response_async(prompt, session_id, cache_key=cache_key)
        
        # Fast JSON parsing
        response = response.strip()
        if '```json' in response:
            response = re.sub(r'```json\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        try:
            if '[' in response and ']' in response:
                json_match = re.search(r'\[.*\]', response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return parsed if isinstance(parsed, list) and len(parsed) > 0 else self.get_fallback_faq(product_name, price)
        except:
            pass
        
        return self.get_fallback_faq(product_name, price)
    
    def get_fallback_faq(self, product_name, price):
        """Fallback FAQ for products"""
        keywords = self.get_product_keywords()
        main_keyword = keywords[0] if keywords else "producto"
        
        return [
            {"question": "¿Es fácil de usar?", "answer": f"Sí, el {product_name} está diseñado específicamente para facilitar su uso con controles simples y funciones intuitivas."},
            {"question": "¿Cuál es el precio?", "answer": f"El precio es de solo {price}€, una excelente relación calidad-precio."},
            {"question": "¿Tiene garantía?", "answer": "Sí, incluye garantía completa para tu tranquilidad."},
            {"question": "¿La batería dura mucho?", "answer": "Sí, la batería está optimizada para máxima duración con una sola carga."},
            {"question": "¿Es compatible con todos los dispositivos?", "answer": f"Sí, este {main_keyword} es compatible con la mayoría de dispositivos modernos."}
        ]
    
    async def create_short_description_async(self, product_name, features, price, session_id, product_data=None):
        """OPTIMIZED Async version with caching"""
        cache_key = self.get_cache_key('short_description', product_data or {}) if product_data else None
        
        # Ultra-short prompt for speed
        prompt = f"Descripción corta español (100 chars): {product_name}, {price}€"
        response = await self.get_ai_response_async(prompt, session_id, cache_key=cache_key)
        
        # Fast cleanup
        clean_desc = response.strip().split('\n')[0]
        clean_desc = re.sub(r'[*>#-]', '', clean_desc).strip()
        
        return clean_desc[:100] if clean_desc else f"{product_name[:50]} - Solo {price}€"
    
    def optimize_product_name(self, original_name):
        """Optimize product name for SEO and appeal"""
        safe_print(f"[AI] Optimizing product name...")
        prompts = self.get_prompts()
        prompt = prompts['name_optimization'].format(original_name=original_name)
        return self.get_ai_response(prompt)
    
    def create_seo_slug(self, product_name):
        """Create SEO-friendly slug"""
        safe_print(f"[AI] Creating SEO slug...")
        prompts = self.get_prompts()
        prompt = prompts['slug_optimization'].format(product_name=product_name)
        slug = self.get_ai_response(prompt)
        
        # Additional cleanup
        slug = slug.lower()
        slug = re.sub(r'[áàäâã]', 'a', slug)
        slug = re.sub(r'[éèëê]', 'e', slug)
        slug = re.sub(r'[íìïî]', 'i', slug)
        slug = re.sub(r'[óòöôõ]', 'o', slug)
        slug = re.sub(r'[úùüû]', 'u', slug)
        slug = re.sub(r'[ñ]', 'n', slug)
        slug = re.sub(r'[ç]', 'c', slug)
        slug = re.sub(r'[^a-z0-9\-]', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')
        
        return slug[:60]  # Limit to 60 characters
    
    def create_short_description(self, product_name, features, price):
        """Create optimized short description"""
        safe_print(f"[AI] Creating short description...")
        
        key_features = features[:2] if features else []
        features_text = ", ".join([f.split('.')[0] for f in key_features]) if key_features else "fácil de usar"
        
        prompt = f"""Crea una descripción corta y atractiva para este producto:

Producto: {product_name}
Precio: {price}€
Características clave: {features_text}

IMPORTANTE:
- Máximo 150 caracteres
- En español
- Incluye precio
- Sin HTML, solo texto plano
- Debe ser persuasivo y claro


Responde SOLO con la descripción corta, sin comillas ni texto adicional."""

        response = self.get_ai_response(prompt)
        
        # Clean and limit the response
        if response:
            clean_desc = response.strip().replace('"', '').replace("'", '')
            return clean_desc[:150]
        else:
            return f"{product_name} - Producto de calidad, fácil de usar. Solo {price}€"
    
    def enhance_description(self, original_description, features, price, product_name):
        """Enhance product description with AI"""
        safe_print(f"[AI] Enhancing description...")
        
        features_text = "\n".join(features[:3]) if features else "Características principales del producto"
        
        prompt = f"""Crea una descripción completa y atractiva en HTML para este producto:

Producto: {product_name}
Precio: {price}€
Características: {features_text}

IMPORTANTE: 
- Escribe en español persuasivo y emocional
- Usa formato HTML completo y bien estructurado
- Incluye llamada a la acción al final
- Máximo 400 palabras
- DEBE terminar con etiqueta de cierre </div>

Estructura requerida:
- Título principal H1
- Introducción emocional
- Secciones con H2
- Listas con características
- Sección de beneficios
- Llamada a la acción final

Ejemplo de formato:
```html
<div class="product-description">
<h1>Título atractivo</h1>
<p>Introducción...</p>
<h2>Características Principales</h2>
<ul>
<li><strong>Característica:</strong> Descripción</li>
</ul>
<h2>¿Por Qué Elegir Este Producto?</h2>
<p>Beneficios...</p>
<div class="cta-section">
<p><strong>¡Compra ahora y obtén la mejor calidad!</strong></p>
</div>
</div>
```"""
        
        response = self.get_ai_response(prompt)
        
        # Ensure the description is complete and well-formed
        if response and not response.endswith('</div>'):
            response += '</div>'
            
        return response
    
    def enhance_specifications(self, original_specs, product_name):
        """Enhance product specifications"""
        safe_print(f"[AI] Enhancing specifications...")
        
        prompt = f"""Mejora estas especificaciones técnicas en español para: {product_name}

Especificaciones originales: {json.dumps(original_specs, indent=2)}

IMPORTANTE: Responde SOLO con un objeto JSON válido, sin texto adicional. Formato:
{{
  "Material": "Alta calidad",
  "Dimensiones": "Compacto",
  "Tecnología": "Avanzada"
}}

Añade especificaciones importantes para el producto:
- Material y construcción
- Dimensiones y peso
- Tecnología utilizada
- Garantía y soporte
- Idioma y compatibilidad"""

        response = self.get_ai_response(prompt)
        
        safe_print(f"[DEBUG] Specs response: {response[:200]}...")
        
        if isinstance(response, dict):
            return response
        else:
            # Try to parse JSON response
            try:
                # Clean the response
                clean_response = response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response.replace('```json', '').replace('```', '').strip()
                elif clean_response.startswith('```'):
                    clean_response = clean_response.replace('```', '').strip()
                
                # Try to find JSON object in the response
                import re
                json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    specs_dict = json.loads(json_str)
                    safe_print(f"[DEBUG] Parsed {len(specs_dict)} specifications")
                    return specs_dict
                else:
                    safe_print(f"[DEBUG] No JSON object found in response")
                    return original_specs
                    
            except Exception as e:
                safe_print(f"[DEBUG] Failed to parse specs JSON: {e}")
                return original_specs
    
    def generate_faq(self, product_name, features, price):
        """Generate FAQ section"""
        safe_print(f"[AI] Generating FAQ...")
        
        # Create a more specific prompt for FAQ generation
        features_text = "\n".join(features[:3]) if features else "Producto de calidad"
        
        prompt = f"""Genera exactamente 5 preguntas frecuentes con respuestas para este producto:

Producto: {product_name}
Precio: {price}€
Características principales: {features_text}

IMPORTANTE: Responde SOLO con un array JSON válido, sin texto adicional. Formato:
[
  {{"question": "pregunta aquí", "answer": "respuesta aquí"}},
  {{"question": "pregunta aquí", "answer": "respuesta aquí"}}
]

Enfócate en dudas comunes sobre:
- Facilidad de uso
- Durabilidad y resistencia  
- Soporte técnico
- Calidad del producto
- Garantía y servicio"""

        response = self.get_ai_response(prompt)
        
        safe_print(f"[DEBUG] FAQ response: {response[:200]}...")
        
        if isinstance(response, list):
            return response
        else:
            # Try to parse JSON response
            try:
                # Clean the response - remove any markdown formatting
                clean_response = response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response.replace('```json', '').replace('```', '').strip()
                elif clean_response.startswith('```'):
                    clean_response = clean_response.replace('```', '').strip()
                
                # Try to find JSON array in the response
                import re
                json_match = re.search(r'\[.*\]', clean_response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    faq_list = json.loads(json_str)
                    safe_print(f"[DEBUG] Parsed {len(faq_list)} FAQ items")
                    return faq_list
                else:
                    safe_print(f"[DEBUG] No JSON array found in response")
                    return []
                    
            except Exception as e:
                safe_print(f"[DEBUG] Failed to parse FAQ JSON: {e}")
                return []
    
    def enhance_seo_data(self, product):
        """Enhance SEO metadata"""
        safe_print(f"[AI] Enhancing SEO data...")
        
        enhanced_seo = {
            "title": f"{product.get('name', '')} - Mejor Precio España | Envío Gratis",
            "description": f"Compra {product.get('name', '')} al mejor precio. ⭐ {product.get('amazonRating', 4.5)}/5 estrellas ✅ Envío gratis ✅ Garantía incluida. ¡Oferta limitada!",
            "keywords": [
                "producto calidad",
                "mejor precio", 
                "oferta",
                "envio gratis",
                "garantia",
                "facil usar",
                product.get('brand', '').lower(),
                "españa",
                "envio gratis"
            ],
            "ogImage": product.get('images', [None])[0],
            "canonical": f"https://yourdomain.com/product/{product.get('slug', '')}",
            "schema": {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": product.get('name', ''),
                "description": product.get('shortDescription', ''),
                "brand": {"@type": "Brand", "name": product.get('brand', '')},
                "offers": {
                    "@type": "Offer",
                    "price": product.get('price', '0'),
                    "priceCurrency": "EUR",
                    "availability": "https://schema.org/InStock",
                    "seller": {"@type": "Organization", "name": "Tu Tienda"}
                },
                "aggregateRating": {
                    "@type": "AggregateRating", 
                    "ratingValue": product.get('amazonRating', 4.5),
                    "reviewCount": max(product.get('amazonReviewCount', 0), 1)
                }
            }
        }
        
        return enhanced_seo
    
    
    def enhance_single_product(self, product_file):
        """Enhance a single product file"""
        safe_print(f"\n[ENHANCE] Processing: {os.path.basename(product_file)}")
        
        try:
            # Load product data
            with open(product_file, 'r', encoding='utf-8') as f:
                product = json.load(f)
            
            
            # Extract current data
            original_name = product.get('name', '')
            original_description = product.get('description', '')
            features = product.get('features', [])
            price = product.get('price', '0')
            specifications = product.get('specifications', {})
            
            safe_print(f"[ENHANCE] Original name: {original_name[:50]}...")
            
            # AI Enhancements
            enhanced_name = self.optimize_product_name(original_name)
            enhanced_slug = self.create_seo_slug(enhanced_name)
            enhanced_description = self.enhance_description(original_description, features, price, enhanced_name)
            enhanced_specs = self.enhance_specifications(specifications, enhanced_name)
            faq = self.generate_faq(enhanced_name, features, price)
            
            # Generate optimized short description
            short_desc = self.create_short_description(enhanced_name, features, price)
            
            # Update product data
            product.update({
                'name': enhanced_name,
                'slug': enhanced_slug,
                'description': enhanced_description,
                'specifications': enhanced_specs,
                'faq': faq,
                'shortDescription': short_desc,
                'enhancedAt': datetime.now().isoformat(),
                'originalName': original_name,
                'enhanced': True
            })
            
            # Enhance SEO data
            product['seo'] = self.enhance_seo_data(product)
            
            # Update the original file directly (backup was already created)
            with open(product_file, 'w', encoding='utf-8') as f:
                json.dump(product, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[SUCCESS] Enhanced: {enhanced_name[:50]}...")
            safe_print(f"[SUCCESS] Slug: {enhanced_slug}")
            safe_print(f"[SUCCESS] FAQ: {len(faq)} questions added")
            
            return True
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to enhance {product_file}: {e}")
            return False
    
    def enhance_all_products(self):
        """Enhance all products in the products directory"""
        safe_print("[START] AI Product Enhancement")
        safe_print("=" * 60)
        
        # Find all product JSON files
        product_files = []
        for file in os.listdir(self.products_dir):
            if file.endswith('.json') and not file.startswith('.'):
                product_files.append(os.path.join(self.products_dir, file))
        
        safe_print(f"[INFO] Found {len(product_files)} products to enhance")
        
        enhanced_count = 0
        failed_count = 0
        
        for i, product_file in enumerate(product_files, 1):
            safe_print(f"\n[PROGRESS] {i}/{len(product_files)}")
            
            if self.enhance_single_product(product_file):
                enhanced_count += 1
            else:
                failed_count += 1
            
            # Add delay to avoid overwhelming AI service
            if i < len(product_files):
                time.sleep(random.uniform(2, 5))
        
        # Summary
        safe_print(f"\n[SUMMARY] Enhancement Complete")
        safe_print("=" * 40)
        safe_print(f"✅ Enhanced: {enhanced_count}")
        safe_print(f"❌ Failed: {failed_count}")
        safe_print(f"📁 Products: {self.products_dir}")
        
        return enhanced_count, failed_count
    
    async def enhance_product_batch_async(self, product_files):
        """
        Enhanced batch processing with async AI calls - MUCH FASTER for large datasets
        """
        enhanced_count = 0
        failed_count = 0
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        
        async def process_single_product(product_file, index):
            nonlocal enhanced_count, failed_count
            
            async with semaphore:  # Limit concurrent requests
                try:
                    product_name = os.path.basename(product_file)
                    thread_safe_print(f"[BATCH] Processing {index}: {product_name}", self.print_lock)
                    
                    # Load product data
                    with open(product_file, 'r', encoding='utf-8') as f:
                        product = json.load(f)
                    
                    
                    # Extract current data
                    original_name = product.get('name', '')
                    features = product.get('features', [])
                    price = product.get('price', '0')
                    specifications = product.get('specifications', {})
                    
                    # ULTRA-FAST AI enhancement with maximum concurrency
                    enhanced_name = self.optimize_product_name_fast(original_name)
                    enhanced_description = self.enhance_description_fast(original_name, features, price)
                    enhanced_specs = self.enhance_specifications_fast(specifications, original_name)
                    faq = self.generate_faq_fast(original_name, features, price)
                    short_desc = self.create_short_description_fast(original_name, features, price)
                    
                    # Create slug quickly (no AI needed) - make it simple for async
                    enhanced_slug = enhanced_name.lower().replace(' ', '-').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
                    enhanced_slug = re.sub(r'[^a-z0-9-]', '', enhanced_slug)[:50]
                    
                    # Update product data
                    product.update({
                        'name': enhanced_name,
                        'slug': enhanced_slug,
                        'description': enhanced_description,
                        'specifications': enhanced_specs,
                        'faq': faq,
                        'shortDescription': short_desc,
                        'enhancedAt': datetime.now().isoformat(),
                        'originalName': original_name,
                        'enhanced': True
                    })
                    
                    # Enhance SEO data - simplified for async
                    product['seo'] = {
                        'title': enhanced_name,
                        'description': short_desc,
                        'keywords': f"{enhanced_name}, producto calidad, precio, fácil uso",
                        'ogTitle': enhanced_name,
                        'ogDescription': short_desc
                    }
                    
                    # Save updated product
                    with open(product_file, 'w', encoding='utf-8') as f:
                        json.dump(product, f, indent=2, ensure_ascii=False)
                    
                    enhanced_count += 1
                    thread_safe_print(f"[SUCCESS] Enhanced: {enhanced_name[:50]}...", self.print_lock)
                    
                except Exception as e:
                    failed_count += 1
                    thread_safe_print(f"[ERROR] Failed to enhance {product_file}: {str(e)[:100]}", self.print_lock)
        
        # Process all products concurrently
        tasks = [process_single_product(pf, i+1) for i, pf in enumerate(product_files)]
        await asyncio.gather(*tasks)
        
        return enhanced_count, failed_count
    
    def enhance_all_products_fast(self):
        """
        FAST batch enhancement using async processing - optimized for 10,000+ products
        """
        safe_print("[START] FAST AI Product Enhancement (Batch Mode)")
        safe_print("=" * 60)
        
        # Find all product JSON files
        product_files = []
        for file in os.listdir(self.products_dir):
            if file.endswith('.json') and not file.startswith('.'):
                product_files.append(os.path.join(self.products_dir, file))
        
        safe_print(f"[INFO] Found {len(product_files)} products to enhance")
        safe_print(f"[INFO] Batch size: {self.batch_size}, Concurrent requests: {self.max_concurrent_requests}")
        safe_print(f"[INFO] Estimated time: {len(product_files) * 2 / self.max_concurrent_requests / 60:.1f} minutes")
        
        total_enhanced = 0
        total_failed = 0
        
        # Process in batches for memory efficiency
        for i in range(0, len(product_files), self.batch_size):
            batch = product_files[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (len(product_files) + self.batch_size - 1) // self.batch_size
            
            safe_print(f"\n[BATCH] Processing batch {batch_num}/{total_batches} ({len(batch)} products)")
            
            # Run batch asynchronously
            enhanced, failed = asyncio.run(self.enhance_product_batch_async(batch))
            
            total_enhanced += enhanced
            total_failed += failed
            
            safe_print(f"[BATCH] Completed: {enhanced} enhanced, {failed} failed")
            
            # Small delay between batches
            time.sleep(1)
        
        # Summary
        safe_print(f"\n[SUMMARY] FAST Enhancement Complete")
        safe_print("=" * 40)
        safe_print(f"✅ Enhanced: {total_enhanced}")
        safe_print(f"❌ Failed: {total_failed}")
        safe_print(f"📁 Products: {self.products_dir}")
        
    def enhance_all_products_ultra_fast(self):
        """
        ULTRA-FAST batch enhancement - optimized for maximum speed with minimal AI calls
        """
        safe_print("[START] ULTRA-FAST AI Product Enhancement")
        safe_print("=" * 60)
        
        # Find all product JSON files
        product_files = []
        for file in os.listdir(self.products_dir):
            if file.endswith('.json') and not file.startswith('.'):
                product_files.append(os.path.join(self.products_dir, file))
        
        safe_print(f"[INFO] Found {len(product_files)} products to enhance")
        safe_print(f"[INFO] ULTRA-FAST mode: Batch size: {self.batch_size}, Concurrent: {self.max_concurrent_requests}")
        safe_print(f"[INFO] Estimated time: {len(product_files) * 1 / self.max_concurrent_requests / 60:.1f} minutes")
        
        total_enhanced = 0
        total_failed = 0
        
        # Process in larger batches for maximum efficiency
        for i in range(0, len(product_files), self.batch_size):
            batch = product_files[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (len(product_files) + self.batch_size - 1) // self.batch_size
            
            safe_print(f"\n[BATCH] Processing batch {batch_num}/{total_batches} ({len(batch)} products)")
            
            # Process batch concurrently for maximum speed - SAME AS CATEGORY ENHANCER
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_concurrent_requests) as executor:
                future_to_product = {
                    executor.submit(self.enhance_single_product_fast, product_file): product_file 
                    for product_file in batch
                }
                
                enhanced = 0
                failed = 0
                
                for future in concurrent.futures.as_completed(future_to_product):
                    product_file = future_to_product[future]
                    try:
                        future.result()  # This will raise exception if failed
                        enhanced += 1
                        product_name = os.path.basename(product_file)
                        safe_print(f"✅ Enhanced: {product_name}")
                    except Exception as e:
                        failed += 1
                        product_name = os.path.basename(product_file)
                        safe_print(f"❌ Failed: {product_name} - {str(e)[:100]}")
                
                total_enhanced += enhanced
                total_failed += failed
                
                safe_print(f"[BATCH] Completed: {enhanced} enhanced, {failed} failed")
        
        # Summary
        safe_print(f"\n[SUMMARY] ULTRA-FAST Enhancement Complete")
        safe_print("=" * 40)
        safe_print(f"✅ Enhanced: {total_enhanced}")
        safe_print(f"❌ Failed: {total_failed}")
        safe_print(f"📁 Products: {self.products_dir}")
        safe_print(f"⚡ Speed: ULTRA-FAST mode with caching and streaming")
        
        return total_enhanced, total_failed

    def enhance_single_product_fast(self, product_file):
        """Enhance a single product file - SAME APPROACH AS CATEGORY ENHANCER"""
        try:
            # Load product data
            with open(product_file, 'r', encoding='utf-8') as f:
                product = json.load(f)
            
            # Extract current data
            original_name = product.get('name', '')
            features = product.get('features', [])
            price = product.get('price', '0')
            specifications = product.get('specifications', {})
            
            # ULTRA-FAST AI enhancement with maximum concurrency
            enhanced_name = self.optimize_product_name_fast(original_name)
            enhanced_description = self.enhance_description_fast(original_name, features, price)
            enhanced_specs = self.enhance_specifications_fast(specifications, original_name)
            faq = self.generate_faq_fast(original_name, features, price)
            short_desc = self.create_short_description_fast(original_name, features, price)
            
            # Create slug quickly
            enhanced_slug = enhanced_name.lower().replace(' ', '-').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
            enhanced_slug = re.sub(r'[^a-z0-9-]', '', enhanced_slug)[:50]
            
            # Update product data
            product.update({
                'name': enhanced_name,
                'slug': enhanced_slug,
                'description': enhanced_description,
                'specifications': enhanced_specs,
                'faq': faq,
                'shortDescription': short_desc,
                'enhancedAt': datetime.now().isoformat(),
                'originalName': original_name,
                'enhanced': True
            })
            
            # Enhance SEO data
            product['seo'] = {
                'title': enhanced_name,
                'description': short_desc,
                'keywords': f"{enhanced_name}, producto, calidad, precio",
                'ogTitle': enhanced_name,
                'ogDescription': short_desc
            }
            
            # Save updated product
            with open(product_file, 'w', encoding='utf-8') as f:
                json.dump(product, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            raise Exception(f"Failed to enhance product: {str(e)}")

    def optimize_product_name_fast(self, original_name):
        """AI-powered name optimization with product-specific prompts"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        prompt = f"""Optimize product name for SEO (max 60 characters) in {language_name}:

"{original_name}"

STRICT RULES:
- ONLY mention specific product characteristics
- Include key benefit specific to the product
- Use action words (Buy, Discover, Best)
- Keep original name as base
- Focus on airfryer-related content

Respond ONLY with optimized name:"""
        
        return self.get_ai_response_fast(prompt)

    def enhance_description_fast(self, original_name, features, price):
        """AI-powered description enhancement with product-specific prompts"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        features_text = ", ".join(features[:3]) if features else "key features"
        
        prompt = f"""Create SEO description for: "{original_name}" in {language_name}

STRICT RULES:
- ONLY write about "{original_name}" and specific characteristics
- Include features: {features_text}
- Mention price {price}€
- Create urgency (free shipping)
- Max 200 words
- Valid HTML format

EXAMPLE:
<div>
<h2>{original_name}</h2>
<p>Discover the <b>{original_name}</b> with the best quality and price.</p>
<h3>Key Features</h3>
<ul>
<li><b>Feature 1</b>: Specific description</li>
<li><b>Feature 2</b>: Specific description</li>
</ul>
<p>From <b>{price}€</b> with free shipping.</p>
</div>

Respond ONLY with HTML:"""
        
        response = self.get_ai_response_fast(prompt)
        
        # Clean up response - remove ```html and ``` if present
        if response.startswith('```html'):
            response = response[7:]
        if response.startswith('```'):
            response = response[3:]
        if response.endswith('```'):
            response = response[:-3]
        
        return response.strip()

    def enhance_specifications_fast(self, specifications, original_name):
        """AI-powered specifications enhancement"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        existing_specs = ", ".join(specifications.keys()) if specifications else "none"
        
        prompt = f"""Improve technical specifications for: "{original_name}" in {language_name}

STRICT RULES:
- ONLY specifications related to "{original_name}"
- Include specific technical specifications of the product
- Valid JSON format
- Existing specifications: {existing_specs}

EXAMPLE:
{{
  "Warranty": "2 years",
  "Shipping": "Free worldwide",
  "Availability": "Immediate",
  "Specific specification": "Specific product value"
}}

Respond ONLY with JSON:"""
        
        try:
            response = self.get_ai_response_fast(prompt)
            return json.loads(response)
        except:
            return specifications if specifications else {
                "Warranty": "2 years",
                "Shipping": "Free worldwide",
                "Availability": "Immediate"
            }

    def generate_faq_fast(self, original_name, features, price):
        """AI-powered FAQ generation with product-specific prompts"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        features_text = ", ".join(features[:2]) if features else "key features"
        
        prompt = f"""Create 3 frequently asked questions for: "{original_name}" in {language_name}

STRICT RULES:
- ONLY questions about "{original_name}" and specific characteristics
- Include features: {features_text}
- Valid JSON format
- Product-specific questions

EXAMPLE:
[
  {{"question": "What are the main features of {original_name}?", "answer": "{original_name} includes {features_text} for maximum quality."}},
  {{"question": "Is there a warranty on {original_name}?", "answer": "Yes, {original_name} includes a complete 2-year warranty."}},
  {{"question": "How much does shipping cost?", "answer": "Shipping is completely free worldwide."}}
]

Respond ONLY with JSON:"""
        
        try:
            response = self.get_ai_response_fast(prompt)
            return json.loads(response)
        except:
            return [
                {"question": f"Why choose {original_name}?", "answer": f"{original_name} offers the best quality at the best price."},
                {"question": "Is there a warranty?", "answer": "Yes, all our products include a complete warranty."}
            ]

    def create_short_description_fast(self, original_name, features, price):
        """AI-powered short description with product-specific prompts"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        prompt = f"""Create short SEO description (max 150 characters) for: "{original_name}" in {language_name}

STRICT RULES:
- ONLY mention "{original_name}" and specific characteristics

EXAMPLE: "{original_name} ✅ Premium Quality. {price}€ Free Shipping!"
Respond ONLY with description:"""
        
        return self.get_ai_response_fast(prompt)

    def get_ai_response_fast(self, prompt):
        """Fast AI response using Google Gemini 2.5 Flash with minimal delay"""
        try:
            import google.generativeai as genai
            
            # Configure Gemini with your API key
            API_KEY = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
            
            if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
                return self.get_fallback_response_fast(prompt)
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # System prompt for SEO expert (in English)
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            system_prompt = f"You are an expert SEO and digital marketing specialist for e-commerce products. Always respond in {language_name} with clear, persuasive, and SEO-optimized content. Focus on product optimization and airfryer-related content."
            
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Minimal delay for maximum speed
            time.sleep(0.01)
            
            response = model.generate_content(full_prompt)
            
            if response and response.text:
                return response.text.strip()
            else:
                return self.get_fallback_response_fast(prompt)
                
        except ImportError:
            return self.get_fallback_response_fast(prompt)
        except Exception as e:
            return self.get_fallback_response_fast(prompt)

    def get_fallback_response_fast(self, prompt):
        """Fast fallback responses when AI service is not available"""
        if "nombre" in prompt.lower():
            return "Producto de Calidad Premium"
        elif "descripción" in prompt.lower():
            return "<div><h2>Producto de Calidad</h2><p>Descubre este producto con la mejor calidad y precio.</p></div>"
        elif "faq" in prompt.lower():
            return '[{"question":"¿Por qué elegir este producto?","answer":"Ofrece la mejor calidad al mejor precio."}]'
        return "Producto de calidad con envío gratis"

def main():
    """Main function with command line arguments"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI Product Enhancer with Multi-Language Support')
    parser.add_argument('--language', '-l', default='german', 
                        choices=['german', 'spanish', 'french', 'italian', 'dutch', 'polish', 'swedish', 'english', 'portuguese', 'russian', 'chinese', 'japanese', 'korean'],
                        help='Output language for generated content (default: german)')
    parser.add_argument('--mode', '-m', default='interactive',
                        choices=['interactive', 'ultra-fast', 'fast', 'standard'],
                        help='Processing mode (default: interactive)')
    parser.add_argument('--workers', '-w', type=int, default=50,
                        help='Number of concurrent workers for ultra-fast mode (default: 50)')
    
    args = parser.parse_args()
    
    safe_print("🤖 AI Product Enhancer")
    safe_print(f"🌍 Language: {args.language.title()}")
    safe_print(f"⚡ Mode: {args.mode}")
    safe_print("Optimizing product data for better SEO and user experience")
    safe_print("=" * 60)
    
    enhancer = AIProductEnhancer(output_language=args.language)
    enhancer.max_concurrent_requests = args.workers
    
    if args.mode == 'ultra-fast':
        safe_print("\n🚀 Starting ULTRA-FAST enhancement...")
        enhanced, failed = enhancer.enhance_all_products_ultra_fast()
    elif args.mode == 'fast':
        safe_print("\n⚡ Starting FAST enhancement...")
        enhanced, failed = enhancer.enhance_all_products_fast()
    elif args.mode == 'standard':
        safe_print("\n🚀 Starting standard enhancement...")
        enhanced, failed = enhancer.enhance_all_products()
    else:
        # Interactive mode
        while True:
            safe_print("\n📋 Options:")
            safe_print("1. Enhance all products (Standard)")
            safe_print("2. Enhance all products (FAST - Batch Mode) ⚡")
            safe_print("3. Enhance all products (ULTRA-FAST - Maximum Speed) 🚀")
            safe_print("4. Enhance single product")
            safe_print("5. View enhancement statistics")
            safe_print("6. Exit")
            
            choice = input("\nSelect option (1-6): ").strip()
            
            if choice == '1':
                safe_print("\n🚀 Starting standard bulk enhancement...")
                enhanced, failed = enhancer.enhance_all_products()
                
            elif choice == '2':
                safe_print("\n⚡ Starting FAST batch enhancement...")
                enhanced, failed = enhancer.enhance_all_products_fast()
                
            elif choice == '3':
                safe_print("\n🚀 Starting ULTRA-FAST enhancement...")
                enhanced, failed = enhancer.enhance_all_products_ultra_fast()
                
            elif choice == '4':
                product_files = [f for f in os.listdir(enhancer.products_dir) if f.endswith('.json')]
                if not product_files:
                    safe_print("[ERROR] No product files found!")
                    continue
                    
                safe_print("\n📦 Available products:")
                for i, file in enumerate(product_files[:10], 1):
                    safe_print(f"  {i}. {file}")
                
                try:
                    file_choice = int(input("\nSelect product number: ")) - 1
                    if 0 <= file_choice < len(product_files):
                        product_file = os.path.join(enhancer.products_dir, product_files[file_choice])
                        enhancer.enhance_single_product(product_file)
                    else:
                        safe_print("[ERROR] Invalid selection")
                except ValueError:
                    safe_print("[ERROR] Please enter a valid number")
            
            elif choice == '5':
                # Show statistics
                product_files = len([f for f in os.listdir(enhancer.products_dir) if f.endswith('.json')])
                
                # Count enhanced products by checking for 'enhanced' field
                enhanced_count = 0
                for file in os.listdir(enhancer.products_dir):
                    if file.endswith('.json'):
                        try:
                            with open(os.path.join(enhancer.products_dir, file), 'r', encoding='utf-8') as f:
                                product = json.load(f)
                                if product.get('enhanced', False):
                                    enhanced_count += 1
                        except:
                            pass
                
                safe_print(f"\n📊 Enhancement Statistics:")
                safe_print(f"   Total products: {product_files}")
                safe_print(f"   Enhanced products: {enhanced_count}")
                safe_print(f"   Products directory: {enhancer.products_dir}")
                safe_print(f"   Cache entries: {len(enhancer.content_cache)}")
            
            elif choice == '6':
                safe_print("\n👋 Goodbye!")
                break
            
            else:
                safe_print("[ERROR] Invalid option. Please try again.")

if __name__ == "__main__":
    main() 