#!/usr/bin/env python3
"""
AI Homepage Generator
Generates all home page sections with AI-optimized content for mobile phones for seniors
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

class AIHomepageGenerator:
    def __init__(self):
        self.locales_dir = "../locales"
        self.components_dir = "../components"
        self.backup_dir = "../backups"
        
        # Create directories if they don't exist
        os.makedirs(self.backup_dir, exist_ok=True)
        
        # Performance settings
        self.request_delay = 1.0  # Seconds between requests
    
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
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # System prompt for Spanish mobile phone expert
            system_prompt = """Eres un experto en marketing digital y copywriting para teléfonos móviles dirigidos a personas mayores en España. 
            Tu objetivo es crear contenido persuasivo, emocional y optimizado para SEO que genere confianza y deseo de compra.
            Siempre respondes en español con un tono cálido, familiar y tranquilizador."""
            
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
        return "Encuentra los mejores teléfonos móviles para personas mayores. Fáciles de usar, seguros y confiables."
    
    def generate_hero_content(self):
        """Generate hero section content"""
        prompt = """Crea contenido para la sección HERO de una tienda de teléfonos móviles para mayores.

REQUISITOS CRÍTICOS:
- Título principal IMPACTANTE (máximo 60 caracteres)
- Subtítulo persuasivo que genere CONFIANZA (máximo 120 caracteres)  
- Call-to-Action URGENTE (máximo 25 caracteres)
- 4 características de confianza con títulos y descripciones
- Dirigirse a FAMILIAS preocupadas por sus mayores
- Crear URGENCIA y DESEO emocional
- Incluir beneficios ESPECÍFICOS (SOS, batería 7 días, botones grandes)

FORMATO JSON:
{
  "title": "Título principal impactante",
  "subtitle": "Subtítulo persuasivo que genere confianza",
  "cta": "CALL TO ACTION",
  "trust": {
    "rating": "4.9/5",
    "badge": "★★★★★ Familias Satisfechas",
    "reviews": "Más de 2000+ opiniones verificadas",
    "delivery": "Envío Gratis 24h",
    "guarantee": "Garantía Total 2 años"
  },
  "features": {
    "quality": {
      "title": "Título característica 1",
      "description": "Descripción beneficio específico"
    },
    "design": {
      "title": "Título característica 2", 
      "description": "Descripción beneficio específico"
    },
    "innovation": {
      "title": "Título característica 3",
      "description": "Descripción beneficio específico"
    },
    "support": {
      "title": "Título característica 4",
      "description": "Descripción beneficio específico"
    }
  }
}

Responde SOLO el JSON, sin explicaciones:"""
        
        response = self.get_ai_response(prompt)
        return self.parse_json_response(response, "hero")
    
    def generate_featured_content(self):
        """Generate featured products section content"""
        prompt = """Crea contenido para la sección de PRODUCTOS DESTACADOS.

REQUISITOS CRÍTICOS:
- Título que genere DESEO de compra (máximo 50 caracteres)
- Subtítulo que tranquilice a las familias (máximo 100 caracteres)
- Texto de botón con URGENCIA (máximo 30 caracteres)
- Mensaje de carga amigable
- Enfoque en TRANQUILIDAD familiar

FORMATO JSON:
{
  "title": "Título que genere deseo",
  "subtitle": "Subtítulo tranquilizador para familias",
  "loading": "Mensaje de carga amigable...",
  "viewAll": "TEXTO BOTÓN URGENTE"
}

Responde SOLO el JSON, sin explicaciones:"""
        
        response = self.get_ai_response(prompt)
        return self.parse_json_response(response, "featured")
    
    def generate_about_content(self):
        """Generate about section content"""
        prompt = """Crea contenido COMPLETO para la sección SOBRE NOSOTROS de una tienda de teléfonos para mayores.

