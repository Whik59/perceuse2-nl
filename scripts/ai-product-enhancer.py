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
    def __init__(self):
        self.products_dir = "../data/products"
        self.backup_dir = "../backups/products"
        
        # Create backup directory if it doesn't exist
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Performance settings
        self.max_concurrent_requests = 10  # Concurrent AI requests
        self.batch_size = 20  # Products per batch
        self.request_delay = 0.5  # Seconds between requests (reduced)
        self.print_lock = Lock()  # Thread-safe printing
        
        # AI prompts for different enhancements
        self.prompts = {
            'name_optimization': """
Optimize this Spanish product name for SEO and user appeal:
Original: "{original_name}"

Requirements:
- Keep it in Spanish
- Make it more appealing and descriptive
- Include key features that users search for
- Maximum 80 characters
- Focus on benefits for elderly users (if applicable)

Respond with just the optimized name, nothing else.
""",
            
            'slug_optimization': """
Create an SEO-friendly URL slug from this Spanish product name:
Name: "{product_name}"

Requirements:
- Use only lowercase letters, numbers, and hyphens
- Maximum 60 characters
- Include main keywords
- Remove accents and special characters
- Make it readable and memorable

Respond with just the slug, nothing else.
""",
            
            'description_enhancement': """
Create an enhanced Spanish product description for this phone:
Original: "{original_description}"
Features: {features}
Price: {price}€

Requirements:
- Write in Spanish
- Make it compelling and SEO-friendly
- Highlight benefits for elderly users
- Include emotional appeal
- Use HTML formatting with proper structure
- Include call-to-action
- Maximum 500 words

Format as HTML with proper headings, lists, and paragraphs.
""",
            
            'specifications_enhancement': """
Enhance these product specifications in Spanish:
Original specs: {original_specs}
Product: {product_name}

Requirements:
- Add missing common specifications for phones
- Use proper Spanish terminology
- Include technical details that matter to users
- Format consistently
- Add specifications that elderly users care about

Return as JSON object with key-value pairs.
""",
            
            'faq_generation': """
Generate 5 frequently asked questions and answers in Spanish for this product:
Product: {product_name}
Features: {features}
Price: {price}€

Requirements:
- Focus on concerns elderly users might have
- Include questions about ease of use, durability, support
- Provide helpful, reassuring answers
- Use natural Spanish language
- Make answers informative but concise

Return as JSON array with objects containing "question" and "answer" fields.
"""
        }
    
    async def get_ai_response_async(self, prompt, session_id="", max_retries=3):
        """
        Async AI response using Google Gemini 2.5 Flash - optimized for batch processing
        """
        try:
            import google.generativeai as genai
            
            # Configure Gemini with your API key
            API_KEY = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
            
            if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
                return self.get_fallback_response(prompt)
            
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Shortened system prompt for faster processing
            system_prompt = "Experto SEO español para móviles mayores. Respuestas claras y persuasivas."
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Add small delay to avoid rate limiting
            await asyncio.sleep(self.request_delay)
            
            response = model.generate_content(full_prompt)
            
            if response and response.text:
                return response.text.strip()
            else:
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
        if "name_optimization" in prompt:
            return "Teléfono Móvil para Mayores con Botones Grandes y SOS - Fácil de Usar"
        elif "slug_optimization" in prompt:
            return "telefono-movil-mayores-botones-grandes-sos-facil"
        elif "description_enhancement" in prompt:
            return """<div class="product-description">
<h2>Teléfono Móvil Especialmente Diseñado para Personas Mayores</h2>
<p>Descubre la tranquilidad de tener un teléfono que realmente entiende tus necesidades. Este dispositivo ha sido cuidadosamente diseñado pensando en la comodidad y seguridad de las personas mayores.</p>

<h3>Características Principales:</h3>
<ul>
<li><strong>Botones Grandes y Visibles:</strong> Teclas de gran tamaño con números claros para una marcación sin errores</li>
<li><strong>Botón SOS de Emergencia:</strong> Conexión directa con tus contactos de confianza en caso de necesidad</li>
<li><strong>Pantalla Fácil de Leer:</strong> Display con letras grandes y alto contraste</li>
<li><strong>Sonido Potente:</strong> Volumen extra alto para escuchar perfectamente</li>
</ul>

<h3>¿Por Qué Elegir Este Teléfono?</h3>
<p>✓ <strong>Simplicidad:</strong> Interfaz intuitiva, sin complicaciones<br>
✓ <strong>Seguridad:</strong> Función SOS para mayor tranquilidad<br>
✓ <strong>Durabilidad:</strong> Construcción robusta para uso diario<br>
✓ <strong>Soporte:</strong> Atención al cliente especializada</p>

<div class="cta-section">
<p><strong>¡Haz tu vida más fácil y segura!</strong> Ideal para ti o como regalo perfecto para tus seres queridos.</p>
</div>
</div>"""
        elif "specifications_enhancement" in prompt:
            return {
                "Tipo de Pantalla": "LCD a color",
                "Tamaño de Pantalla": "2.4 pulgadas", 
                "Tecnología": "2G GSM",
                "Batería": "1000mAh Li-ion",
                "Autonomía en Standby": "Hasta 7 días",
                "Autonomía en Conversación": "Hasta 6 horas",
                "Memoria de Contactos": "300 contactos",
                "Botón SOS": "Sí, programable",
                "Carga": "Micro USB / USB-C",
                "Peso": "Aproximadamente 100g",
                "Dimensiones": "110 x 58 x 15 mm",
                "Resistencia": "Resistente a golpes",
                "Idioma": "Español",
                "Garantía": "2 años"
            }
        elif "faq_generation" in prompt:
            return [
                {
                    "question": "¿Es realmente fácil de usar para personas mayores?",
                    "answer": "Absolutamente. Este teléfono está diseñado específicamente para personas mayores con botones grandes, menús simples y instrucciones claras. No necesitas conocimientos técnicos para usarlo."
                },
                {
                    "question": "¿Cómo funciona el botón SOS?", 
                    "answer": "El botón SOS se puede programar con hasta 5 contactos de emergencia. Al presionarlo, el teléfono llamará automáticamente a estos números hasta que alguien responda, y también puede enviar un mensaje de texto con tu ubicación."
                },
                {
                    "question": "¿Qué pasa si se me cae el teléfono?",
                    "answer": "Este teléfono está construido para ser resistente a golpes y caídas normales. Su diseño robusto lo protege del uso diario, aunque recomendamos usar la funda incluida para mayor protección."
                },
                {
                    "question": "¿Cuánto dura la batería?",
                    "answer": "La batería puede durar hasta 7 días en modo standby y hasta 6 horas de conversación continua. Esto significa que no tendrás que cargarlo todos los días, dándote mayor tranquilidad."
                },
                {
                    "question": "¿Incluye manual en español y soporte técnico?",
                    "answer": "Sí, incluye un manual detallado en español con ilustraciones claras. Además, nuestro equipo de soporte técnico está disponible para ayudarte con cualquier duda, especializados en atender a personas mayores."
                }
            ]
        
        return "Fallback response - please configure AI service"
    
    # Async versions for batch processing
    async def optimize_product_name_async(self, original_name, session_id):
        """Async version of product name optimization"""
        prompt = f"Crea SOLO el nombre optimizado para SEO (máximo 60 caracteres, sin explicaciones): {original_name}"
        response = await self.get_ai_response_async(prompt, session_id)
        # Clean response - take first line only
        clean_name = response.split('\n')[0].strip()
        # Remove markdown formatting
        clean_name = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_name)
        clean_name = re.sub(r'[*>#-]', '', clean_name).strip()
        return clean_name[:60] if clean_name else original_name[:60]
    
    async def enhance_description_async(self, product_name, features, price, session_id):
        """Async version of description enhancement"""
        features_text = "\n".join(features[:2]) if features else "Teléfono para mayores"
        prompt = f"""Crea SOLO código HTML limpio (sin ```html ni explicaciones) para: {product_name}
Precio: {price}€
Características: {features_text[:200]}

Estructura requerida:
<div>
<h1>Título atractivo</h1>
<p>Párrafo introductorio</p>
<h2>Características Principales</h2>
<ul><li>Lista de beneficios</li></ul>
<p>Párrafo de cierre con llamada a la acción</p>
</div>"""
        
        response = await self.get_ai_response_async(prompt, session_id)
        # Clean HTML response
        response = response.strip()
        if '```html' in response:
            response = re.sub(r'```html\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        # Ensure it starts with <div> and ends with </div>
        if not response.startswith('<div'):
            response = f"<div>\n{response}"
        if not response.endswith('</div>'):
            response = f"{response}\n</div>"
            
        return response
    
    async def enhance_specifications_async(self, original_specs, product_name, session_id):
        """Async version of specifications enhancement"""
        prompt = f"""Crea SOLO un objeto JSON limpio (sin ```json ni explicaciones) con especificaciones técnicas para: {product_name}

Ejemplo formato:
{{"Pantalla": "2.4 pulgadas", "Batería": "800mAh", "Peso": "120g", "Conectividad": "2G GSM", "Memoria": "200 contactos", "Autonomía": "6 días standby"}}

Responde SOLO el JSON:"""
        
        response = await self.get_ai_response_async(prompt, session_id)
        
        # Clean JSON response
        response = response.strip()
        if '```json' in response:
            response = re.sub(r'```json\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        # Parse JSON
        try:
            if '{' in response and '}' in response:
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return parsed if isinstance(parsed, dict) else original_specs
        except:
            pass
        
        # Fallback specifications for phones
        return {
            "Pantalla": "2.4 pulgadas LCD",
            "Batería": "800mAh de larga duración", 
            "Conectividad": "2G GSM",
            "Peso": "Ligero y compacto",
            "Memoria": "200 contactos",
            "Autonomía": "Varios días en standby"
        }
    
    async def generate_faq_async(self, product_name, features, price, session_id):
        """Async version of FAQ generation"""
        prompt = f"""Crea SOLO un array JSON limpio (sin ```json ni explicaciones) con 5 preguntas FAQ para: {product_name}

Precio: {price}€

Formato exacto:
[{{"question":"¿Es fácil de usar?","answer":"Sí, muy fácil..."}},{{"question":"¿Cuánto cuesta?","answer":"Solo {price}€..."}}]

Responde SOLO el array JSON:"""
        
        response = await self.get_ai_response_async(prompt, session_id)
        
        # Clean JSON response
        response = response.strip()
        if '```json' in response:
            response = re.sub(r'```json\s*', '', response)
        if '```' in response:
            response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
        
        # Parse JSON
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
        """Fallback FAQ for phones"""
        return [
            {"question": "¿Es fácil de usar para personas mayores?", "answer": f"Sí, el {product_name} está diseñado específicamente para facilitar su uso a personas mayores con botones grandes y funciones simplificadas."},
            {"question": "¿Cuál es el precio?", "answer": f"El precio es de solo {price}€, una excelente relación calidad-precio."},
            {"question": "¿Tiene función de emergencia?", "answer": "Sí, incluye botón SOS para llamadas de emergencia rápidas."},
            {"question": "¿La batería dura mucho?", "answer": "Sí, la batería está optimizada para varios días de uso con una sola carga."},
            {"question": "¿Es compatible con todas las operadoras?", "answer": "Sí, es un teléfono libre compatible con todas las redes GSM en España."}
        ]
    
    async def create_short_description_async(self, product_name, features, price, session_id):
        """Async version of short description creation"""
        prompt = f"Crea SOLO una frase corta (máximo 100 caracteres, sin explicaciones) para: {product_name}, precio: {price}€"
        response = await self.get_ai_response_async(prompt, session_id)
        
        # Clean response
        clean_desc = response.strip().split('\n')[0]
        clean_desc = re.sub(r'[*>#-]', '', clean_desc).strip()
        
        return clean_desc[:100] if clean_desc else f"{product_name[:50]} - Solo {price}€"
    
    def optimize_product_name(self, original_name):
        """Optimize product name for SEO and appeal"""
        safe_print(f"[AI] Optimizing product name...")
        prompt = self.prompts['name_optimization'].format(original_name=original_name)
        return self.get_ai_response(prompt)
    
    def create_seo_slug(self, product_name):
        """Create SEO-friendly slug"""
        safe_print(f"[AI] Creating SEO slug...")
        prompt = self.prompts['slug_optimization'].format(product_name=product_name)
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
- Enfocado en beneficios para personas mayores
- Incluye precio
- Sin HTML, solo texto plano
- Debe ser persuasivo y claro

Ejemplo: "Teléfono móvil para mayores con botones grandes y SOS. Fácil de usar, solo {price}€. Ideal para la seguridad de tus seres queridos."

Responde SOLO con la descripción corta, sin comillas ni texto adicional."""

        response = self.get_ai_response(prompt)
        
        # Clean and limit the response
        if response:
            clean_desc = response.strip().replace('"', '').replace("'", '')
            return clean_desc[:150]
        else:
            return f"{product_name} - Teléfono móvil para mayores, fácil de usar. Solo {price}€"
    
    def enhance_description(self, original_description, features, price, product_name):
        """Enhance product description with AI"""
        safe_print(f"[AI] Enhancing description...")
        
        features_text = "\n".join(features[:3]) if features else "Características principales del producto"
        
        prompt = f"""Crea una descripción completa y atractiva en HTML para este teléfono móvil:

Producto: {product_name}
Precio: {price}€
Características: {features_text}

IMPORTANTE: 
- Escribe en español persuasivo y emocional
- Enfócate en beneficios para personas mayores y sus familias
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
<h2>¿Por Qué Elegir Este Teléfono?</h2>
<p>Beneficios...</p>
<div class="cta-section">
<p><strong>¡Compra ahora y da tranquilidad a tu familia!</strong></p>
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
  "Tipo de Pantalla": "LCD a color",
  "Tamaño de Pantalla": "2.4 pulgadas",
  "Tecnología": "2G GSM"
}}

