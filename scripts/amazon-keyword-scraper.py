#!/usr/bin/env python3
"""
Amazon Keyword Scraper
Scrapes Amazon autocomplete suggestions using letter combinations
"""

import requests
import time
import json
import random
import string
import sys
from datetime import datetime

def safe_print(message):
    """Print message with Unicode characters replaced for Windows compatibility"""
    if sys.platform == "win32":
        replacements = {
            '✅': '[OK]',
            '❌': '[ERROR]',
            '⚠️': '[WARNING]',
            '🔍': '[SEARCH]',
            '📊': '[STATS]',
            '💾': '[SAVE]'
        }
        for unicode_char, replacement in replacements.items():
            message = message.replace(unicode_char, replacement)
    print(message)

class AmazonKeywordScraper:
    def __init__(self, base_keyword="friteuse"):
        self.base_keyword = base_keyword
        self.session = requests.Session()
        self.all_keywords = set()
        
        # Headers to mimic real browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        }
        self.session.headers.update(self.headers)
    
    def get_amazon_suggestions(self, search_term):
        """Get autocomplete suggestions from Amazon.fr"""
        url = "https://completion.amazon.fr/api/2017/suggestions"
        params = {
            "mid": "A13V1INA31Y000", 
            "alias": "aps",
            "prefix": search_term,
            "suggestion-type": ["KEYWORD", "WIDGET"]
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            suggestions = []
            
            if 'suggestions' in data:
                for suggestion in data['suggestions']:
                    if 'value' in suggestion:
                        keyword = suggestion['value'].strip().lower()
                        if keyword and self.base_keyword.lower() in keyword:
                            suggestions.append(keyword)
            
            return suggestions
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to get suggestions for '{search_term}': {e}")
            return []
    
    def scrape_with_letters(self):
        """Scrape suggestions using base keyword + letters"""
        safe_print(f"[SEARCH] Scraping Amazon autocomplete for: {self.base_keyword}")
        
        # Search patterns
        search_patterns = []
        
        # Base keyword alone
        search_patterns.append(self.base_keyword)
        
        # Base keyword + space + letters
        for letter in string.ascii_lowercase:
            search_patterns.append(f"{self.base_keyword} {letter}")
        
        # Base keyword + space + numbers
        for num in range(10):
            search_patterns.append(f"{self.base_keyword} {num}")
        
        # Common combinations
        common_suffixes = [
            "air", "sans huile", "electrique", "professionnelle", "mini", 
            "grande", "pas cher", "promo", "solde", "ninja", "philips", 
            "moulinex", "tefal", "seb", "facile", "rapide"
        ]
        
        for suffix in common_suffixes:
            search_patterns.append(f"{self.base_keyword} {suffix}")
        
        total_patterns = len(search_patterns)
        safe_print(f"[STATS] Will search {total_patterns} patterns")
        
        # Scrape each pattern
        for i, pattern in enumerate(search_patterns, 1):
            safe_print(f"[SEARCH] Pattern {i}/{total_patterns}: '{pattern}'")
            
            suggestions = self.get_amazon_suggestions(pattern)
            
            if suggestions:
                new_keywords = 0
                for keyword in suggestions:
                    if keyword not in self.all_keywords:
                        self.all_keywords.add(keyword)
                        new_keywords += 1
                
                safe_print(f"  [OK] Found {len(suggestions)} suggestions ({new_keywords} new)")
            else:
                safe_print(f"  [WARNING] No suggestions found")
            
            # Rate limiting
            time.sleep(random.uniform(1, 3))
        
        safe_print(f"[STATS] Total unique keywords collected: {len(self.all_keywords)}")
        return list(self.all_keywords)
    
    def save_keywords(self, keywords, suffix=""):
        """Save keywords to files"""
        # Simple consistent names
        base_name = "keywords"
        
        # Save as TXT
        txt_file = f"{base_name}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            for keyword in sorted(keywords):
                f.write(f"{keyword}\n")
        
        # Save as CSV  
        csv_file = f"{base_name}.csv"
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write("keyword\n")
            for keyword in sorted(keywords):
                f.write(f'"{keyword}"\n')
        
        # Save as JSON
        json_file = f"{base_name}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                'base_keyword': self.base_keyword,
                'total_keywords': len(keywords),
                'keywords': sorted(keywords),
                'scraped_at': datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        safe_print(f"[SAVE] Keywords saved:")
        safe_print(f"  TXT: {txt_file}")
        safe_print(f"  CSV: {csv_file}")  
        safe_print(f"  JSON: {json_file}")
        
        return txt_file, csv_file, json_file

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Scrape Amazon autocomplete keywords")
    parser.add_argument('keyword', nargs='?', default='friteuse', help='Base keyword to search (default: friteuse)')
    parser.add_argument('--suffix', default='', help='Suffix for output files')
    args = parser.parse_args()
    
    safe_print(f"[START] Amazon Keyword Scraper")
    safe_print("=" * 50)
    
    scraper = AmazonKeywordScraper(args.keyword)
    
    # Scrape keywords
    keywords = scraper.scrape_with_letters()
    
    if keywords:
        # Save results
        scraper.save_keywords(keywords, args.suffix)
        
        safe_print(f"\n[STATS] FINAL RESULTS:")
        safe_print(f"Base keyword: {args.keyword}")
        safe_print(f"Total keywords: {len(keywords)}")
        safe_print(f"Sample keywords:")
        for keyword in sorted(keywords)[:10]:
            safe_print(f"  - {keyword}")
        if len(keywords) > 10:
            safe_print(f"  ... and {len(keywords) - 10} more")
    else:
        safe_print("[ERROR] No keywords found!") 