REQUISITOS CRÍTICOS:
- Título EMOCIONAL que genere confianza (máximo 60 caracteres)
- Subtítulo persuasivo (máximo 120 caracteres)
- Descripción LARGA que conecte emocionalmente (200-250 palabras)
- 4 características clave con títulos y descripciones
- Estadísticas impresionantes
- Call-to-Action final
- Enfoque en TRANQUILIDAD familiar y SEGURIDAD

FORMATO JSON:
{
  "title": "Título emocional que genere confianza",
  "subtitle": "Subtítulo persuasivo sobre nuestra misión",
  "description": "Descripción larga emocional de 200-250 palabras que conecte con familias preocupadas por sus mayores, mencione experiencia, casos de éxito, y beneficios específicos como botón SOS, facilidad de uso, etc.",
  "features": [
    {
      "title": "Especialistas en Mayores",
      "description": "Descripción específica del beneficio"
    },
    {
      "title": "Soporte Familiar 24/7",
      "description": "Descripción específica del beneficio"
    },
    {
      "title": "Garantía Total",
      "description": "Descripción específica del beneficio"
    },
    {
      "title": "Instalación Gratuita",
      "description": "Descripción específica del beneficio"
    }
  ],
  "stats": {
    "customers": "5000+",
    "satisfaction": "98%",
    "support": "24/7",
    "experience": "10+ años"
  },
  "cta": "ENCUENTRA TU TELÉFONO PERFECTO"
}

Responde SOLO el JSON, sin explicaciones:"""
        
        response = self.get_ai_response(prompt)
        return self.parse_json_response(response, "about")
    
    def generate_why_choose_us_content(self):
        """Generate why choose us section content"""
        prompt = """Crea contenido para la sección POR QUÉ ELEGIRNOS.

REQUISITOS CRÍTICOS:
- Título PODEROSO (máximo 60 caracteres)
- Subtítulo que elimine OBJECIONES (máximo 120 caracteres)
- 6 razones ESPECÍFICAS con títulos y descripciones detalladas
- Cada razón debe incluir beneficios CONCRETOS
- Enfoque en RESULTADOS y TRANQUILIDAD
- Incluir datos y especificaciones técnicas

FORMATO JSON:
{
  "title": "Título poderoso sobre por qué elegirnos",
  "subtitle": "Subtítulo que elimine objeciones y genere confianza",
  "reasons": [
    {
      "title": "Especialización Exclusiva",
      "description": "Descripción detallada con beneficios específicos y datos"
    },
    {
      "title": "Soporte Técnico Familiar",
      "description": "Descripción detallada con beneficios específicos"
    },
    {
      "title": "Instalación y Configuración",
      "description": "Descripción detallada con beneficios específicos"
    },
    {
      "title": "Garantía Extendida",
      "description": "Descripción detallada con beneficios específicos"
    },
    {
      "title": "Precios Transparentes",
      "description": "Descripción detallada con beneficios específicos"
    },
    {
      "title": "Satisfacción Garantizada",
      "description": "Descripción detallada con beneficios específicos"
    }
  ]
}

Responde SOLO el JSON, sin explicaciones:"""
        
        response = self.get_ai_response(prompt)
        return self.parse_json_response(response, "why_choose_us")
    
    def generate_testimonials_content(self):
        """Generate testimonials/reviews content"""
        prompt = """Crea contenido para la sección de TESTIMONIOS/RESEÑAS.

REQUISITOS CRÍTICOS:
- Título EMOCIONAL (máximo 50 caracteres)
- Subtítulo que genere CONFIANZA (máximo 100 caracteres)
- 6 testimonios REALES y ESPECÍFICOS de familias
- Cada testimonio con nombre, edad, ciudad y historia detallada
- Mencionar beneficios CONCRETOS (SOS funcionó, fácil de usar, batería dura)
- Crear CONEXIÓN emocional
- Incluir situaciones REALES (emergencias, facilidad de uso)

FORMATO JSON:
{
  "title": "Título emocional sobre testimonios",
  "subtitle": "Subtítulo que genere confianza social",
  "testimonials": [
    {
      "name": "Nombre Real",
      "age": 75,
      "city": "Ciudad, España",
      "rating": 5,
      "text": "Testimonio detallado de 80-100 palabras con situación específica, beneficios concretos y resultado emocional",
      "highlight": "Beneficio principal destacado"
    }
  ]
}

