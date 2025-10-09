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
        
        # Performance settings - OPTIMIZED FOR STABILITY
        self.max_concurrent_requests = 5  # Reduced for stability
        self.batch_size = 50  # Smaller batch size
        self.request_delay = 0.5  # Small delay to avoid rate limits
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
        OPTIMIZED Async AI response with caching and streaming - NO FALLBACKS
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
                thread_safe_print(f"[ERROR] No API key configured! Stopping script.", self.print_lock)
                raise Exception("AI API key not configured - stopping script")
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            
            # System prompt for target language
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            system_prompt = f"You are an expert SEO and digital marketing specialist for e-commerce products. Always respond in {language_name} with clear, persuasive, and SEO-optimized content. Focus on product optimization and robot/technology-related content."
            
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Minimal delay for speed
            await asyncio.sleep(self.request_delay)
            
            # Use streaming for faster response
            response = model.generate_content(full_prompt, stream=True)
            
            # Collect streaming response with better error handling
            full_response = ""
            chunk_count = 0
            for chunk in response:
                chunk_count += 1
                if chunk and chunk.text:
                    full_response += chunk.text
                elif chunk and hasattr(chunk, 'candidates') and chunk.candidates:
                    # Check for finish_reason issues
                    candidate = chunk.candidates[0]
                    if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 1:
                        thread_safe_print(f"[WARNING] AI hit stop token (finish_reason=1) for {session_id}", self.print_lock)
                        break
            
            if full_response.strip():
                thread_safe_print(f"[AI] Response received for {session_id} ({chunk_count} chunks)", self.print_lock)
                result = full_response.strip()
                
                # Cache the result
                if cache_key:
                    self.cache_content(cache_key, result)
                
                return result
            else:
                thread_safe_print(f"[ERROR] Empty AI response after {chunk_count} chunks for {session_id}! Stopping script.", self.print_lock)
                raise Exception("Empty AI response - stopping script")
                
        except Exception as e:
            thread_safe_print(f"[ERROR] AI request failed for {session_id}: {str(e)[:100]}", self.print_lock)
            thread_safe_print(f"[ERROR] Stopping script due to AI failure!", self.print_lock)
            raise Exception(f"AI request failed: {str(e)}")
    
    def get_ai_response(self, prompt, max_retries=3):
        """
        Synchronous wrapper for backward compatibility
        """
        return asyncio.run(self.get_ai_response_async(prompt, "sync"))
    
    # REMOVED: get_fallback_response method - we only use AI, no fallbacks
    
    # OPTIMIZED Async versions for batch processing with caching
    async def optimize_product_name_async(self, original_name, session_id, product_data=None):
        """OPTIMIZED Async version with caching"""
        cache_key = self.get_cache_key('name_optimization', product_data or {}) if product_data else None
        
        # Ultra-short prompt for speed
        prompt = f"SEO name (60 chars) for: {original_name} in {language_name}"
        response = await self.get_ai_response_async(prompt, session_id, cache_key=cache_key)
        
        # Fast cleanup
        clean_name = response.split('\n')[0].strip()
        clean_name = re.sub(r'[*>#-]', '', clean_name).strip()
        return clean_name[:60] if clean_name else original_name[:60]
    
    async def enhance_description_async(self, product_name, features, price, session_id, product_data=None):
        """OPTIMIZED Async version with caching and templates"""
        cache_key = self.get_cache_key('description_enhancement', product_data or {}) if product_data else None
        
        # Use template for faster generation
        features_text = ", ".join(features[:2]) if features else "einfach zu verwenden"
        prompt = f"""HTML auf Deutsch (300 Wörter): {product_name}
Preis: {price}€
Merkmale: {features_text[:100]}

Struktur: <div><h1>Titel</h1><p>Intro</p><h2>Merkmale</h2><ul><li>Liste</li></ul><p>CTA</p></div>"""
        
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
        prompt = f"""JSON deutsche Spezifikationen für: {product_name}
Beispiel: {{"Garantie":"2 Jahre","Versand":"Kostenlos","Material":"Hochwertig"}}
Basierend auf dem tatsächlichen Produkt: {product_name}"""
        
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
        prompt = f"""5 deutsche FAQ JSON für: {product_name}
Preis: {price}€
Format: [{{"question":"Ist es einfach?","answer":"Ja..."}}]
Fragen über das tatsächliche Produkt: {product_name}"""
        
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
                    return parsed if isinstance(parsed, list) and len(parsed) > 0 else self._raise_ai_error("FAQ")
        except:
            pass
        
        # If AI fails, the script will stop - no fallbacks
        raise Exception("AI FAQ generation failed - stopping script")
    
    async def create_short_description_async(self, product_name, features, price, session_id, product_data=None):
        """OPTIMIZED Async version with caching"""
        cache_key = self.get_cache_key('short_description', product_data or {}) if product_data else None
        
        # Ultra-short prompt for speed
        prompt = f"Short desc (100 chars) for: {product_name}, {price}€ in {language_name}"
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
        features_text = ", ".join([f.split('.')[0] for f in key_features]) if key_features else "einfach zu verwenden"
        
        prompt = f"""Erstelle eine kurze, ansprechende Beschreibung für dieses Produkt:

Produkt: {product_name}
Preis: {price}€
Hauptmerkmale: {features_text}

WICHTIG:
- Maximal 150 Zeichen
- Auf Deutsch
- Preis einschließen
- Kein HTML, nur Text
- Überzeugend und klar

Antworte NUR mit der kurzen Beschreibung, ohne Anführungszeichen."""

        response = self.get_ai_response(prompt)
        
        # Clean and limit the response
        if response:
            clean_desc = response.strip().replace('"', '').replace("'", '')
            return clean_desc[:150]
        else:
            return f"{product_name} - Hochwertiges Produkt, einfach zu verwenden. Nur {price}€"
    
    def enhance_description(self, original_description, features, price, product_name):
        """Enhance product description with AI"""
        safe_print(f"[AI] Enhancing description...")
        
        features_text = "\n".join(features[:3]) if features else "Hauptmerkmale des Produkts"
        
        prompt = f"""Erstelle eine vollständige, ansprechende HTML-Beschreibung für dieses Produkt:

Produkt: {product_name}
Preis: {price}€
Merkmale: {features_text}

WICHTIG: 
- Schreibe auf Deutsch, überzeugend und emotional
- Verwende vollständiges, gut strukturiertes HTML
- Füge einen Call-to-Action am Ende hinzu
- Maximal 400 Wörter
- MUSS mit </div> schließen

Erforderliche Struktur:
- Haupttitel H1
- Emotionale Einleitung
- Abschnitte mit H2
- Listen mit Merkmalen
- Vorteils-Sektion
- Call-to-Action am Ende

Beispiel-Format:
```html
<div class="product-description">
<h1>Ansprechender Titel</h1>
<p>Einleitung...</p>
<h2>Hauptmerkmale</h2>
<ul>
<li><strong>Merkmal:</strong> Beschreibung</li>
</ul>
<h2>Warum dieses Produkt wählen?</h2>
<p>Vorteile...</p>
<div class="cta-section">
<p><strong>Jetzt kaufen und beste Qualität erhalten!</strong></p>
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
        
        prompt = f"""Verbessere diese technischen Spezifikationen auf Deutsch für: {product_name}

