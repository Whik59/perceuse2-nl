#!/usr/bin/env python3
"""
Gemini Nano Banana Hero Image Generator

Generates high-quality e-commerce hero images using Google's Gemini AI models.
Supports different page types (home, category, product) with keyword-based designs.
"""

import sys
import os
import argparse
import json
import requests
from PIL import Image
import time
from io import BytesIO

# Gemini import
try:
    from google import genai as _genai
    from google.genai import types
except Exception:
    _genai = None
    types = None

def setup_gemini():
    """Initialize the Gemini API with the API key."""
    try:
        # Use the API key from your existing configuration
        API_KEY = "AIzaSyAz-2QpjTB17-iJNVGZm1DRVO6HUmxV6rg"
        
        if not API_KEY or API_KEY == "YOUR_GEMINI_API_KEY_HERE":
            print("❌ Error: GEMINI_API_KEY not found. Please check your configuration.")
            sys.exit(1)
            
        return API_KEY
        
    except Exception as e:
        print(f"❌ Error setting up Gemini API: {e}")
        sys.exit(1)

def get_country_colors(country):
    """Get country-specific color schemes."""
    country_colors = {
        'germany': {
            'primary': '#000000',  # Black
            'secondary': '#DD0000',  # Red
            'accent': '#FFCE00'  # Gold
        },
        'france': {
            'primary': '#002395',  # Blue
            'secondary': '#FFFFFF',  # White
            'accent': '#ED2939'  # Red
        },
        'spain': {
            'primary': '#C60B1E',  # Red
            'secondary': '#FFC400',  # Yellow
            'accent': '#FFFFFF'  # White
        },
        'italy': {
            'primary': '#009246',  # Green
            'secondary': '#FFFFFF',  # White
            'accent': '#CE2B37'  # Red
        },
        'netherlands': {
            'primary': '#AE1C28',  # Red
            'secondary': '#FFFFFF',  # White
            'accent': '#21468B'  # Blue
        },
        'poland': {
            'primary': '#DC143C',  # Red
            'secondary': '#FFFFFF',  # White
            'accent': '#000000'  # Black
        },
        'sweden': {
            'primary': '#006AA7',  # Blue
            'secondary': '#FECC00',  # Yellow
            'accent': '#FFFFFF'  # White
        },
        'usa': {
            'primary': '#B22234',  # Red
            'secondary': '#FFFFFF',  # White
            'accent': '#3C3B6E'  # Blue
        },
        'uk': {
            'primary': '#012169',  # Blue
            'secondary': '#FFFFFF',  # White
            'accent': '#C8102E'  # Red
        },
        'canada': {
            'primary': '#FF0000',  # Red
            'secondary': '#FFFFFF',  # White
            'accent': '#000000'  # Black
        }
    }
    
    return country_colors.get(country.lower(), {
        'primary': '#2563EB',  # Blue
        'secondary': '#FFFFFF',  # White
        'accent': '#F59E0B'  # Amber
    })

