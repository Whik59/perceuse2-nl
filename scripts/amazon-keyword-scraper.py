#!/usr/bin/env python3
"""
Advanced Amazon Keyword Scraper
Scrapes Amazon autocomplete suggestions using advanced anti-detection techniques
"""

import requests
import time
import json
import random
import string
import sys
import asyncio
import aiohttp
import concurrent.futures
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
            '💾': '[SAVE]',
            '🔄': '[RETRY]',
            '🚀': '[START]',
            '🎯': '[TARGET]'
        }
        for unicode_char, replacement in replacements.items():
            message = message.replace(unicode_char, replacement)
    print(message)

class AdvancedAmazonKeywordScraper:
    def __init__(self, base_keyword="friteuse", market="fr"):
        self.base_keyword = base_keyword
        self.market = market
        self.config = self.load_market_config(market)
        self.all_keywords = set()
        
        # User agents for rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        
        # Setup session
        self.session = self.setup_session()
    
    def setup_session(self):
        """Setup session with proper headers"""
        session = requests.Session()
        
        # Headers to mimic real browser with market-specific language
        session.headers.update({
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': f'{self.config["locale"]},{self.config["language"][:2]};q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        })
        
        return session
    

    
    def load_market_config(self, market):
        """Load market configuration from config file"""
        try:
            import os
            config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'markets.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                markets_config = json.load(f)
            
            if market not in markets_config['markets']:
                safe_print(f"[WARNING] Market '{market}' not found, using default 'fr'")
                market = markets_config['default_market']
            
            return markets_config['markets'][market]
        except Exception as e:
            safe_print(f"[ERROR] Could not load market config: {e}")
            # Fallback to French market
            return {
                "name": "France",
                "amazon_tld": ".fr",
                "language": "french",
                "locale": "fr-FR",
                "currency": "EUR"
            }
    

    
    def get_amazon_suggestions(self, search_term):
        """Get autocomplete suggestions from Amazon"""
        url = f"https://completion.amazon{self.config['amazon_tld']}/api/2017/suggestions"
        
        params = {
            "mid": self.get_marketplace_id(),
            "alias": "aps",
            "prefix": search_term
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
                        base_lower = self.base_keyword.lower()
                        # Only include keywords that start with base keyword and are not just the base keyword
                        if keyword and keyword.startswith(base_lower) and keyword != base_lower:
                            suggestions.append(keyword)
            
            return suggestions
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to get suggestions for '{search_term}': {e}")
            return []
    
    def get_marketplace_id(self):
        """Get marketplace ID for the current market"""
        marketplace_ids = {
            ".fr": "A13V1IB3VIYZZH",  # Correct marketplace ID for France
            ".de": "A1PA6795UKMFR9", 
            ".es": "A1RKKUPIHCS9HS",
            ".it": "APJ6JRA9NG5V4",
            ".nl": "A1805IZSGTT6HS",
            ".pl": "A1C3SOZRARQ6R3",
            ".se": "A2NODRKZP88ZB9",
            ".com": "ATVPDKIKX0DER",
            ".ca": "A2EUQ1WTGCTBG2",
            ".com.mx": "A1AM78C64UM0Y8",
            ".com.br": "A2Q3Y263D00KWC",
            ".co.uk": "A1F83G8C2ARO7P",
            ".be": "AMEN7PMS3EDWL",
            ".co.za": "AE08WJ6YKNBMC",
            ".eg": "ARBP9OOSHTCHU",
            ".com.tr": "A33AVAJ2PDY3EV",
            ".sa": "A17E79C6D8DWNP",
            ".ae": "A2VIGQ35RCS4UG",
            ".in": "A21TJRUUN4KGV"
        }
        return marketplace_ids.get(self.config['amazon_tld'], "A13V1IB3VIYZZH")
    
    def generate_stage1_patterns(self):
        """Generate Stage 1 patterns: comprehensive search to find all main categories"""
        search_patterns = []
        
        # Single letters (a-z)
        for letter in string.ascii_lowercase:
            search_patterns.append(f"{self.base_keyword} {letter}")
        
        # Two-letter combinations (comprehensive approach)
        vowels = ['a', 'e', 'i', 'o', 'u']
        common_consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v']
        
        # Vowel + consonant combinations
        for vowel in vowels:
            for consonant in common_consonants:
                search_patterns.append(f"{self.base_keyword} {vowel}{consonant}")
        
        # Consonant + vowel combinations
        for consonant in common_consonants:
            for vowel in vowels:
                search_patterns.append(f"{self.base_keyword} {consonant}{vowel}")
        
        # Common consonant + consonant combinations
        consonant_pairs = [
            # Common blends with 'l'
            'bl', 'cl', 'fl', 'gl', 'pl', 'sl',
            # Common blends with 'r'  
            'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
            # 's' combinations
            'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw',
            # Other common pairs
            'ch', 'gh', 'ph', 'th', 'wh', 'wr',
            # Additional useful combinations
            'dw', 'gn', 'kn', 'mb', 'mp', 'nd', 'ng', 'nk', 'nt',
            'pt', 'qu', 'rh', 'rn', 'rt', 'sch', 'tch', 'tw'
        ]
        
        for pair in consonant_pairs:
            search_patterns.append(f"{self.base_keyword} {pair}")
        
        return search_patterns
    
    def generate_stage2_patterns(self, main_categories):
        """Generate Stage 2 patterns: expand each main category with letters"""
        search_patterns = []
        
        for category in main_categories:
            # Add single letters to each main category
            for letter in string.ascii_lowercase:
                search_patterns.append(f"{category} {letter}")
        
        return search_patterns
    
    def filter_to_two_words(self, keywords):
        """Filter keywords to keep only 2-word combinations (main categories)"""
        two_word_keywords = []
        base_lower = self.base_keyword.lower()
        
        for keyword in keywords:
            words = keyword.strip().split()
            # Keep only keywords with exactly 2 words that start with base keyword
            if len(words) == 2 and words[0].lower() == base_lower:
                two_word_keywords.append(keyword)
        
        return list(set(two_word_keywords))  # Remove duplicates

    async def scrape_2_stage_async(self, max_concurrent=10):
        """2-Stage async scraping: Stage 1 for main categories, Stage 2 for subcategories"""
        safe_print(f"[SEARCH] 2-Stage scraping for: {self.base_keyword}")
        safe_print(f"[TARGET] Market: {self.config['name']} ({self.config['amazon_tld']})")
        
        # STAGE 1: Get main categories (2-word combinations)
        safe_print(f"\n=== STAGE 1: Finding Main Categories ===")
        stage1_patterns = self.generate_stage1_patterns()
        safe_print(f"[STATS] Stage 1: {len(stage1_patterns)} patterns with {max_concurrent} concurrent requests")
        
        stage1_keywords = set()
        batch_size = max_concurrent
        
        async with aiohttp.ClientSession() as session:
            # Process Stage 1
            for i in range(0, len(stage1_patterns), batch_size):
                batch = stage1_patterns[i:i+batch_size]
                safe_print(f"[SEARCH] Stage 1 batch {i//batch_size + 1}/{(len(stage1_patterns) + batch_size - 1)//batch_size}")
                
                tasks = [self.get_amazon_suggestions_async(session, pattern) for pattern in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, tuple):
                        pattern, suggestions = result
                        if suggestions:
                            for keyword in suggestions:
                                stage1_keywords.add(keyword)
                            safe_print(f"  [OK] '{pattern}': {len(suggestions)} suggestions")
                        else:
                            safe_print(f"  [WARNING] '{pattern}': No suggestions")
                
                await asyncio.sleep(0.5)
            
            # Filter to get main categories (2-word combinations only)
            main_categories = self.filter_to_two_words(list(stage1_keywords))
            safe_print(f"\n[STAGE1] Found {len(main_categories)} main categories:")
            for i, category in enumerate(sorted(main_categories)[:10], 1):  # Show first 10
                safe_print(f"  {i}. {category}")
            if len(main_categories) > 10:
                safe_print(f"  ... and {len(main_categories) - 10} more")
            
            # STAGE 2: Expand each main category
            safe_print(f"\n=== STAGE 2: Finding Subcategories ===")
            if main_categories:
                stage2_patterns = self.generate_stage2_patterns(main_categories)
                safe_print(f"[STATS] Stage 2: {len(stage2_patterns)} patterns from {len(main_categories)} main categories")
                
                # Process Stage 2
                for i in range(0, len(stage2_patterns), batch_size):
                    batch = stage2_patterns[i:i+batch_size]
                    safe_print(f"[SEARCH] Stage 2 batch {i//batch_size + 1}/{(len(stage2_patterns) + batch_size - 1)//batch_size}")
                    
                    tasks = [self.get_amazon_suggestions_async(session, pattern) for pattern in batch]
                    batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    for result in batch_results:
                        if isinstance(result, tuple):
                            pattern, suggestions = result
                            if suggestions:
                                new_keywords = 0
                                for keyword in suggestions:
                                    if keyword not in self.all_keywords:
                                        self.all_keywords.add(keyword)
                                        new_keywords += 1
                                if new_keywords > 0:
                                    safe_print(f"  [OK] '{pattern}': {len(suggestions)} suggestions ({new_keywords} new)")
                    
                    await asyncio.sleep(0.5)
            
            # Add main categories to final results
            for category in main_categories:
                self.all_keywords.add(category)
        
        safe_print(f"\n[FINAL] Total keywords found: {len(self.all_keywords)}")
        return list(self.all_keywords)

    async def get_amazon_suggestions_async(self, session, search_term):
        """Async version of get_amazon_suggestions"""
        url = f"https://completion.amazon{self.config['amazon_tld']}/api/2017/suggestions"
        
        params = {
            "mid": self.get_marketplace_id(),
            "alias": "aps",
            "prefix": search_term
        }
        
        headers = {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': f'{self.config["locale"]},{self.config["language"][:2]};q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        }
        
        try:
            async with session.get(url, params=params, headers=headers, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    suggestions = []
                    
                    if 'suggestions' in data:
                        for suggestion in data['suggestions']:
                            if 'value' in suggestion:
                                keyword = suggestion['value'].strip().lower()
                                base_lower = self.base_keyword.lower()
                                # Only include keywords that start with base keyword and are not just the base keyword
                                if keyword and keyword.startswith(base_lower) and keyword != base_lower:
                                    suggestions.append(keyword)
                    
                    return search_term, suggestions
                else:
                    return search_term, []
                    
        except Exception as e:
            safe_print(f"[ERROR] Failed to get suggestions for '{search_term}': {e}")
            return search_term, []

    async def scrape_with_letters_async(self, max_concurrent=10):
        """Fast async scraping with concurrent requests"""
        safe_print(f"[SEARCH] Fast scraping for: {self.base_keyword}")
        safe_print(f"[TARGET] Market: {self.config['name']} ({self.config['amazon_tld']})")
        
        # Enhanced search patterns for maximum keyword discovery
        search_patterns = self.generate_enhanced_search_patterns()
        
        total_patterns = len(search_patterns)
        safe_print(f"[STATS] Will search {total_patterns} patterns with {max_concurrent} concurrent requests")
        
        # Process in batches to avoid overwhelming the server
        batch_size = max_concurrent
        all_results = []
        
        async with aiohttp.ClientSession() as session:
            for i in range(0, len(search_patterns), batch_size):
                batch = search_patterns[i:i+batch_size]
                safe_print(f"[SEARCH] Processing batch {i//batch_size + 1}/{(total_patterns + batch_size - 1)//batch_size}")
                
                # Create tasks for this batch
                tasks = []
                for pattern in batch:
                    task = self.get_amazon_suggestions_async(session, pattern)
                    tasks.append(task)
                
                # Execute batch concurrently
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results
                for result in batch_results:
                    if isinstance(result, tuple):
                        pattern, suggestions = result
                        if suggestions:
                            new_keywords = 0
                            for keyword in suggestions:
                                if keyword not in self.all_keywords:
                                    self.all_keywords.add(keyword)
                                    new_keywords += 1
                            safe_print(f"  [OK] '{pattern}': {len(suggestions)} suggestions ({new_keywords} new)")
                        else:
                            safe_print(f"  [WARNING] '{pattern}': No suggestions")
                    else:
                        safe_print(f"  [ERROR] Exception in batch: {result}")
                
                # Small delay between batches
                if i + batch_size < len(search_patterns):
                    await asyncio.sleep(random.uniform(0.5, 1.5))
        
        safe_print(f"[STATS] Total unique keywords collected: {len(self.all_keywords)}")
        return list(self.all_keywords)

    def scrape_with_letters_parallel(self, max_workers=5):
        """Fast parallel scraping using ThreadPoolExecutor"""
        safe_print(f"[SEARCH] Parallel scraping for: {self.base_keyword}")
        safe_print(f"[TARGET] Market: {self.config['name']} ({self.config['amazon_tld']})")
        
        # Enhanced search patterns for maximum keyword discovery
        search_patterns = self.generate_enhanced_search_patterns()
        
        total_patterns = len(search_patterns)
        safe_print(f"[STATS] Will search {total_patterns} patterns with {max_workers} parallel workers")
        
        def process_pattern(pattern):
            """Process a single pattern"""
            suggestions = self.get_amazon_suggestions(pattern)
            return pattern, suggestions
        
        # Process patterns in parallel batches
        batch_size = max_workers * 2
        
        for i in range(0, len(search_patterns), batch_size):
            batch = search_patterns[i:i+batch_size]
            safe_print(f"[SEARCH] Processing batch {i//batch_size + 1}/{(total_patterns + batch_size - 1)//batch_size}")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_pattern = {executor.submit(process_pattern, pattern): pattern for pattern in batch}
                
                for future in concurrent.futures.as_completed(future_to_pattern):
                    try:
                        pattern, suggestions = future.result()
                        if suggestions:
                            new_keywords = 0
                            for keyword in suggestions:
                                if keyword not in self.all_keywords:
                                    self.all_keywords.add(keyword)
                                    new_keywords += 1
                            safe_print(f"  [OK] '{pattern}': {len(suggestions)} suggestions ({new_keywords} new)")
                        else:
                            safe_print(f"  [WARNING] '{pattern}': No suggestions")
                    except Exception as exc:
                        pattern = future_to_pattern[future]
                        safe_print(f"  [ERROR] '{pattern}' failed: {exc}")
            
            # Small delay between batches
            if i + batch_size < len(search_patterns):
                time.sleep(random.uniform(0.5, 1.5))
        
        safe_print(f"[STATS] Total unique keywords collected: {len(self.all_keywords)}")
        return list(self.all_keywords)

    def scrape_with_letters(self):
        """Original sequential scraping (kept for compatibility)"""
        safe_print(f"[SEARCH] Sequential scraping for: {self.base_keyword}")
        safe_print(f"[TARGET] Market: {self.config['name']} ({self.config['amazon_tld']})")
        
        # Enhanced search patterns for maximum keyword discovery
        search_patterns = self.generate_enhanced_search_patterns()
        
        total_patterns = len(search_patterns)
        safe_print(f"[STATS] Will search {total_patterns} patterns sequentially")
        
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
            
            # Reduced rate limiting for speed
            time.sleep(random.uniform(0.3, 0.8))
        
        safe_print(f"[STATS] Total unique keywords collected: {len(self.all_keywords)}")
        return list(self.all_keywords)
    
    def save_keywords(self, keywords, suffix=""):
        """Save keywords to simple keywords.txt file in data folder"""
        import os
        
        # Ensure data directory exists
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        # Save as simple keywords.txt
        txt_file = os.path.join(data_dir, 'keywords.txt')
        with open(txt_file, 'w', encoding='utf-8') as f:
            for keyword in sorted(keywords):
                f.write(f"{keyword}\n")
        
        safe_print(f"[SAVE] Keywords saved to: {txt_file}")
        safe_print(f"[SAVE] Total keywords saved: {len(keywords)}")
        
        return txt_file

    def extract_structured_keywords(self, all_keywords):
        """Extract structured keywords: categories (2 words) and subcategories (3+ words)"""
        safe_print(f"[STRUCTURE] Analyzing {len(all_keywords)} keywords for structure...")
        
        category_keywords = set()  # 2-word combinations (main categories)
        subcategory_keywords = set()  # 3+ word combinations (subcategories)
        base_lower = self.base_keyword.lower()
        
        for keyword in all_keywords:
            words = keyword.strip().split()
            if len(words) < 2:
                continue
                
            # Category: exactly 2 words (e.g., "telefono fijo", "phone case")
            if len(words) == 2:
                category_keywords.add(keyword)
            
            # Subcategory: 3+ words (e.g., "telefono fijo vintage", "phone case leather black")
            elif len(words) >= 3:
                subcategory_keywords.add(keyword)
        
        safe_print(f"[STRUCTURE] Found {len(category_keywords)} category keywords (2-word combinations)")
        safe_print(f"[STRUCTURE] Found {len(subcategory_keywords)} subcategory keywords (3+ word combinations)")
        
        return sorted(category_keywords), sorted(subcategory_keywords)
    
    def save_structured_keywords(self, all_keywords, output_dir="data"):
        """Save keywords in structured format for AI mapper"""
        import os
        import json
        
        category_keywords, subcategory_keywords = self.extract_structured_keywords(all_keywords)
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Save all keywords (for backward compatibility)
        keywords_file = os.path.join(output_dir, "keywords.txt")
        with open(keywords_file, 'w', encoding='utf-8') as f:
            for keyword in sorted(all_keywords):
                f.write(f"{keyword}\n")
        safe_print(f"[SAVE] All keywords saved to: {keywords_file}")
        
        # Save category keywords (2-word combinations)
        categories_file = os.path.join(output_dir, "category_keywords.txt")
        with open(categories_file, 'w', encoding='utf-8') as f:
            for keyword in category_keywords:
                f.write(f"{keyword}\n")
        safe_print(f"[SAVE] Category keywords saved to: {categories_file}")
        
        # Save subcategory keywords (3+ word combinations)  
        subcategories_file = os.path.join(output_dir, "subcategory_keywords.txt")
        with open(subcategories_file, 'w', encoding='utf-8') as f:
            for keyword in subcategory_keywords:
                f.write(f"{keyword}\n")
        safe_print(f"[SAVE] Subcategory keywords saved to: {subcategories_file}")
        
        # Save structured summary
        summary_file = os.path.join(output_dir, "keyword_structure.json")
        structure_data = {
            "base_keyword": self.base_keyword,
            "total_keywords": len(all_keywords),
            "category_keywords": len(category_keywords),
            "subcategory_keywords": len(subcategory_keywords),
            "categories": category_keywords,
            "subcategories": subcategory_keywords
        }
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(structure_data, f, indent=2, ensure_ascii=False)
        safe_print(f"[SAVE] Keyword structure saved to: {summary_file}")
        
        return structure_data

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Advanced Amazon autocomplete keyword scraper")
    parser.add_argument('keyword', nargs='?', default='friteuse', help='Base keyword to search (default: friteuse)')
    parser.add_argument('--market', '-m', default='fr', 
                       choices=['fr', 'de', 'es', 'it', 'nl', 'pl', 'se', 'us'],
                       help='Target market (default: fr)')
    parser.add_argument('--workers', '-w', type=int, default=5, 
                       help='Number of parallel workers (default: 5)')
    parser.add_argument('--mode', '-M', choices=['fast', 'parallel', 'sequential'], default='parallel',
                       help='Scraping mode: fast (async), parallel (threads), sequential (default: parallel)')
    parser.add_argument('--concurrent', '-c', type=int, default=8,
                       help='Max concurrent requests for async mode (default: 8)')
    parser.add_argument('--suffix', default='', help='Suffix for output files')
    args = parser.parse_args()
    
    safe_print(f"[START] Advanced Amazon Keyword Scraper v2.0")
    safe_print("=" * 60)
    safe_print(f"[TARGET] Keyword: {args.keyword}")
    safe_print(f"[TARGET] Market: {args.market.upper()}")
    safe_print(f"[TARGET] Mode: {args.mode}")
    if args.mode == 'parallel':
        safe_print(f"[TARGET] Workers: {args.workers}")
    elif args.mode == 'fast':
        safe_print(f"[TARGET] Concurrent: {args.concurrent}")
    
    scraper = AdvancedAmazonKeywordScraper(args.keyword, args.market)
    
    # Display market info
    safe_print(f"[OK] Market: {scraper.config['name']} ({scraper.config['amazon_tld']})")
    safe_print(f"[OK] Language: {scraper.config['language']}")
    
    # Scrape keywords based on mode
    safe_print(f"\n[START] Starting keyword discovery...")
    
    if args.mode == 'fast':
        # 2-Stage async mode - hierarchical keyword discovery
        keywords = asyncio.run(scraper.scrape_2_stage_async(max_concurrent=args.concurrent))
    elif args.mode == 'parallel':
        # Parallel mode - balanced speed and stability
        keywords = scraper.scrape_with_letters_parallel(max_workers=args.workers)
    else:
        # Sequential mode - most stable but slowest
    keywords = scraper.scrape_with_letters()
    
    if keywords:
        # Save results
        safe_print(f"\n[SAVE] Saving results...")
        scraper.save_keywords(keywords, args.suffix)
        
        # Save structured keywords for AI mapper
        output_dir = "../data" if not args.suffix else args.suffix
        structure_data = scraper.save_structured_keywords(keywords, output_dir)
        
        safe_print(f"\n[SUCCESS] Scraping completed! Found {len(keywords)} unique keywords.")
        safe_print(f"�� Category Keywords: {structure_data['category_keywords']}")
        safe_print(f"📂 Subcategory Keywords: {structure_data['subcategory_keywords']}")
        safe_print(f"💾 Files saved to: {args.suffix}/")
        
    else:
        safe_print("[ERROR] No keywords found! Check your network connection and market settings.") 