Originale Spezifikationen: {json.dumps(original_specs, indent=2)}

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt, ohne zusätzlichen Text. Format:
{{
  "Material": "Hochwertig",
  "Abmessungen": "Kompakt",
  "Technologie": "Fortschrittlich"
}}

Füge wichtige Spezifikationen für das Produkt hinzu:
- Material und Konstruktion
- Abmessungen und Gewicht
- Verwendete Technologie
- Garantie und Support
- Sprache und Kompatibilität"""

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
        features_text = "\n".join(features[:3]) if features else "Hochwertiges Produkt"
        
        prompt = f"""Generiere genau 5 häufig gestellte Fragen mit Antworten für dieses Produkt:

Produkt: {product_name}
Preis: {price}€
Hauptmerkmale: {features_text}

WICHTIG: Antworte NUR mit einem gültigen JSON-Array, ohne zusätzlichen Text. Format:
[
  {{"question": "Frage hier", "answer": "Antwort hier"}},
  {{"question": "Frage hier", "answer": "Antwort hier"}}
]

Konzentriere dich auf häufige Bedenken über:
- Einfachheit der Verwendung
- Haltbarkeit und Widerstandsfähigkeit  
- Technischen Support
- Produktqualität
- Garantie und Service"""

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
        
        if self.output_language == 'german':
            enhanced_seo = {
                "title": f"{product.get('name', '')} - Bester Preis Deutschland | Kostenloser Versand",
                "description": f"Kaufen Sie {product.get('name', '')} zum besten Preis. ⭐ {product.get('amazonRating', 4.5)}/5 Sterne ✅ Kostenloser Versand ✅ Garantie inbegriffen. ⚡ Begrenztes Angebot!",
                "keywords": [
                    "produkt qualität",
                    "bester preis", 
                    "angebot",
                    "kostenloser versand",
                    "garantie",
                    "einfach verwenden",
                    product.get('brand', '').lower(),
                    "deutschland",
                    "kostenloser versand"
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
                        "seller": {"@type": "Organization", "name": "Ihr Shop"}
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating", 
                        "ratingValue": product.get('amazonRating', 4.5),
                        "reviewCount": max(product.get('amazonReviewCount', 0), 1)
                    }
                }
            }
        else:
            enhanced_seo = {
                "title": f"{product.get('name', '')} - Bester Preis Deutschland | Kostenloser Versand",
                "description": f"Kaufen Sie {product.get('name', '')} zum besten Preis. ⭐ {product.get('amazonRating', 4.5)}/5 Sterne ✅ Kostenloser Versand ✅ Garantie inklusive. Begrenztes Angebot!",
                "keywords": [
                    "produkt qualität",
                    "bester preis", 
                    "angebot",
                    "kostenloser versand",
                    "garantie",
                    "einfach verwenden",
                    product.get('brand', '').lower(),
                    "deutschland",
                    "kostenloser versand"
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
        
        # Find all product JSON files (skip already enhanced ones)
        product_files = []
        skipped_count = 0
        for file in os.listdir(self.products_dir):
            if file.endswith('.json') and not file.startswith('.'):
                file_path = os.path.join(self.products_dir, file)
                # Check if already enhanced
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        product = json.load(f)
                        if product.get('enhanced', False):
                            skipped_count += 1
                            continue
                except:
                    pass  # If can't read, process it
                product_files.append(file_path)
        
        safe_print(f"[INFO] Found {len(product_files)} products to enhance")
        safe_print(f"[INFO] Skipped {skipped_count} already enhanced products")
        
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
                    
                    # Enhance SEO data - AI-generated keywords
                    seo_keywords = self.generate_seo_keywords_ai(enhanced_name, product.get('category', ''), product.get('brand', ''))
                    product['seo'] = {
                        'title': enhanced_name,
                        'description': short_desc,
                        'keywords': seo_keywords,
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
        
        # Find all product JSON files (skip already enhanced ones)
        product_files = []
        skipped_count = 0
        for file in os.listdir(self.products_dir):
            if file.endswith('.json') and not file.startswith('.'):
                file_path = os.path.join(self.products_dir, file)
                # Check if already enhanced
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        product = json.load(f)
                        if product.get('enhanced', False):
                            skipped_count += 1
                            continue
                except:
                    pass  # If can't read, process it
                product_files.append(file_path)
        
        safe_print(f"[INFO] Found {len(product_files)} products to enhance")
        safe_print(f"[INFO] Skipped {skipped_count} already enhanced products")
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
        
        # Find all product JSON files (skip already enhanced ones)
        product_files = []
        skipped_count = 0
        for file in os.listdir(self.products_dir):
            if file.endswith('.json') and not file.startswith('.'):
                file_path = os.path.join(self.products_dir, file)
                # Check if already enhanced
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        product = json.load(f)
                        if product.get('enhanced', False):
                            skipped_count += 1
                            continue
                except:
                    pass  # If can't read, process it
                product_files.append(file_path)
        
        safe_print(f"[INFO] Found {len(product_files)} products to enhance")
        safe_print(f"[INFO] Skipped {skipped_count} already enhanced products")
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
            
            # Enhance SEO data - AI-generated keywords
            seo_keywords = self.generate_seo_keywords_ai(enhanced_name, product.get('category', ''), product.get('brand', ''))
            product['seo'] = {
                'title': enhanced_name,
                'description': short_desc,
                'keywords': seo_keywords,
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
        prompt = f"""Create a clean, SEO-optimized product name (max 60 characters) for: "{original_name}" in {language_name}

