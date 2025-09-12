#!/usr/bin/env python3
"""
Simple AI Content Generator for E-commerce
Uses Gemini API to generate SEO-optimized content
"""

import json
import os
import time
import argparse
from datetime import datetime
from pathlib import Path
import requests

class SimpleAIGenerator:
    def __init__(self):
        self.api_key = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
    
    def generate_content(self, prompt, max_tokens=800):
        """Generate content using Gemini API"""
        try:
            url = f"{self.base_url}/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            
            data = {
                "contents": [{
                    "parts": [{
                        "text": f"Tu es un expert en rédaction e-commerce et SEO pour le marché français. {prompt}"
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
            print(f"[ERROR] API request failed: {e}")
            return ""
    
    def process_product(self, product_data):
        """Process a single product"""
        product_name = product_data.get('name', '')
        category = product_data.get('category', '')
        price = product_data.get('price', '')
        
        print(f"[PROCESSING] {product_name[:60]}...")
        
        # Generate SEO title
        title_prompt = f"""
        Réécris ce titre de produit pour le rendre SEO-friendly:
        
        Titre: {product_name}
        Catégorie: {category}
        
        Règles:
        - Maximum 60 caractères
        - Inclure des mots-clés français
        - Format attractif pour l'e-commerce
        
        Réponds uniquement avec le nouveau titre:
        """
        
        seo_title = self.generate_content(title_prompt, 100)
        
        # Generate description
        desc_prompt = f"""
        Crée une description produit e-commerce pour:
        
        Produit: {product_name}
        Prix: {price}€
        
        Structure:
        - Accroche (1-2 phrases)
        - Caractéristiques (3-4 points)
        - Bénéfices (2-3 points)
        
        150-200 mots, format HTML simple:
        """
        
        description = self.generate_content(desc_prompt, 400)
        
        # Generate simple FAQ
        faq_prompt = f"""
        Crée 3 questions-réponses simples pour: {product_name}
        
        Questions sur:
        1. Capacité/portions
        2. Facilité d'utilisation
        3. Nettoyage
        
        Format simple, une question par ligne:
        Q: Question 1?
        R: Réponse 1
        
        Q: Question 2?
        R: Réponse 2
        
        Q: Question 3?
        R: Réponse 3
        """
        
        faq_text = self.generate_content(faq_prompt, 400)
        
        # Update product data
        if seo_title:
            product_data['seo_title'] = seo_title
            product_data['title'] = seo_title
            # Generate slug from title
            slug = seo_title.lower()
            slug = slug.replace(' ', '-').replace('à', 'a').replace('é', 'e').replace('è', 'e')
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            product_data['slug'] = slug
        
        if description:
            product_data['ai_description'] = description
            product_data['description'] = description
        
        if faq_text:
            product_data['faq_text'] = faq_text
        
        product_data['ai_updated'] = datetime.now().isoformat()
        
        return product_data
    
    def process_all_products(self, sample_count=None):
        """Process all products"""
        products_dir = Path("data/products")
        output_dir = Path("data/ai-generated")
        output_dir.mkdir(exist_ok=True)
        
        product_files = list(products_dir.glob("*.json"))
        
        if sample_count:
            product_files = product_files[:sample_count]
        
        print(f"[START] Processing {len(product_files)} products")
        
        processed = 0
        for product_file in product_files:
            try:
                with open(product_file, 'r', encoding='utf-8') as f:
                    product_data = json.load(f)
                
                # Process product
                updated_product = self.process_product(product_data)
                
                # Save to output directory
                output_file = output_dir / product_file.name
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(updated_product, f, ensure_ascii=False, indent=2)
                
                processed += 1
                print(f"[SAVED] {product_file.name}")
                
                # Rate limiting
                time.sleep(1)
                
            except Exception as e:
                print(f"[ERROR] Failed to process {product_file.name}: {e}")
        
        print(f"[COMPLETE] Processed {processed} products")
        return processed

def main():
    parser = argparse.ArgumentParser(description='Simple AI Content Generator')
    parser.add_argument('--sample', type=int, help='Process only N products')
    
    args = parser.parse_args()
    
    generator = SimpleAIGenerator()
    generator.process_all_products(args.sample)

if __name__ == "__main__":
    main() 