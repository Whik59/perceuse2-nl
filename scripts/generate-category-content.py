#!/usr/bin/env python3
"""
Generate AI Content for Categories
Creates SEO-optimized descriptions for categories and subcategories
"""

import json
import os
import argparse
from pathlib import Path
from datetime import datetime
import requests

class CategoryContentGenerator:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
    
    def _make_api_request(self, prompt: str, max_tokens: int = 800) -> str:
        """Make Gemini API request"""
        try:
            url = f"{self.base_url}/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            
            data = {
                "contents": [{
                    "parts": [{
                        "text": f"Tu es un expert en rédaction e-commerce et SEO pour le marché français des friteuses sans huile et électroménager. Tu écris du contenu optimisé pour les moteurs de recherche et la conversion.\n\n{prompt}"
                    }]
                }],
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": 0.7
                }
            }
            
            response = requests.post(url, json=data)
            response.raise_for_status()
            
            result = response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            
        except Exception as e:
            print(f"[ERROR] Gemini API request failed: {e}")
            return ""
    
    def generate_category_content(self, category_data: dict, products_count: int = 0) -> dict:
        """Generate comprehensive category content"""
        category_name = category_data.get('name', '')
        category_id = category_data.get('id', '')
        
        # Generate main description
        description_prompt = f"""
        Crée une description SEO complète pour cette catégorie e-commerce:
        
        Catégorie: {category_name}
        Nombre de produits: {products_count}
        
        Structure demandée:
        1. Titre H1 SEO (60 caractères max)
        2. Introduction accrocheuse (2-3 phrases)
        3. Avantages des produits de cette catégorie (liste à puces)
        4. Guide d'achat avec critères importants
        5. Appel à l'action
        
        Règles:
        - 300-400 mots total
        - Optimisé pour "friteuse sans huile", "air fryer", "cuisine saine"
        - Ton expert mais accessible
        - Inclure des conseils pratiques
        - Format HTML avec balises appropriées
        
        Réponds avec le contenu HTML complet:
        """
        
        # Generate FAQ for category
        faq_prompt = f"""
        Crée 6 questions-réponses FAQ pour la catégorie "{category_name}":
        
        Questions typiques:
        - Qu'est-ce qu'une friteuse sans huile?
        - Comment choisir sa friteuse?
        - Quelle capacité choisir?
        - Consommation électrique
        - Entretien et nettoyage
        - Avantages santé
        
        Réponds uniquement avec un JSON valide au format:
        [
          {{"question": "Question?", "answer": "Réponse..."}},
          {{"question": "Question?", "answer": "Réponse..."}}
        ]
        """
        
        # Generate buying guide
        guide_prompt = f"""
        Crée un guide d'achat détaillé pour "{category_name}":
        
        Structure:
        1. Critères de choix principaux
        2. Fourchettes de prix
        3. Marques recommandées
        4. Erreurs à éviter
        5. Conseils d'utilisation
        
        Format HTML avec <h3>, <ul>, <p>:
        """
        
        print(f"[GENERATING] Content for {category_name}...")
        
        # Generate content
        description = self._make_api_request(description_prompt, 600)
        faq_response = self._make_api_request(faq_prompt, 800)
        buying_guide = self._make_api_request(guide_prompt, 600)
        
        # Parse FAQ JSON
        faq = []
        try:
            faq = json.loads(faq_response)
        except:
            print(f"[WARNING] Could not parse FAQ JSON for {category_name}")
        
        return {
            'id': category_id,
            'name': category_name,
            'seo_description': description,
            'faq': faq,
            'buying_guide': buying_guide,
            'generated_at': datetime.now().isoformat()
        }
    
    def process_categories(self):
        """Process all categories and generate content"""
        # Load categories
        categories_file = Path("data/categories.json")
        if not categories_file.exists():
            print("[ERROR] Categories file not found!")
            return
        
        with open(categories_file, 'r', encoding='utf-8') as f:
            categories = json.load(f)
        
        # Load category-products mapping to get product counts
        mapping_file = Path("data/indices/category-products.json")
        product_counts = {}
        if mapping_file.exists():
            with open(mapping_file, 'r', encoding='utf-8') as f:
                mapping = json.load(f)
                for cat_id, products in mapping.items():
                    product_counts[int(cat_id)] = len(products)
        
        # Generate content for each category
        output_dir = Path("data/ai-generated/categories")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        generated_categories = []
        
        for category in categories:
            try:
                cat_id = category.get('id')
                products_count = product_counts.get(cat_id, 0)
                
                # Skip categories with no products
                if products_count == 0:
                    print(f"[SKIP] {category.get('name')} - no products")
                    continue
                
                # Generate content
                category_content = self.generate_category_content(category, products_count)
                
                # Save individual category file
                output_file = output_dir / f"category_{cat_id}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(category_content, f, ensure_ascii=False, indent=2)
                
                generated_categories.append(category_content)
                print(f"[SAVED] {category.get('name')} -> {output_file}")
                
            except Exception as e:
                print(f"[ERROR] Failed to process category {category.get('name')}: {e}")
        
        # Save combined file
        combined_file = output_dir / "all_categories.json"
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(generated_categories, f, ensure_ascii=False, indent=2)
        
        print(f"\n[COMPLETE] Generated content for {len(generated_categories)} categories")
        print(f"[SAVED] Combined file: {combined_file}")
        
        return generated_categories

def main():
    parser = argparse.ArgumentParser(description='Generate AI content for categories')
    parser.add_argument('--api-key', help='OpenAI API key')
    
    args = parser.parse_args()
    
    generator = CategoryContentGenerator(api_key=args.api_key)
    generator.process_categories()

if __name__ == "__main__":
    main() 