Añade especificaciones importantes para teléfonos móviles para mayores:
- Tipo y tamaño de pantalla
- Tecnología (2G, 3G, 4G)
- Batería y autonomía
- Memoria de contactos
- Botón SOS
- Peso y dimensiones
- Resistencia
- Idioma y garantía"""

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
        features_text = "\n".join(features[:3]) if features else "Teléfono móvil para mayores"
        
        prompt = f"""Genera exactamente 5 preguntas frecuentes con respuestas para este producto:

Producto: {product_name}
Precio: {price}€
Características principales: {features_text}

IMPORTANTE: Responde SOLO con un array JSON válido, sin texto adicional. Formato:
[
  {{"question": "pregunta aquí", "answer": "respuesta aquí"}},
  {{"question": "pregunta aquí", "answer": "respuesta aquí"}}
]

Enfócate en dudas que tendrían personas mayores sobre:
- Facilidad de uso
- Durabilidad y resistencia  
- Soporte técnico
- Batería y carga
- Funciones de emergencia/SOS"""

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
                "telefono mayores",
                "telefono personas mayores", 
                "telefono botones grandes",
                "telefono sos",
                "telefono facil usar",
                "movil mayores",
                "telefono ancianos",
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
    
    def backup_product(self, product_file):
        """Create backup of original product"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(self.backup_dir, f"{timestamp}_{os.path.basename(product_file)}")
        
        try:
            import shutil
            shutil.copy2(product_file, backup_file)
            safe_print(f"[BACKUP] Created: {backup_file}")
            return backup_file
        except Exception as e:
            safe_print(f"[ERROR] Backup failed: {e}")
            return None
    
    def enhance_single_product(self, product_file):
        """Enhance a single product file"""
        safe_print(f"\n[ENHANCE] Processing: {os.path.basename(product_file)}")
        
        try:
            # Load product data
            with open(product_file, 'r', encoding='utf-8') as f:
                product = json.load(f)
            
            # Create backup
            self.backup_product(product_file)
            
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
        safe_print(f"📁 Backups: {self.backup_dir}")
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
                    
                    # Create backup
                    self.backup_product(product_file)
                    
                    # Extract current data
                    original_name = product.get('name', '')
                    features = product.get('features', [])
                    price = product.get('price', '0')
                    specifications = product.get('specifications', {})
                    
                    # Parallel AI requests for maximum speed
                    tasks = [
                        self.optimize_product_name_async(original_name, f"{index}_name"),
                        self.enhance_description_async(original_name, features, price, f"{index}_desc"),
                        self.enhance_specifications_async(specifications, original_name, f"{index}_specs"),
                        self.generate_faq_async(original_name, features, price, f"{index}_faq"),
                        self.create_short_description_async(original_name, features, price, f"{index}_short")
                    ]
                    
                    # Execute all AI requests in parallel
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    enhanced_name = results[0] if not isinstance(results[0], Exception) else original_name
                    enhanced_description = results[1] if not isinstance(results[1], Exception) else product.get('description', '')
                    enhanced_specs = results[2] if not isinstance(results[2], Exception) else specifications
                    faq = results[3] if not isinstance(results[3], Exception) else []
                    short_desc = results[4] if not isinstance(results[4], Exception) else enhanced_name[:150]
                    
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
                        'keywords': f"{enhanced_name}, teléfono móvil, mayores, senior, fácil uso",
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
        safe_print(f"📁 Backups: {self.backup_dir}")
        safe_print(f"📁 Products: {self.products_dir}")
        
        return total_enhanced, total_failed

