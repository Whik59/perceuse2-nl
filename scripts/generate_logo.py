#!/usr/bin/env python3
"""
Gemini Nano Banana Logo Generator

Generates modern, Professional 3D logos using Google's Gemini AI models.
Supports country-specific colors and keyword-based designs for e-commerce.
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

def create_logo_prompt(keyword, country):
    """Create a comprehensive prompt for logo generation."""
    
    colors = get_country_colors(country)
    
    prompt = f"""
Create a modern, Professional, and stylish 3D {keyword} logo with {country} colors and a clean white background, ideal for e-commerce, and without any text!

DESIGN REQUIREMENTS:
- Modern, Professional, and stylish 3D design
- Focus on the {keyword} theme
- Use {country} national colors: Primary {colors['primary']}, Secondary {colors['secondary']}, Accent {colors['accent']}
- Clean white background
- No text or letters - pure visual logo only
- Professional and clean appearance
- Suitable for e-commerce branding
- Logo should fill 95% of the canvas space - almost edge-to-edge
- Massive, bold design that touches the edges of the canvas
- Minimal white space - logo should nearly fill the entire image

VISUAL STYLE:
- 3D rendered appearance with depth and dimension
- Sleek, modern aesthetic
- High contrast for visibility
- Professional color scheme
- Clean lines and shapes
- Professional elements
- MASSIVE SCALE DESIGN - logo should fill almost the entire canvas
- Bold, imposing presence that touches the edges
- Almost no white space - logo should be huge and fill 95% of the image
- Edge-to-edge design with minimal margins

TECHNICAL SPECS:
- High resolution (512x512 pixels minimum)
- PNG format with white background
- Vector-style design that scales well
- Optimized for web and print use
- Professional quality suitable for branding

Create a compelling logo that represents {keyword} with {country} colors and modern 3D styling. The logo must be HUGE and fill almost the entire canvas with minimal white space - make it massive and bold!
"""
    
    return prompt

def generate_logo_with_gemini(keyword, country, output_path):
    """Generate logo using Gemini Nano Banana (image generation)."""
    try:
        print(f"🎨 Generating logo with Gemini Nano Banana...")
        print(f"📝 Keyword: {keyword}")
        print(f"🌍 Country: {country}")
        
        if _genai is None:
            print("❌ Gemini client not available. Please install: pip install google-genai")
            return None
            
        api_key = setup_gemini()
        
        # Create the prompt
        prompt = create_logo_prompt(keyword, country)
        
        print("🎨 Generating logo with Gemini Nano Banana...")
        
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
                print("❌ Logo generation failed after multiple retries.")
                return None

            if not response.candidates:
                print("❌ Error: The API response did not contain any candidates.")
                if hasattr(response, 'prompt_feedback'):
                    print(f"   - Prompt Feedback: {response.prompt_feedback}")
                return None

            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    image_bytes = BytesIO(part.inline_data.data)
                    
                    # Resize to 512x512 for logo
                    with Image.open(image_bytes) as img:
                        img = img.resize((512, 512), Image.LANCZOS)
                        # Use absolute path to avoid Windows path issues
                        abs_output_path = os.path.abspath(output_path)
                        img.save(abs_output_path)

                    print(f"🖼️ Logo saved to: {output_path}")
                    return output_path
            
            print("❌ Error: No image data found.")
            return None

        except Exception as e:
            print(f"❌ An unexpected error occurred during logo generation: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating logo: {e}")
        return None


def main():
    """
    Generate a logo using Gemini AI with country colors and keyword theme.
    """
    parser = argparse.ArgumentParser(description="Generate a logo using Gemini AI.")
    parser.add_argument('keyword', type=str, help="Main keyword/theme for the logo (e.g., kopfhörer, headphones)")
    parser.add_argument('country', type=str, help="Country for color scheme (e.g., germany, france, spain)")
    parser.add_argument('--output', type=str, default='public/logo.png', help="Output path for the logo (default: public/logo.png)")
    
    args = parser.parse_args()
    
    print(f"🎨 Gemini Nano Banana Logo Generator")
    print(f"📝 Keyword: {args.keyword}")
    print(f"🌍 Country: {args.country}")
    print(f"📁 Output: {args.output}")
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Generate logo
    result = generate_logo_with_gemini(args.keyword, args.country, args.output)
    
    if result:
        print(f"\n🎉 Logo generation completed!")
        print(f"🖼️ Logo saved: {result}")
        print(f"✨ Real AI-generated logo created with Gemini Nano Banana!")
    else:
        print(f"\n❌ Logo generation failed!")
        print(f"🔧 Please check your Gemini API configuration and try again")
        sys.exit(1)

if __name__ == "__main__":
    main()