def create_hero_prompt(keyword, page_type):
    """Create a comprehensive prompt for hero image generation."""
    
    # Different prompts based on page type
    if page_type == "home":
        prompt = f"""
Create a high-quality e-commerce hero image displaying a curated arrangement of {keyword} items on a pure white background. Use Amazon-style aesthetics — clean, realistic, minimalistic, with bright highlights and soft shadows.

DESIGN REQUIREMENTS:
- High-quality e-commerce hero image
- Curated arrangement of {keyword} items
- Pure white background
- Amazon-style aesthetics: clean, realistic, minimalistic
- Bright highlights and soft shadows
- Products positioned with natural spacing and balance
- Photographed from a straight-on or slightly side-angled view
- No text, no logos, no people
- Focus on realism, sharp details, and professional studio lighting
- Soft reflections and professional product photography
- 8K product photography quality

VISUAL STYLE:
- Clean, realistic, minimalistic design
- Professional studio lighting
- Soft shadows and bright highlights
- Natural spacing between products
- Sharp details and high resolution
- Amazon-style product arrangement
- Professional e-commerce photography

TECHNICAL SPECS:
- High resolution (1024x1024 pixels minimum)
- PNG format with white background
- Professional quality suitable for e-commerce
- Optimized for web use
- Sharp, detailed product photography

Create a compelling hero image that showcases {keyword} products with professional Amazon-style aesthetics.
"""
    
    elif page_type == "category":
        prompt = f"""
Create a high-quality e-commerce hero image displaying a curated arrangement of {keyword} items on a pure white background. Use Amazon-style aesthetics — clean, realistic, minimalistic, with bright highlights and soft shadows.

DESIGN REQUIREMENTS:
- High-quality e-commerce hero image for category page
- Curated arrangement of {keyword} items
- Pure white background
- Amazon-style aesthetics: clean, realistic, minimalistic
- Bright highlights and soft shadows
- Products positioned with natural spacing and balance
- Photographed from a straight-on or slightly side-angled view
- No text, no logos, no people
- Focus on realism, sharp details, and professional studio lighting
- Soft reflections and professional product photography
- 8K product photography quality
- Category-focused product selection

VISUAL STYLE:
- Clean, realistic, minimalistic design
- Professional studio lighting
- Soft shadows and bright highlights
- Natural spacing between products
- Sharp details and high resolution
- Amazon-style product arrangement
- Professional e-commerce photography
- Category-specific product focus

TECHNICAL SPECS:
- High resolution (1024x1024 pixels minimum)
- PNG format with white background
- Professional quality suitable for e-commerce
- Optimized for web use
- Sharp, detailed product photography

Create a compelling hero image that showcases {keyword} products with professional Amazon-style aesthetics, perfect for category pages.
"""
    
    elif page_type == "product":
        prompt = f"""
Create a high-quality e-commerce hero image displaying a curated arrangement of {keyword} items on a pure white background. Use Amazon-style aesthetics — clean, realistic, minimalistic, with bright highlights and soft shadows.

DESIGN REQUIREMENTS:
- High-quality e-commerce hero image for product page
- Curated arrangement of {keyword} items
- Pure white background
- Amazon-style aesthetics: clean, realistic, minimalistic
- Bright highlights and soft shadows
- Products positioned with natural spacing and balance
- Photographed from a straight-on or slightly side-angled view
- No text, no logos, no people
- Focus on realism, sharp details, and professional studio lighting
- Soft reflections and professional product photography
- 8K product photography quality
- Product-focused detailed view

VISUAL STYLE:
- Clean, realistic, minimalistic design
- Professional studio lighting
- Soft shadows and bright highlights
- Natural spacing between products
- Sharp details and high resolution
- Amazon-style product arrangement
- Professional e-commerce photography
- Product-specific detailed focus

TECHNICAL SPECS:
- High resolution (1024x1024 pixels minimum)
- PNG format with white background
- Professional quality suitable for e-commerce
- Optimized for web use
- Sharp, detailed product photography

Create a compelling hero image that showcases {keyword} products with professional Amazon-style aesthetics, perfect for product pages.
"""
    
    return prompt