Genera 6 testimonios diferentes y únicos.
Responde SOLO el JSON, sin explicaciones:"""
        
        response = self.get_ai_response(prompt)
        return self.parse_json_response(response, "testimonials")
    
    def parse_json_response(self, response, section_name):
        """Parse JSON response from AI"""
        try:
            # Clean response
            response = response.strip()
            if '```json' in response:
                response = re.sub(r'```json\s*', '', response)
            if '```' in response:
                response = re.sub(r'```.*$', '', response, flags=re.DOTALL)
            
            # Parse JSON
            if '{' in response and '}' in response:
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return parsed
        except Exception as e:
            safe_print(f"[ERROR] Failed to parse JSON for {section_name}: {e}")
        
        return self.get_fallback_content(section_name)
    
    def get_fallback_content(self, section_name):
        """Fallback content for each section"""
        fallbacks = {
            "hero": {
                "title": "Teléfonos Fáciles para Mayores",
                "subtitle": "Botón SOS, Batería 7 días, Fácil de usar. Tranquilidad para toda la familia.",
                "cta": "VER TELÉFONOS"
            },
            "featured": {
                "title": "Teléfonos Recomendados",
                "subtitle": "Selección de los mejores teléfonos para personas mayores",
                "viewAll": "VER TODOS"
            },
            "about": {
                "title": "Especialistas en Teléfonos para Mayores",
                "subtitle": "Ayudamos a las familias a encontrar el teléfono perfecto"
            }
        }
        return fallbacks.get(section_name, {})
    
    def backup_file(self, filepath):
        """Create backup of a file"""
        if os.path.exists(filepath):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.basename(filepath)
            backup_path = os.path.join(self.backup_dir, f"{filename}_backup_{timestamp}")
            
            with open(filepath, 'r', encoding='utf-8') as source:
                with open(backup_path, 'w', encoding='utf-8') as backup:
                    backup.write(source.read())
            
            safe_print(f"[BACKUP] Created: {backup_path}")
    
    def generate_all_content(self):
        """Generate all home page content"""
        safe_print("[START] AI Homepage Content Generation")
        safe_print("=" * 60)
        
        generated_content = {}
        
        # Generate each section
        sections = [
            ("hero", "Hero Section"),
            ("featured", "Featured Products"),
            ("about", "About Section"),
            ("why_choose_us", "Why Choose Us"),
            ("testimonials", "Testimonials")
        ]
        
        for section_key, section_name in sections:
            safe_print(f"\n[AI] Generating {section_name}...")
            
            if section_key == "hero":
                content = self.generate_hero_content()
            elif section_key == "featured":
                content = self.generate_featured_content()
            elif section_key == "about":
                content = self.generate_about_content()
            elif section_key == "why_choose_us":
                content = self.generate_why_choose_us_content()
            elif section_key == "testimonials":
                content = self.generate_testimonials_content()
            
            generated_content[section_key] = content
            safe_print(f"[SUCCESS] {section_name} generated!")
        
        return generated_content
    
    def save_content_to_locales(self, content):
        """Save generated content to locale files"""
        safe_print("\n[SAVE] Updating locale files...")
        
        # Update hero.json - Clean version with only needed content
        if "hero" in content:
            hero_file = os.path.join(self.locales_dir, "hero.json")
            self.backup_file(hero_file)
            
            new_hero = {
                "hero": {
                    "expertise": {
                        "title": content["hero"].get("title", ""),
                        "subtitle": content["hero"].get("subtitle", ""),
                        "cta": content["hero"].get("cta", "")
                    },
                    "trust": content["hero"].get("trust", {}),
                    "features": content["hero"].get("features", {})
                },
                "homepage": {
                    "hero": {
                        "featured": content.get("featured", {})
                    }
                }
            }
            
            with open(hero_file, 'w', encoding='utf-8') as f:
                json.dump(new_hero, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[SAVED] {hero_file}")
        
        # Clean up common.json - remove unused strings
        self.clean_unused_strings()
        
        # Save complete content to a comprehensive file
        complete_file = os.path.join(self.backup_dir, f"homepage_content_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(complete_file, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        
        safe_print(f"[SAVED] Complete content: {complete_file}")
    
    def clean_unused_strings(self):
        """Remove unused strings from locale files"""
        strings_file = os.path.join(self.locales_dir, "strings.json")
        
        if os.path.exists(strings_file):
            self.backup_file(strings_file)
            
            # Load existing strings
            try:
                with open(strings_file, 'r', encoding='utf-8') as f:
                    strings_data = json.load(f)
            except:
                strings_data = {}
            
            # Keep only essential strings
            clean_strings = {
                "homepage": {
                    "title": strings_data.get("homepage", {}).get("title", "Inicio"),
                    "loading": strings_data.get("homepage", {}).get("loading", "Cargando...")
                }
            }
            
            # Remove unused sections
            unused_sections = [
                "homepage.about.title",
                "homepage.about.subtitle", 
                "homepage.about.story1",
                "homepage.about.story2",
                "homepage.about.story3",
                "homepage.about.viewProducts",
                "homepage.whyChooseUs",
                "homepage.testimonials.oldContent"
            ]
            
            with open(strings_file, 'w', encoding='utf-8') as f:
                json.dump(clean_strings, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[CLEANED] Removed unused strings from {strings_file}")
    
    def generate_homepage_instructions(self, content):
        """Generate instructions for implementing the content"""
        safe_print("\n" + "=" * 60)
        safe_print("📋 IMPLEMENTATION INSTRUCTIONS")
        safe_print("=" * 60)
        
        safe_print("\n1. 🖼️ REMOVE HERO BACKGROUND IMAGE:")
        safe_print("   - Edit src/app/HomeClient.tsx")
        safe_print("   - Remove the Image components (lines ~109-133)")
        safe_print("   - Remove the background overlay div")
        safe_print("   - Change background to solid color or gradient")
        
        safe_print("\n2. 📱 REMOVE BOTTOM LEFT VIDEO:")
        safe_print("   - Check components/FloatingButtons.tsx")
        safe_print("   - Remove video-related floating button")
        safe_print("   - Or disable in Layout component")
        
        safe_print("\n3. 📝 UPDATE CONTENT:")
        safe_print("   - Hero content saved to locales/hero.json")
        safe_print("   - Update components/AboutSection.tsx with new about content")
        safe_print("   - Update components/WhyChooseUs.tsx with new reasons")
        safe_print("   - Update components/Reviews.tsx with new testimonials")
        
        safe_print("\n4. 🎨 STYLING IMPROVEMENTS:")
        safe_print("   - Hero: Use gradient background instead of image")
        safe_print("   - Make sections more mobile-friendly")
        safe_print("   - Ensure all text is readable and accessible")
        
        safe_print(f"\n5. 📄 CONTENT PREVIEW:")
        if "hero" in content:
            safe_print(f"   Hero Title: {content['hero'].get('title', '')}")
            safe_print(f"   Hero CTA: {content['hero'].get('cta', '')}")
        
        safe_print(f"\n✅ All content generated and saved!")
        safe_print(f"📁 Backup directory: {self.backup_dir}")

def main():
    """Main function"""
    generator = AIHomepageGenerator()
    
    safe_print("🏠 AI Homepage Content Generator")
    safe_print("Generating optimized content for mobile phones for seniors")
    safe_print("=" * 70)
    
    choice = input("\n🚀 Generate all homepage content? (y/n): ").strip().lower()
    
    if choice == 'y':
        # Generate all content
        content = generator.generate_all_content()
        
        # Save to files
        generator.save_content_to_locales(content)
        
        # Show implementation instructions
        generator.generate_homepage_instructions(content)
        
    else:
        safe_print("\n❌ Generation cancelled")

if __name__ == "__main__":
    main() 