CRITICAL RULES:
- Return ONLY the product name, nothing else
- NO explanations, analysis, or conversational text
- NO "¡Claro!" or "Aquí tienes" or similar phrases
- NO bullet points or formatting
- NO quotes around the name
- Focus on key features and benefits
- Make it appealing and descriptive

EXAMPLE INPUT: "Bobby, the Hopping Robot (Between the Lions)"
EXAMPLE OUTPUT: Robot Aspirador Bobby - Limpieza Inteligente

RESPOND WITH ONLY THE PRODUCT NAME:"""
        
        response = self.get_ai_response_fast(prompt)
        
        # Clean up the response - remove any conversational text
        clean_name = response.strip()
        
        # Remove common conversational prefixes and patterns
        conversational_patterns = [
            r'¡.*?\!.*?(?=\n|$)',
            r'Aquí tienes.*?(?=\n|$)',
            r'Como.*?especialista.*?(?=\n|$)',
            r'Opción.*?(?=\n|$)',
            r'Nombre SEO.*?(?=\n|$)',
            r'Título SEO.*?(?=\n|$)',
            r'Justificación.*?(?=\n|$)',
            r'Consideraciones.*?(?=\n|$)',
            r'Análisis.*?(?=\n|$)',
            r'---.*?(?=\n|$)',
            r'\*\*.*?\*\*',
            r'^\d+\.\s*',
        ]
        
        for pattern in conversational_patterns:
            clean_name = re.sub(pattern, '', clean_name, flags=re.IGNORECASE | re.DOTALL | re.MULTILINE)
        
        # Extract just the product name if it's wrapped in quotes or asterisks
        if '"' in clean_name:
            match = re.search(r'"([^"]+)"', clean_name)
            if match:
                clean_name = match.group(1)
        
        # Look for bold text patterns
        bold_match = re.search(r'\*\*([^*]+)\*\*', clean_name)
        if bold_match:
            clean_name = bold_match.group(1)
        
        # Remove asterisks and other formatting
        clean_name = re.sub(r'[*#-]', '', clean_name).strip()
        
        # Clean up extra whitespace and newlines
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        
        # If still contains conversational text, try to extract the first clean line
        if any(word in clean_name.lower() for word in ['opción', 'justificación', 'consideraciones', 'análisis', 'como especialista']):
            lines = clean_name.split('\n')
            for line in lines:
                line = line.strip()
                if line and len(line) > 5 and not any(word in line.lower() for word in ['opción', 'justificación', 'consideraciones', 'análisis', 'como especialista', 'aquí tienes']):
                    clean_name = line
                    break
        
        # Limit to 60 characters
        return clean_name[:60] if clean_name else original_name[:60]

    def enhance_description_fast(self, original_name, features, price):
        """AI-powered description enhancement with product-specific prompts"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        features_text = ", ".join(features[:3]) if features else "key features"
        
        prompt = f"""Create HTML description (200 words) for: {original_name} in {language_name}
Price: {price}€
Features: {features_text[:50]}

CRITICAL RULES:
- Return ONLY the HTML content, nothing else
- NO explanations, analysis, or conversational text
- NO "¡Absolutamente!" or "Como especialista" or similar phrases
- NO bullet points or formatting outside HTML
- Start directly with <div> and end with </div>
- Focus on product benefits and features
- Include compelling call-to-action

EXAMPLE OUTPUT:
<div>
<h2>Product Title</h2>
<p>Description...</p>
<h3>Features</h3>
<ul><li>Feature 1</li></ul>
<p>Call to action</p>
</div>

RESPOND WITH ONLY THE HTML:"""
        
        response = self.get_ai_response_fast(prompt)
        
        # Clean up response - remove ```html and ``` if present
        if response.startswith('```html'):
            response = response[7:]
        if response.startswith('```'):
            response = response[3:]
        if response.endswith('```'):
            response = response[:-3]
        
        # Remove conversational text patterns
        conversational_patterns = [
            r'¡.*?\!.*?(?=\n|$)',
            r'Aquí tienes.*?(?=\n|$)',
            r'Como.*?especialista.*?(?=\n|$)',
            r'He creado.*?(?=\n|$)',
            r'Optimizada.*?(?=\n|$)',
            r'Persuasiva.*?(?=\n|$)',
            r'\*\*Precio.*?(?=\n|$)',
        ]
        
        for pattern in conversational_patterns:
            response = re.sub(pattern, '', response, flags=re.IGNORECASE | re.DOTALL | re.MULTILINE)
        
        # Extract HTML content if it's wrapped in conversational text
        html_match = re.search(r'```html\s*(.*?)\s*```', response, re.DOTALL)
        if html_match:
            response = html_match.group(1)
        
        # Ensure proper HTML structure
        if not response.startswith('<div'):
            response = f"<div>\n{response}"
        if not response.endswith('</div>'):
            response = f"{response}\n</div>"
            
        return response.strip()

    def enhance_specifications_fast(self, specifications, original_name):
        """AI-powered specifications enhancement - SIMPLIFIED for e-commerce"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        existing_specs = ", ".join(specifications.keys()) if specifications else "none"
        
        prompt = f"""JSON specs for: {original_name} in {language_name}