def generate_hero_with_gemini(keyword, page_type, output_path):
    """Generate hero image using Gemini Nano Banana (image generation)."""
    try:
        print(f"🎨 Generating hero image with Gemini Nano Banana...")
        print(f"📝 Keyword: {keyword}")
        print(f"📄 Page Type: {page_type}")
        
        if _genai is None:
            print("❌ Gemini client not available. Please install: pip install google-genai")
            return None
            
        api_key = setup_gemini()
        
        # Create the prompt
        prompt = create_hero_prompt(keyword, page_type)
        
        print("🎨 Generating hero image with Gemini Nano Banana...")
        
        try:
            client = _genai.Client(api_key=api_key)

            # Define safety settings to prevent content blocking
            safety_settings = [
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
            ]

            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = client.models.generate_content(
                        model="gemini-2.5-flash-image-preview",
                        contents=[prompt],
                        config=types.GenerateContentConfig(
                            safety_settings=safety_settings
                        )
                    )
                    # If successful, break the loop
                    break
                except Exception as e:
                    if "500" in str(e) and attempt < max_retries - 1:
                        print(f"⚠️ Server error (500) encountered. Retrying in 5 seconds... ({attempt + 1}/{max_retries})")
                        time.sleep(5)
                        continue
                    else:
                        raise e
            else:
                print("❌ Hero image generation failed after multiple retries.")
                return None

            if not response.candidates:
                print("❌ Error: The API response did not contain any candidates.")
                if hasattr(response, 'prompt_feedback'):
                    print(f"   - Prompt Feedback: {response.prompt_feedback}")
                return None

            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    image_bytes = BytesIO(part.inline_data.data)
                    
                    # Resize to 1024x1024 for hero images
                    with Image.open(image_bytes) as img:
                        img = img.resize((1024, 1024), Image.LANCZOS)
                        # Use absolute path to avoid Windows path issues
                        abs_output_path = os.path.abspath(output_path)
                        img.save(abs_output_path)

                    print(f"🖼️ Hero image saved to: {output_path}")
                    return output_path
            
            print("❌ Error: No image data found.")
            return None

        except Exception as e:
            print(f"❌ An unexpected error occurred during hero image generation: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating hero image: {e}")
        return None

def generate_all_hero_images(keyword):
    """Generate all 6 hero images for different page types."""
    
    hero_images = {
        "home": ["hero.png", "hero1.png"],
        "category": ["hero2.png", "hero3.png"],
        "product": ["hero4.png", "hero5.png"]
    }
    
    results = []
    
    for page_type, filenames in hero_images.items():
        print(f"\n🎨 Generating {page_type} hero images...")
        for filename in filenames:
            output_path = f"public/{filename}"
            result = generate_hero_with_gemini(keyword, page_type, output_path)
            if result:
                results.append(result)
                print(f"✅ Generated {filename}")
            else:
                print(f"❌ Failed to generate {filename}")
    
    return results

def main():
    """
    Generate hero images using Gemini AI with keyword theme.
    """
    parser = argparse.ArgumentParser(description="Generate hero images using Gemini AI.")
    parser.add_argument('keyword', type=str, help="Main keyword/theme for the hero images (e.g., massagegeräte, headphones)")
    parser.add_argument('--page-type', type=str, choices=['home', 'category', 'product', 'all'], 
                       default='all', help="Page type to generate images for (default: all)")
    parser.add_argument('--output', type=str, help="Output path for specific image (only used with single page-type)")
    
    args = parser.parse_args()
    
    print(f"🎨 Gemini Nano Banana Hero Image Generator")
    print(f"📝 Keyword: {args.keyword}")
    print(f"📄 Page Type: {args.page_type}")
    
    # Ensure public directory exists
    os.makedirs("public", exist_ok=True)
    
    if args.page_type == "all":
        # Generate all 6 hero images
        results = generate_all_hero_images(args.keyword)
        
        if results:
            print(f"\n🎉 Hero image generation completed!")
            print(f"🖼️ Generated {len(results)} hero images:")
            for result in results:
                print(f"   - {result}")
            print(f"✨ Real AI-generated hero images created with Gemini Nano Banana!")
        else:
            print(f"\n❌ Hero image generation failed!")
            print(f"🔧 Please check your Gemini API configuration and try again")
            sys.exit(1)
    else:
        # Generate single hero image
        if not args.output:
            print("❌ Error: --output is required when specifying a single page-type")
            sys.exit(1)
            
        result = generate_hero_with_gemini(args.keyword, args.page_type, args.output)
        
        if result:
            print(f"\n🎉 Hero image generation completed!")
            print(f"🖼️ Hero image saved: {result}")
            print(f"✨ Real AI-generated hero image created with Gemini Nano Banana!")
        else:
            print(f"\n❌ Hero image generation failed!")
            print(f"🔧 Please check your Gemini API configuration and try again")
            sys.exit(1)

if __name__ == "__main__":
    main()
