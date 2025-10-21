#!/usr/bin/env python3
"""
Amazon Affiliate Logo Generator

Generates modern, Professional 3D logos using Google's Gemini AI models.
Uses Amazon theme colors (orange, dark blue, white) for affiliate branding.
Supports keyword-based designs for e-commerce.
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

def get_amazon_colors():
    """Get Amazon theme color scheme."""
    return {
        'primary': '#FF9900',  # Amazon Orange
        'secondary': '#232F3E',  # Amazon Dark Blue
        'accent': '#FFFFFF',  # White
        'gradient_start': '#FF9900',  # Orange
        'gradient_end': '#E8890E'  # Darker Orange
    }

def create_logo_prompt(keyword, country):
    """Create a comprehensive prompt for logo generation."""
    
    colors = get_amazon_colors()
    
    prompt = f"""
Create a MASSIVE, bold logo for an Amazon affiliate {keyword} company that fills 90-95% of the entire canvas space!

CRITICAL SIZE REQUIREMENTS:
- The logo must fill 90-95% of the entire image canvas
- Minimize white space - the logo should extend nearly to all edges
- Make the logo elements large and prominent, not small and centered
- Use the full width and height of the image space
- NO small logo in center with lots of white space
- Logo should be BIG and fill the frame

DESIGN REQUIREMENTS:
- Modern, Professional, and stylish 3D design
- Focus on the {keyword} theme with Amazon affiliate branding
- Use Amazon theme colors: Primary {colors['primary']} (Amazon Orange), Secondary {colors['secondary']} (Amazon Dark Blue), Accent {colors['accent']} (White)
- Incorporate orange gradient from {colors['gradient_start']} to {colors['gradient_end']}
- Clean white background with minimal margins
- No text or letters - pure visual logo only
- Professional and clean appearance
- Suitable for Amazon affiliate e-commerce branding
- Amazon-inspired design elements and color scheme

VISUAL STYLE:
- 3D rendered appearance with depth and dimension
- Sleek, modern Amazon-inspired aesthetic
- High contrast for visibility
- Professional Amazon color scheme (orange, dark blue, white)
- Clean lines and shapes
- Professional elements with Amazon affiliate theme
- MASSIVE SCALE DESIGN - logo should fill almost the entire canvas
- Bold, imposing presence that touches the edges
- Almost no white space - logo should be huge and fill 90-95% of the image
- Edge-to-edge design with minimal margins
- Logo elements should touch or nearly touch the edges
- Use negative space creatively rather than leaving empty areas
- Amazon-style gradients and modern design elements

TECHNICAL SPECS:
- High resolution (512x512 pixels minimum)
- PNG format with white background
- Vector-style design that scales well
- Optimized for web and print use
- Professional quality suitable for Amazon affiliate branding

Create a compelling logo that represents {keyword} with Amazon theme colors and modern 3D styling. The logo must be HUGE and fill almost the entire canvas with minimal white space - make it massive and bold! Think Amazon affiliate branding with orange and dark blue colors, not small centered logo!
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
    Generate a logo using Gemini AI with Amazon theme colors and keyword theme.
    """
    parser = argparse.ArgumentParser(description="Generate a logo using Gemini AI with Amazon theme colors.")
    parser.add_argument('keyword', type=str, help="Main keyword/theme for the logo (e.g., drones, headphones)")
    parser.add_argument('country', type=str, help="Country for reference (e.g., france, germany, spain)")
    parser.add_argument('--output', type=str, default='public/logo.png', help="Output path for the logo (default: public/logo.png)")
    
    args = parser.parse_args()
    
    print(f"🎨 Gemini Nano Banana Logo Generator")
    print(f"📝 Keyword: {args.keyword}")
    print(f"🌍 Country: {args.country}")
    print(f"🎨 Theme: Amazon affiliate colors (Orange, Dark Blue, White)")
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
