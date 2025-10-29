#!/usr/bin/env python3
"""
About Us Hero Image Generator

Generates only the About Us hero image using AI based on keywords and language.
Uses static translations for content, only generates the hero image.
"""

import sys
import os
import argparse
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

def get_language_config(language):
    """Get language-specific configuration."""
    language_configs = {
        'dutch': {
            'language_name': 'Dutch',
            'country': 'Netherlands',
            'tone': 'professionaal en vriendelijk'
        },
        'german': {
            'language_name': 'German',
            'country': 'Germany',
            'tone': 'professionell und freundlich'
        },
        'french': {
            'language_name': 'French',
            'country': 'France',
            'tone': 'professionnel et amical'
        },
        'spanish': {
            'language_name': 'Spanish',
            'country': 'Spain',
            'tone': 'profesional y amigable'
        },
        'english': {
            'language_name': 'English',
            'country': 'United States',
            'tone': 'professional and friendly'
        }
    }
    
    return language_configs.get(language.lower(), language_configs['dutch'])

def create_about_image_prompt(keyword, language_config):
    """Create a prompt for About Us page hero image generation."""
    
    prompt = f"""
Create a professional About Us page hero image for a {keyword} specialist company.

DESIGN REQUIREMENTS:
- Professional business/office setting
- Clean, modern, trustworthy aesthetic
- High-quality e-commerce hero image
- Professional photography style
- Bright, welcoming lighting
- No text, no logos, no people
- Focus on professionalism and expertise

VISUAL ELEMENTS:
- Modern office or workspace environment
- Subtle {keyword} related elements (not prominent)
- Professional color scheme
- Clean, minimalist design
- High-quality studio lighting
- Trustworthy, authoritative feel

TECHNICAL SPECS:
- High resolution (1024x1024 pixels minimum)
- PNG format
- Professional quality suitable for About Us page
- Optimized for web use
- Sharp, detailed photography

Create a compelling hero image that conveys expertise, trust, and professionalism in the {keyword} industry.
"""
    
    return prompt

def generate_about_image(keyword, language, output_path):
    """Generate About Us page hero image using Gemini."""
    try:
        print(f"🎨 Generating About Us hero image...")
        print(f"🔑 Keyword: {keyword}")
        print(f"🌍 Language: {language}")
        
        if _genai is None:
            print("❌ Gemini client not available. Please install: pip install google-genai")
            return None
            
        api_key = setup_gemini()
        language_config = get_language_config(language)
        
        # Create the prompt
        prompt = create_about_image_prompt(keyword, language_config)
        
        print("🎨 Generating hero image with Gemini...")
        
        try:
            client = _genai.Client(api_key=api_key)

            # Define safety settings
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
                    break
                except Exception as e:
                    if "500" in str(e) and attempt < max_retries - 1:
                        print(f"⚠️ Server error (500) encountered. Retrying in 5 seconds... ({attempt + 1}/{max_retries})")
                        time.sleep(5)
                        continue
                    else:
                        raise e
            else:
                print("❌ Image generation failed after multiple retries.")
                return None

            if not response.candidates:
                print("❌ Error: The API response did not contain any candidates.")
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

                    print(f"🖼️ About Us hero image saved to: {output_path}")
                    return output_path
            
            print("❌ Error: No image data found.")
            return None

        except Exception as e:
            print(f"❌ An unexpected error occurred during image generation: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating About Us image: {e}")
        return None

def main():
    """
    Generate About Us page hero image using Gemini AI.
    """
    parser = argparse.ArgumentParser(description="Generate About Us page hero image using Gemini AI.")
    parser.add_argument('keyword', type=str, help="Main keyword/theme for the About Us page (e.g., massagegeräte, headphones)")
    parser.add_argument('--language', type=str, choices=['dutch', 'german', 'french', 'spanish', 'english'], 
                       default='dutch', help="Language for the content (default: dutch)")
    
    args = parser.parse_args()
    
    print(f"🎨 About Us Hero Image Generator")
    print(f"🔑 Keyword: {args.keyword}")
    print(f"🌍 Language: {args.language}")
    
    # Generate image
    print("\n🎨 Generating About Us hero image...")
    os.makedirs("public", exist_ok=True)
    image_path = "public/about-us.png"
    image_result = generate_about_image(args.keyword, args.language, image_path)
    
    if image_result:
        print(f"✅ About Us hero image generated: {image_result}")
        print(f"✨ AI-generated About Us hero image created with Gemini!")
    else:
        print("❌ Failed to generate About Us hero image!")
        sys.exit(1)

if __name__ == "__main__":
    main()
