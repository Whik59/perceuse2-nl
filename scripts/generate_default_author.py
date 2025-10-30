#!/usr/bin/env python3
"""
Default Author Image Generator

Generates a default author profile picture for fallback cases.
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys

def create_default_author_image():
    """Create a default author profile picture."""
    try:
        # Create output directory
        output_dir = "public/authors"
        os.makedirs(output_dir, exist_ok=True)
        
        # Create a 512x512 image
        size = (512, 512)
        img = Image.new('RGB', size, color='#f3f4f6')  # Light gray background
        draw = ImageDraw.Draw(img)
        
        # Draw a circle for the profile picture
        circle_size = 400
        circle_x = (size[0] - circle_size) // 2
        circle_y = (size[1] - circle_size) // 2
        
        # Draw background circle
        draw.ellipse([circle_x, circle_y, circle_x + circle_size, circle_y + circle_size], 
                    fill='#e5e7eb', outline='#d1d5db', width=2)
        
        # Draw a simple person icon
        # Head
        head_radius = 60
        head_x = size[0] // 2
        head_y = size[1] // 2 - 40
        draw.ellipse([head_x - head_radius, head_y - head_radius, 
                     head_x + head_radius, head_y + head_radius], 
                    fill='#9ca3af', outline='#6b7280', width=2)
        
        # Body (simple rectangle)
        body_width = 120
        body_height = 100
        body_x = head_x - body_width // 2
        body_y = head_y + head_radius - 10
        draw.rectangle([body_x, body_y, body_x + body_width, body_y + body_height], 
                      fill='#9ca3af', outline='#6b7280', width=2)
        
        # Add "Expert" text
        try:
            # Try to use a system font
            font_size = 24
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        text = "Expert"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        text_x = (size[0] - text_width) // 2
        text_y = body_y + body_height + 20
        
        draw.text((text_x, text_y), text, fill='#374151', font=font)
        
        # Save the image
        output_path = os.path.join(output_dir, 'default-author.png')
        img.save(output_path)
        
        print(f"✅ Default author image created: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"❌ Error creating default author image: {e}")
        return None

def main():
    """Generate default author profile picture."""
    print("🎨 Creating default author profile picture...")
    
    result = create_default_author_image()
    
    if result:
        print("✨ Default author profile picture generated successfully!")
    else:
        print("❌ Failed to generate default author profile picture!")
        sys.exit(1)

if __name__ == "__main__":
    main()