def main():
    """Main function"""
    safe_print("🤖 AI Product Enhancer")
    safe_print("Optimizing product data for better SEO and user experience")
    safe_print("=" * 60)
    
    enhancer = AIProductEnhancer()
    
    # Interactive menu
    while True:
        safe_print("\n📋 Options:")
        safe_print("1. Enhance all products (Standard)")
        safe_print("2. Enhance all products (FAST - Batch Mode) ⚡")
        safe_print("3. Enhance single product")
        safe_print("4. View enhancement statistics")
        safe_print("5. Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == '1':
            safe_print("\n🚀 Starting standard bulk enhancement...")
            enhanced, failed = enhancer.enhance_all_products()
            
        elif choice == '2':
            safe_print("\n⚡ Starting FAST batch enhancement...")
            enhanced, failed = enhancer.enhance_all_products_fast()
            
        elif choice == '3':
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
        
        elif choice == '4':
            # Show statistics
            product_files = len([f for f in os.listdir(enhancer.products_dir) if f.endswith('.json')])
            backup_files = len([f for f in os.listdir(enhancer.backup_dir) if f.endswith('.json')])
            
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
            safe_print(f"   Backup files: {backup_files}")
            safe_print(f"   Products directory: {enhancer.products_dir}")
            safe_print(f"   Backup directory: {enhancer.backup_dir}")
        
        elif choice == '5':
            safe_print("\n👋 Goodbye!")
            break
        
        else:
            safe_print("[ERROR] Invalid option. Please try again.")

if __name__ == "__main__":
    main() 