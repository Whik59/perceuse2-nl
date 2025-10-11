#!/usr/bin/env python3
import os
import json

def check_current_status():
    total = 0
    enhanced = 0
    not_enhanced = 0
    
    for f in os.listdir('data/products'):
        if f.endswith('.json'):
            total += 1
            try:
                with open(f'data/products/{f}', 'r', encoding='utf-8') as file:
                    p = json.load(file)
                    if p.get('enhanced'):
                        enhanced += 1
                    else:
                        not_enhanced += 1
            except:
                pass
    
    print(f'📊 Current Status:')
    print(f'   Total products: {total}')
    print(f'   Enhanced: {enhanced}')
    print(f'   Not enhanced: {not_enhanced}')
    print(f'   Missing: {total - enhanced - not_enhanced}')

if __name__ == "__main__":
    check_current_status()
