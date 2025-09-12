#!/usr/bin/env python3

import requests

def test_amazon_api():
    print("=== Testing Amazon France API with correct marketplace ID ===")
    
    url = "https://completion.amazon.fr/api/2017/suggestions"
    params = {
        "mid": "A13V1IB3VIYZZH",  # Correct French marketplace ID
        "alias": "aps", 
        "prefix": "friteuse"
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"URL: {response.url}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Success! Found {len(data.get('suggestions', []))} suggestions")
                for i, suggestion in enumerate(data.get('suggestions', [])[:5], 1):
                    print(f"  {i}. {suggestion.get('value', 'N/A')}")
            except:
                print("Response is not valid JSON")
                print(f"Response Text: {response.text[:300]}")
        else:
            print(f"Response Text: {response.text[:300]}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_amazon_api() 