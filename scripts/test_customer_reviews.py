#!/usr/bin/env python3
"""
Test script to generate customer reviews for a single product
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_product_enhancer import AIProductEnhancer

def test_customer_reviews():
    """Test customer review generation for a single product"""
    
    # Initialize the enhancer
    enhancer = AIProductEnhancer(output_language='spanish')
    
    # Test product data
    product_name = "STARTRC Mini 4 Pro Harde Draagtas Waterdicht"
    features = ["Waterdicht", "Schokbestendig", "Op maat gemaakte compartimenten"]
    price = "39.0"
    specifications = {
        "Materiaal": "Hoge kwaliteit hard plastic",
        "Compatibiliteit": "DJI Mini 3 Pro, DJI Mini 4 Pro",
        "Kenmerken": "Waterdicht, schokbestendig, draagbaar"
    }
    
    print("🤖 Testing Customer Review Generation")
    print("=" * 50)
    print(f"Product: {product_name}")
    print(f"Price: {price}€")
    print(f"Features: {', '.join(features)}")
    print()
    
    try:
        # Generate customer reviews
        customer_reviews = enhancer.generate_customer_reviews_fast(
            product_name, features, price, specifications
        )
        
        print("✅ Generated Customer Reviews:")
        print("-" * 30)
        
        for i, review in enumerate(customer_reviews, 1):
            print(f"\nReview {i}:")
            print(f"Author: {review['author']}")
            print(f"Rating: {'★' * review['rating']} ({review['rating']}/5)")
            print(f"Date: {review['date']}")
            print(f"Verified: {'✅' if review['verified'] else '❌'}")
            print(f"Helpful: {review['helpful']} votes")
            print(f"Text: {review['text']}")
        
        print(f"\n🎉 Successfully generated {len(customer_reviews)} customer reviews!")
        
    except Exception as e:
        print(f"❌ Error generating customer reviews: {e}")

if __name__ == "__main__":
    test_customer_reviews()