Example: {{"Garantie":"2 Jahre","Versand":"Kostenlos","Material":"Hochwertig"}}

IMPORTANT: Respond ONLY with valid JSON object, no additional text.
Focus on robot/technology specifications for: {original_name}"""
        
        try:
            response = self.get_ai_response_fast(prompt)
            
            # Clean up response - remove ```json and ``` if present
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.startswith('```'):
                response = response[3:]
            if response.endswith('```'):
                response = response[:-3]
            
            response = response.strip()
            
            # Remove any conversational text before JSON
            if ':' in response and '{' in response:
                # Find the first { and take everything from there
                json_start = response.find('{')
                if json_start > 0:
                    response = response[json_start:]
            
            # Try to find JSON object in the response
            import re
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                try:
                    parsed_specs = json.loads(json_str)
                    if isinstance(parsed_specs, dict):
                        return parsed_specs
                except json.JSONDecodeError:
                    pass
            
            # If no JSON object found, try parsing the whole response
            try:
                parsed_specs = json.loads(response)
                if isinstance(parsed_specs, dict):
                    return parsed_specs
            except json.JSONDecodeError:
                pass
                
            # If all parsing fails, return default specs instead of raising error
            safe_print(f"[WARNING] Could not parse specs JSON, using defaults")
            return {
                "Garantía": "2 años",
                "Envío": "Gratis", 
                "Material": "Alta calidad",
                "Tecnología": "Avanzada"
            }
            
        except json.JSONDecodeError as e:
            safe_print(f"[ERROR] JSON parsing failed: {e}")
            safe_print(f"[ERROR] Response was: {response[:200]}...")
            # Return default specs instead of raising error
            return {
                "Garantía": "2 años",
                "Envío": "Gratis", 
                "Material": "Alta calidad",
                "Tecnología": "Avanzada"
            }
        except Exception as e:
            safe_print(f"[ERROR] Specifications enhancement failed: {e}")
            # Return default specs instead of raising error
            return {
                "Garantía": "2 años",
                "Envío": "Gratis", 
                "Material": "Alta calidad",
                "Tecnología": "Avanzada"
            }

    def generate_faq_fast(self, original_name, features, price):
        """AI-powered FAQ generation - SIMPLIFIED and conversational"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        features_text = ", ".join(features[:2]) if features else "key features"
        
        prompt = f"""3 FAQ JSON for: {original_name} in {language_name}
Format: [{{"question":"Is it easy to use?","answer":"Yes, it's very simple..."}}]

IMPORTANT: Respond ONLY with valid JSON array, no additional text.
Focus on robot/technology FAQs for: {original_name}"""
        
        try:
            response = self.get_ai_response_fast(prompt)
            
            # Clean up response - remove ```json and ``` if present
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.startswith('```'):
                response = response[3:]
            if response.endswith('```'):
                response = response[:-3]
            
            response = response.strip()
            
            # Remove any conversational text before JSON
            if ':' in response and '[' in response:
                # Find the first [ and take everything from there
                json_start = response.find('[')
                if json_start > 0:
                    response = response[json_start:]
            
            # Try to find JSON array in the response
            import re
            json_match = re.search(r'\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                try:
                    parsed_faq = json.loads(json_str)
                    if isinstance(parsed_faq, list) and len(parsed_faq) > 0:
                        return parsed_faq
                except json.JSONDecodeError:
                    pass
            
            # If no JSON array found, try parsing the whole response
            try:
                parsed_faq = json.loads(response)
                if isinstance(parsed_faq, list) and len(parsed_faq) > 0:
                    return parsed_faq
            except json.JSONDecodeError:
                pass
                
            # If all parsing fails, return default FAQ instead of raising error
            safe_print(f"[WARNING] Could not parse FAQ JSON, using defaults")
            return [
                {"question": "¿Es fácil de usar?", "answer": "Sí, es muy simple y intuitivo de usar."},
                {"question": "¿Qué garantía tiene?", "answer": "Incluye garantía de 2 años del fabricante."},
                {"question": "¿El envío es gratuito?", "answer": "Sí, ofrecemos envío gratuito en toda España."}
            ]
            
        except json.JSONDecodeError as e:
            safe_print(f"[ERROR] FAQ JSON parsing failed: {e}")
            safe_print(f"[ERROR] Response was: {response[:200]}...")
            # Return default FAQ instead of raising error
            return [
                {"question": "¿Es fácil de usar?", "answer": "Sí, es muy simple y intuitivo de usar."},
                {"question": "¿Qué garantía tiene?", "answer": "Incluye garantía de 2 años del fabricante."},
                {"question": "¿El envío es gratuito?", "answer": "Sí, ofrecemos envío gratuito en toda España."}
            ]
        except Exception as e:
            safe_print(f"[ERROR] FAQ generation failed: {e}")
            # Return default FAQ instead of raising error
            return [
                {"question": "¿Es fácil de usar?", "answer": "Sí, es muy simple y intuitivo de usar."},
                {"question": "¿Qué garantía tiene?", "answer": "Incluye garantía de 2 años del fabricante."},
                {"question": "¿El envío es gratuito?", "answer": "Sí, ofrecemos envío gratuito en toda España."}
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
        """Fast AI response using Google Gemini 2.5 Flash with fallbacks for robustness"""
        try:
            import google.generativeai as genai
            
            # Configure Gemini with your API key
            API_KEY = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
            
            if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
                safe_print(f"[ERROR] No API key configured! Using fallback.")
                return self._get_fallback_response(prompt)
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            
            # System prompt for target language
            language_name = self.language_map.get(self.output_language, self.output_language.title())
            system_prompt = f"You are an expert SEO and digital marketing specialist for e-commerce products. Always respond in {language_name} with clear, persuasive, and SEO-optimized content. Focus on product optimization and robot/technology-related content."
            
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Small delay to avoid rate limits
            time.sleep(0.5)
            
            response = model.generate_content(full_prompt)
            
            # Check for valid response with proper error handling
            if response and response.candidates:
                candidate = response.candidates[0]
                if candidate.content and candidate.content.parts:
                    text_content = candidate.content.parts[0].text
                    if text_content and text_content.strip():
                        return text_content.strip()
                    else:
                        safe_print(f"[WARNING] Empty text content in AI response, using fallback")
                        return self._get_fallback_response(prompt)
                else:
                    safe_print(f"[WARNING] No content parts in AI response, using fallback")
                    return self._get_fallback_response(prompt)
            else:
                safe_print(f"[WARNING] No candidates in AI response, using fallback")
                return self._get_fallback_response(prompt)
                
        except ImportError:
            safe_print(f"[ERROR] Google Generative AI not installed! Using fallback.")
            return self._get_fallback_response(prompt)
        except Exception as e:
            safe_print(f"[ERROR] AI request failed: {str(e)}")
            safe_print(f"[WARNING] Using fallback response")
            return self._get_fallback_response(prompt)
    
    def _get_fallback_response(self, prompt):
        """Generate fallback response when AI fails"""
        if "JSON" in prompt or "json" in prompt:
            if "FAQ" in prompt or "faq" in prompt:
                return '[{"question":"¿Es fácil de usar?","answer":"Sí, es muy simple y intuitivo."}]'
            else:
                return '{"Garantía":"2 años","Envío":"Gratis","Material":"Alta calidad"}'
        elif "description" in prompt.lower():
            return f"Producto de alta calidad con tecnología avanzada. Envío gratuito incluido."
        elif "name" in prompt.lower() or "nombre" in prompt.lower():
            # Extract key features from the original name for fallback
            if "tablet" in prompt.lower() or "tableta" in prompt.lower():
                return "Tableta Android Premium | Alta Calidad | Envío Gratis"
            elif "robot" in prompt.lower():
                return "Robot Inteligente | Tecnología Avanzada | Envío Gratis"
            else:
                return "Producto Premium | Alta Calidad | Envío Gratis"
        else:
            return "Producto optimizado para mejor rendimiento y calidad."

    def _raise_ai_error(self, content_type):
        """Raise error when AI fails - no fallbacks allowed"""
        raise Exception(f"AI {content_type} generation failed - stopping script")
    
    def generate_seo_keywords_ai(self, product_name, category, brand):
        """Generate SEO keywords using AI based on actual product data"""
        language_name = self.language_map.get(self.output_language, self.output_language.title())
        
        prompt = f"SEO keywords for: {product_name} in {language_name}\nCategory: {category}\nBrand: {brand}\nFormat: keyword1, keyword2, keyword3"
        
        try:
            response = self.get_ai_response_fast(prompt)
            keywords = response.strip().replace('"', '').replace("'", '')
            return keywords
        except Exception as e:
            safe_print(f"[ERROR] SEO keywords generation failed: {e}")
            # Fallback to basic product name if AI fails
            return product_name

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
    parser.add_argument('--workers', '-w', type=int, default=5,
                        help='Number of concurrent workers for ultra-fast mode (default: 5)')
    
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