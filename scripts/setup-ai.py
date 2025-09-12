#!/usr/bin/env python3
"""
Setup script for AI Product Enhancer
Installs dependencies and guides through API key setup
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a Python package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def setup_gemini():
    """Setup Google Gemini AI"""
    print("🤖 Setting up Google Gemini AI...")
    print("=" * 50)
    
    # Install the library
    print("\n📦 Installing Google AI library...")
    if install_package("google-generativeai"):
        print("✅ Google AI library installed successfully!")
    else:
        print("❌ Failed to install Google AI library")
        return False
    
    # Guide user through API key setup
    print("\n🔑 API Key Setup:")
    print("1. Go to: https://makersuite.google.com/app/apikey")
    print("2. Sign in with your Google account")
    print("3. Click 'Create API Key'")
    print("4. Copy the API key")
    print("5. Replace 'YOUR_GEMINI_API_KEY_HERE' in ai-product-enhancer.py with your API key")
    
    print("\n📝 Example:")
    print('   API_KEY = "AIzaSyD..."  # Your actual API key')
    
    # Ask if they want to set it now
    api_key = input("\n🔧 Enter your Gemini API key now (or press Enter to skip): ").strip()
    
    if api_key:
        # Update the script with the API key
        try:
            with open("ai-product-enhancer.py", "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace the placeholder
            updated_content = content.replace(
                'API_KEY = "YOUR_GEMINI_API_KEY_HERE"',
                f'API_KEY = "{api_key}"'
            )
            
            with open("ai-product-enhancer.py", "w", encoding="utf-8") as f:
                f.write(updated_content)
            
            print("✅ API key updated in ai-product-enhancer.py!")
            
        except Exception as e:
            print(f"❌ Failed to update API key: {e}")
            print("Please manually replace 'YOUR_GEMINI_API_KEY_HERE' with your API key")
    
    return True

def test_setup():
    """Test if the setup works"""
    print("\n🧪 Testing setup...")
    
    try:
        import google.generativeai as genai
        print("✅ Google AI library imported successfully!")
        
        # Check if API key is set
        with open("ai-product-enhancer.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        if "YOUR_GEMINI_API_KEY_HERE" not in content:
            print("✅ API key appears to be set!")
        else:
            print("⚠️  API key still needs to be set")
        
        return True
        
    except ImportError:
        print("❌ Google AI library not found")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    print("🚀 AI Product Enhancer Setup")
    print("=" * 40)
    
    # Setup Gemini
    if setup_gemini():
        print("\n✅ Setup completed!")
        
        # Test the setup
        if test_setup():
            print("\n🎉 Everything looks good!")
            print("\n📋 Next steps:")
            print("1. Run: python ai-product-enhancer.py")
            print("2. Choose option 2 to test with a single product")
            print("3. If it works, use option 1 to enhance all products")
        else:
            print("\n⚠️  Setup incomplete. Please check the instructions above.")
    else:
        print("\n❌ Setup failed. Please try again.")

if __name__ == "__main__":
    main() 