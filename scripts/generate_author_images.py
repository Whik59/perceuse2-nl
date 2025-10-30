#!/usr/bin/env python3
"""
Author Profile Picture Generator

Generates a single AI profile picture for product page author using Gemini.
Creates a professional headshot saved as author.png in the public directory.
"""

import sys
import os
import argparse
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

def create_author_image_prompt():
    """Create a prompt for author profile picture generation."""
    
    prompt = """
Create a professional headshot portrait of a male product expert and reviewer.

DESIGN REQUIREMENTS:
- Professional business headshot of a man
- Clean, modern, trustworthy appearance
- High-quality portrait photography
- Professional studio lighting
- Neutral, professional background (light gray or white)
- Friendly but authoritative expression
- Business casual attire (dark suit jacket or professional shirt)
- No text, no logos, no company branding

VISUAL ELEMENTS:
- Professional head and shoulders composition
- Clean, neutral background
- Professional lighting setup
- Confident, approachable expression
- Business-appropriate attire
- High-quality portrait photography style
- Professional male appearance

TECHNICAL SPECS:
- Square format (512x512 pixels)
- PNG format
- Professional quality suitable for web use
- Sharp, detailed photography
- Optimized for profile pictures

Create a compelling professional headshot of a male expert that conveys expertise, trust, and authority in product testing and reviews.
"""
    
    return prompt

def generate_author_image(output_path):
    """Generate single author profile picture using Gemini."""
    try:
        print(f"🎨 Generating author profile picture...")
        
        if _genai is None:
            print("❌ Gemini client not available. Please install: pip install google-genai")
            return None
            
        api_key = setup_gemini()
        
        # Create the prompt
        prompt = create_author_image_prompt()
        
        print(f"🎨 Generating profile picture with Gemini...")
        
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
                    
                    # Resize to 512x512 for profile pictures
                    with Image.open(image_bytes) as img:
                        img = img.resize((512, 512), Image.LANCZOS)
                        
                        # Ensure output directory exists
                        output_dir = os.path.dirname(output_path)
                        os.makedirs(output_dir, exist_ok=True)
                        
                        # Use absolute path to avoid Windows path issues
                        abs_output_path = os.path.abspath(output_path)
                        img.save(abs_output_path)

                    print(f"🖼️ Author profile picture saved to: {output_path}")
                    return output_path
            
            print("❌ Error: No image data found.")
            return None

        except Exception as e:
            print(f"❌ An unexpected error occurred during image generation: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating author profile picture: {e}")
        return None

def main():
    """
    Generate single author profile picture as author.png.
    """
    parser = argparse.ArgumentParser(description="Generate AI profile picture for product page author.")
    
    args = parser.parse_args()
    
    print("🎨 Author Profile Picture Generator")
    print("Generating single author.png file...")
    
    # Generate single author.png file in public directory
    output_path = "public/author.png"
    result = generate_author_image(output_path)
    
    if result:
        print(f"✅ Author profile picture generated successfully!")
        print(f"📁 Saved to: {output_path}")
        print("✨ Author profile picture generation complete!")
    else:
        print("❌ Failed to generate author profile picture!")
        sys.exit(1)

if __name__ == "__main__":
    main()
