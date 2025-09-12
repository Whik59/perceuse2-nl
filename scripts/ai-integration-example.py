#!/usr/bin/env python3
"""
AI Integration Examples
Shows how to integrate the AI Product Enhancer with different AI services.
"""

import json
import requests
import time

class AIServiceIntegration:
    """Examples of integrating with different AI services"""
    
    def __init__(self, config_file="ai-config.json"):
        """Load configuration"""
        with open(config_file, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
    
    # OpenAI Integration
    def openai_request(self, prompt, system_message=None):
        """
        Example OpenAI integration
        Install: pip install openai
        """
        try:
            import openai
            
            # Set API key
            openai.api_key = self.config['ai_service']['api_key']
            
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            
            response = openai.ChatCompletion.create(
                model=self.config['ai_service']['model'],
                messages=messages,
                max_tokens=self.config['ai_service']['max_tokens'],
                temperature=self.config['ai_service']['temperature']
            )
            
            return response.choices[0].message.content.strip()
            
        except ImportError:
            print("[ERROR] OpenAI library not installed. Run: pip install openai")
            return None
        except Exception as e:
            print(f"[ERROR] OpenAI request failed: {e}")
            return None
    
    # Anthropic Claude Integration
    def anthropic_request(self, prompt, system_message=None):
        """
        Example Anthropic Claude integration
        Install: pip install anthropic
        """
        try:
            import anthropic
            
            client = anthropic.Anthropic(
                api_key=self.config['ai_service']['api_key']
            )
            
            full_prompt = f"{system_message}\n\n{prompt}" if system_message else prompt
            
            response = client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=self.config['ai_service']['max_tokens'],
                messages=[{"role": "user", "content": full_prompt}]
            )
            
            return response.content[0].text.strip()
            
        except ImportError:
            print("[ERROR] Anthropic library not installed. Run: pip install anthropic")
            return None
        except Exception as e:
            print(f"[ERROR] Anthropic request failed: {e}")
            return None
    
    # Local Ollama Integration
    def ollama_request(self, prompt, system_message=None, model="llama2"):
        """
        Example Ollama (local AI) integration
        Install Ollama from: https://ollama.ai/
        """
        try:
            url = "http://localhost:11434/api/generate"
            
            full_prompt = f"{system_message}\n\n{prompt}" if system_message else prompt
            
            data = {
                "model": model,
                "prompt": full_prompt,
                "stream": False
            }
            
            response = requests.post(url, json=data, timeout=60)
            response.raise_for_status()
            
            return response.json()['response'].strip()
            
        except requests.exceptions.ConnectionError:
            print("[ERROR] Ollama not running. Start with: ollama serve")
            return None
        except Exception as e:
            print(f"[ERROR] Ollama request failed: {e}")
            return None
    
    # Google Gemini Integration
    def gemini_request(self, prompt, system_message=None):
        """
        Example Google Gemini integration
        Install: pip install google-generativeai
        """
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=self.config['ai_service']['api_key'])
            model = genai.GenerativeModel('gemini-pro')
            
            full_prompt = f"{system_message}\n\n{prompt}" if system_message else prompt
            
            response = model.generate_content(full_prompt)
            return response.text.strip()
            
        except ImportError:
            print("[ERROR] Google AI library not installed. Run: pip install google-generativeai")
            return None
        except Exception as e:
            print(f"[ERROR] Gemini request failed: {e}")
            return None
    
    # Hugging Face Integration
    def huggingface_request(self, prompt, model="microsoft/DialoGPT-medium"):
        """
        Example Hugging Face integration
        Install: pip install transformers torch
        """
        try:
            from transformers import pipeline
            
            generator = pipeline('text-generation', model=model)
            
            response = generator(prompt, max_length=500, num_return_sequences=1)
            return response[0]['generated_text'].replace(prompt, '').strip()
            
        except ImportError:
            print("[ERROR] Transformers library not installed. Run: pip install transformers torch")
            return None
        except Exception as e:
            print(f"[ERROR] Hugging Face request failed: {e}")
            return None

# Example usage in the main AI enhancer
def get_ai_response_integrated(self, prompt, max_retries=3):
    """
    Enhanced AI response method that uses real AI services
    Replace the mock method in ai-product-enhancer.py with this
    """
    ai_service = AIServiceIntegration()
    system_message = self.config.get('prompts', {}).get('system_message', '')
    
    # Try different AI services in order of preference
    ai_methods = [
        ('OpenAI', ai_service.openai_request),
        ('Anthropic', ai_service.anthropic_request),
        ('Ollama', ai_service.ollama_request),
        ('Gemini', ai_service.gemini_request)
    ]
    
    for service_name, method in ai_methods:
        try:
            print(f"[AI] Trying {service_name}...")
            response = method(prompt, system_message)
            
            if response:
                print(f"[AI] Success with {service_name}")
                return response
            
        except Exception as e:
            print(f"[AI] {service_name} failed: {e}")
            continue
    
    # Fallback to mock response if all services fail
    print("[AI] All services failed, using mock response")
    return self.get_mock_response(prompt)

# Installation instructions
INSTALLATION_GUIDE = """
🔧 AI SERVICE SETUP GUIDE

1. OpenAI (Recommended):
   pip install openai
   Get API key: https://platform.openai.com/api-keys
   
2. Anthropic Claude:
   pip install anthropic
   Get API key: https://console.anthropic.com/
   
3. Local Ollama (Free):
   Download: https://ollama.ai/
   Run: ollama pull llama2
   Start: ollama serve
   
4. Google Gemini:
   pip install google-generativeai
   Get API key: https://makersuite.google.com/app/apikey
   
5. Hugging Face (Local):
   pip install transformers torch
   No API key needed

📝 Configuration:
   Edit ai-config.json with your API keys
   Choose your preferred AI service
   Customize prompts for your needs
"""

if __name__ == "__main__":
    print(INSTALLATION_GUIDE) 