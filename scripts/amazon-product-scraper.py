#!/usr/bin/env python3
"""
Professional Amazon Product Scraper
Uses advanced techniques for reliable product scraping with parallel processing
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import re
from urllib.parse import urljoin
import json
import os
import concurrent.futures
import threading
import sys
from datetime import datetime

# Fix Windows console encoding issues
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except:
        pass

def safe_print(message):
    """Print message with Unicode characters replaced for Windows compatibility"""
    if sys.platform == "win32":
        replacements = {
            '✅': '[OK]',
            '❌': '[ERROR]',
            '⚠️': '[WARNING]',
            '🔄': '[RETRY]',
            '🔍': '[SEARCH]',
            '📊': '[STATS]',
            '🎯': '[TARGET]',
            '💾': '[SAVE]',
            '🚀': '[START]',
            '🏷️': '[CATEGORY]',
            '📄': '[PAGE]',
            '⭐': '[RATING]',
            '💰': '[PRICE]',
            '🎉': '[SUCCESS]'
        }
        for unicode_char, replacement in replacements.items():
            message = message.replace(unicode_char, replacement)
    print(message)

class AmazonScraper:
    def __init__(self, market='fr'):
        # Load market configuration
        self.market = market
        self.config = self.load_market_config(market)
        
        # Conservative parallel processing settings (optimized for testing)
        self.max_workers = 8  # Increased from 2 to 8 for better performance
        
        # MODIFIED: Scrape all categories (flat structure, no subcategories)
        # All categories are main categories and need products
        self.scrape_only_subcategories = False
        
        # Quality filters (relaxed for better coverage)
        self.min_rating = 3.5  # Relaxed from 4.0 to 3.5
        self.min_price = 15    # Relaxed from 20 to 15 (minimum price in local currency)
        
        # Track unique products (thread-safe)
        self.used_asins = set()
        self.used_urls = set()
        self.asins_lock = threading.Lock()
        
        # Results storage
        self.all_products = {}
        
        # Progress tracking
        self.products_saved_count = 0
        self.products_saved_lock = threading.Lock()
        
        # Cache system for better performance
        self.product_cache = {}
        self.search_cache = {}
        self.cache_lock = threading.Lock()
        self.cache_hits = 0
        self.cache_misses = 0
        
        # Rate limiting delays
        self.current_delay = (1, 2)  # Optimized delays (min, max) in seconds
        
        
        # Simple rate limiting tracking
        self.consecutive_503_errors = 0
        
        # Session rotation system - optimized for better performance
        self.request_count = 0
        self.max_requests_per_session = 200  # Rotate session every 200 requests (increased for efficiency)
        self.session_rotation_lock = threading.Lock()
        self.last_rotation_time = time.time()
        
        # Progress tracking and resumption
        self.progress_file = f"scraping_progress_{self.market}.json"
        self.completed_categories = set()
        self.load_progress()
        
        # Setup advanced session
        self.session = self.setup_advanced_session()
        
        # Load categories
        self.categories = self.load_categories()
        
        # User agents for rotation (more diverse)
        self.user_agents = [
            # Windows Chrome
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            # Mac Chrome
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            # Firefox
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
            # Safari
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            # Edge
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            # Mobile
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        ]
        
    def setup_advanced_session(self):
        """Setup session with advanced stealth features"""
        session = requests.Session()
        
        # Advanced headers with proper language for current market
        language_header = self.get_language_header()
        
        # Start with a realistic browser-like base
        session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': language_header,
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        })
        
        # Add realistic cookies for current market
        market_cookies = self.get_market_cookies()
        session.cookies.update(market_cookies)
        
        # Add additional realistic cookies like the working scraper
        session.cookies.update({
            'session-id': '262-1234567-1234567',
            'ubid-acbde': '262-1234567-1234567',
            'i18n-prefs': 'EUR',
            'sp-cdn': f'L5Z9:{self.market.upper()}',
        })
        
        return session
    
    def rotate_session(self):
        """Rotate browser session to avoid detection"""
        with self.session_rotation_lock:
            safe_print(f"  [ROTATION] Rotating browser session...")
            
            # Close current session
            if hasattr(self.session, 'close'):
                self.session.close()
            
            # Wait a bit before creating new session
            time.sleep(random.uniform(2, 5))
            
            # Create new session with different fingerprint
            self.session = self.setup_advanced_session()
            
            # Reset request counter
            self.request_count = 0
            
            # Reset rate limiting counters
            self.consecutive_503_errors = 0
            self.last_rotation_time = time.time()
            
            safe_print(f"  [ROTATION] New session created")
    
    def should_rotate_session(self):
        """Check if session should be rotated"""
        return self.request_count >= self.max_requests_per_session
    
    def simulate_human_behavior(self):
        """Simulate human-like browsing behavior"""
        # Random pause like a human reading
        if random.random() < 0.3:  # 30% chance
            pause = random.uniform(1, 3)
            safe_print(f"  [HUMAN] Reading pause: {pause:.1f}s")
            time.sleep(pause)
        
        # Occasionally longer pause (like checking phone)
        if random.random() < 0.1:  # 10% chance
            pause = random.uniform(5, 10)
            safe_print(f"  [HUMAN] Extended pause: {pause:.1f}s")
            time.sleep(pause)
    
    def get_language_header(self):
        """Get appropriate language header for the current market"""
        language_map = {
            'es': 'es-ES,es;q=0.9,en;q=0.8',
            'fr': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'de': 'de-DE,de;q=0.9,en;q=0.8',
            'it': 'it-IT,it;q=0.9,en;q=0.8',
            'nl': 'nl-NL,nl;q=0.9,en;q=0.8',
            'pl': 'pl-PL,pl;q=0.9,en;q=0.8',
            'se': 'sv-SE,sv;q=0.9,en;q=0.8',
            'com': 'en-US,en;q=0.9'
        }
        return language_map.get(self.market, 'es-ES,es;q=0.9,en;q=0.8')
    
    def get_market_cookies(self):
        """Get appropriate cookies for the current market"""
        session_id = f'262-{random.randint(1000000, 9999999)}-{random.randint(1000000, 9999999)}'
        ubid_suffix = {
            'es': 'acbes', 'fr': 'acbfr', 'de': 'acbde', 'it': 'acbit', 
            'nl': 'acbnl', 'pl': 'acbpl', 'se': 'acbse', 'com': 'acbcom'
        }.get(self.market, 'acbes')
        
        locale_map = {
            'es': 'es_ES', 'fr': 'fr_FR', 'de': 'de_DE', 'it': 'it_IT',
            'nl': 'nl_NL', 'pl': 'pl_PL', 'se': 'sv_SE', 'com': 'en_US'
        }
        
        country_code = {
            'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
            'nl': 'NL', 'pl': 'PL', 'se': 'SE', 'com': 'US'
        }.get(self.market, 'ES')
        
        return {
            'session-id': session_id,
            f'ubid-{ubid_suffix}': f'262-{random.randint(1000000, 9999999)}-{random.randint(1000000, 9999999)}',
            'i18n-prefs': self.config['currency'],
            f'lc-{ubid_suffix}': locale_map.get(self.market, 'es_ES'),
            'sp-cdn': f'L5Z9:{country_code}',
        }
    
    def get_cache_key(self, cache_type, identifier):
        """Generate cache key for different types of data"""
        return f"{cache_type}_{self.market}_{identifier}"
    
    def get_cached_data(self, cache_key):
        """Get data from cache"""
        with self.cache_lock:
            if cache_key in self.product_cache:
                self.cache_hits += 1
                return self.product_cache[cache_key]
            elif cache_key in self.search_cache:
                self.cache_hits += 1
                return self.search_cache[cache_key]
            else:
                self.cache_misses += 1
                return None
    
    def cache_data(self, cache_key, data, cache_type='product'):
        """Cache data with thread safety"""
        with self.cache_lock:
            if cache_type == 'product':
                self.product_cache[cache_key] = data
            elif cache_type == 'search':
                self.search_cache[cache_key] = data
            
            # Limit cache size to prevent memory issues
            if len(self.product_cache) > 1000:
                # Remove oldest entries
                oldest_keys = list(self.product_cache.keys())[:100]
                for key in oldest_keys:
                    del self.product_cache[key]
            
            if len(self.search_cache) > 500:
                # Remove oldest entries
                oldest_keys = list(self.search_cache.keys())[:50]
                for key in oldest_keys:
                    del self.search_cache[key]
    
    def load_progress(self):
        """Load scraping progress from file"""
        try:
            if os.path.exists(self.progress_file):
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    progress_data = json.load(f)
                    self.completed_categories = set(progress_data.get('completed_categories', []))
                    safe_print(f"[PROGRESS] Loaded progress: {len(self.completed_categories)} categories completed")
            else:
                safe_print("[PROGRESS] No previous progress found, starting fresh")
        except Exception as e:
            safe_print(f"[WARNING] Could not load progress: {e}")
            self.completed_categories = set()
    
    def save_progress(self):
        """Save scraping progress to file"""
        try:
            progress_data = {
                'completed_categories': list(self.completed_categories),
                'last_updated': datetime.now().isoformat(),
                'market': self.market,
                'total_products_saved': self.products_saved_count
            }
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress_data, f, indent=2, ensure_ascii=False)
            safe_print(f"[PROGRESS] Saved progress: {len(self.completed_categories)} categories completed")
        except Exception as e:
            safe_print(f"[WARNING] Could not save progress: {e}")
    
    def handle_rate_limiting(self, response_status):
        """Simple rate limiting handling"""
        if response_status == 503:
            self.consecutive_503_errors += 1
            safe_print(f"[RATE_LIMIT] Consecutive 503 errors: {self.consecutive_503_errors}")
            
            # Force session rotation after 8 consecutive 503s
            if self.consecutive_503_errors >= 8:
                safe_print(f"[RATE_LIMIT] Forcing session rotation after {self.consecutive_503_errors} consecutive 503s")
                self.rotate_session()
        else:
            # Reset on successful requests
            if self.consecutive_503_errors > 0:
                safe_print(f"[RATE_LIMIT] Request successful, resetting error count")
                self.consecutive_503_errors = 0
    
    def get_random_headers(self):
        """Get randomized headers for each request"""
        headers = {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': self.get_language_header(),
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        }
        
        # Randomly add optional headers
        if random.random() > 0.5:
            headers['DNT'] = '1'
        if random.random() > 0.7:
            headers['Sec-GPC'] = '1'
            
        return headers
    
    def make_request(self, url, retries=3):
        """Make HTTP request with adaptive retry logic and CAPTCHA detection"""
        for attempt in range(retries):
            try:
                # Check if we need to rotate session
                if self.should_rotate_session():
                    self.rotate_session()
                
                # Optimized delays for better performance while staying safe
                delay = random.uniform(1, 2)  # Reduced delays for faster scraping
                safe_print(f"  [DELAY] Waiting {delay:.1f}s before request...")
                time.sleep(delay)
                
                # Simulate human behavior
                self.simulate_human_behavior()
                
                # Use random headers for this request
                headers = self.get_random_headers()
                
                # Increment request counter
                self.request_count += 1
                
                response = self.session.get(url, headers=headers, timeout=15)
                
                # Handle rate limiting
                self.handle_rate_limiting(response.status_code)
                
                # Check for various blocking scenarios - improved like working scraper
                if response.status_code == 503:
                    safe_print(f"Status 503, retrying...")
                    if attempt < retries - 1:
                        time.sleep(random.uniform(5, 10))
                        continue
                elif response.status_code == 429:
                    safe_print(f"  [WARNING] Too many requests (429), backing off...")
                    time.sleep(random.uniform(8, 15))
                    continue
                elif 'validateCaptcha' in response.text or 'Continuer les achats' in response.text:
                    safe_print(f"  ⚠️ CAPTCHA detected on attempt {attempt + 1}")
                    if attempt < retries - 1:
                        safe_print("  🔄 Waiting longer before retry...")
                        time.sleep(random.uniform(10, 15))
                        continue
                    else:
                        safe_print("  ❌ All attempts failed due to CAPTCHA")
                        return None
                
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                safe_print(f"  [WARNING] Attempt {attempt + 1} failed: {str(e)}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(3, 8))
                    continue
                    
        return None
    
    def load_categories(self):
        """Load flat category structure from data/categories.json"""
        try:
            categories_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'categories.json')
            with open(categories_path, 'r', encoding='utf-8') as f:
                categories_data = json.load(f)
            
            # MODIFIED: All categories are main categories (flat structure)
            categories = []
            
            for category in categories_data:
                # All categories need products in flat structure
                categories.append({
                    'categoryId': category['categoryId'],
                    'name': category.get('categoryNameCanonical', 'Unknown'),
                    'slug': category['slug'],
                    'level': category['level'],
                    'parentId': category.get('parentCategoryId'),
                    'targetKeywords': [category.get('categoryNameCanonical', 'Unknown')],
                    'needs_products': True,
                    'recommended_products': random.randint(10, 12)  # Increased to 10-12 products per category
                })
            
            safe_print(f"[OK] Loaded {len(categories)} flat categories (all need products)")
            return categories
            
        except Exception as e:
            safe_print(f"[ERROR] Error loading categories: {e}")
            return []
    
    def search_products(self, keyword, page=1, fallback_mode=False):
        """Search for products with advanced filtering and smart fallback"""
        # Check cache first
        cache_key = self.get_cache_key('search', f"{keyword}_{page}_{fallback_mode}")
        cached_result = self.get_cached_data(cache_key)
        if cached_result:
            safe_print(f"[CACHE] Using cached search results for '{keyword}' page {page}")
            return cached_result
        
        # Build search URL with price filter using the domain from config
        domain = self.config.get('amazon_domain', f"amazon{self.config['amazon_tld']}")
        
        # Use different price filters based on fallback mode
        if fallback_mode:
            # Fallback: lower price threshold
            price_filter = max(5, self.min_price - 5)  # At least 5€, but lower than normal
        else:
            price_filter = self.min_price
            
        search_url = f"https://{domain}/s?k={keyword.replace(' ', '+')}&page={page}&low-price={price_filter}&ref=sr_pg_{page}"
        
        safe_print(f"[SEARCH] Page {page}: {search_url}")
        
        response = self.make_request(search_url, retries=5)
        if not response:
            safe_print("[ERROR] Failed to get search results")
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find product containers with multiple selectors
        containers = soup.find_all('div', {'data-component-type': 's-search-result'})
        if not containers:
            containers = soup.find_all('div', class_=re.compile(r's-result-item'))
        if not containers:
            containers = soup.find_all('div', attrs={'data-asin': re.compile(r'^[A-Z0-9]{10}$')})
        
        safe_print(f"[OK] Found {len(containers)} product containers")
        
        products = []
        for container in containers:
            product = self.extract_product_info(container)
            if product:
                products.append(product)
                title_short = product['title'][:40] + "..." if len(product['title']) > 40 else product['title']
                safe_print(f"[OK] Product {len(products)}: {title_short}")
        
        # Cache the results
        self.cache_data(cache_key, products, 'search')
        
        return products
    
    def extract_product_info(self, container):
        """Extract comprehensive product information with improved parsing"""
        try:
            # Skip sponsored products
            if container.find('span', string=re.compile(r'Sponsorisé|Sponsored|Gesponsert', re.I)):
                return None
            
            product = {}
            
            # Extract ASIN with multiple methods
            asin = container.get('data-asin')
            if not asin:
                # Try to find ASIN in various attributes
                asin_attrs = ['data-asin', 'data-item-id', 'id']
                for attr in asin_attrs:
                    asin = container.get(attr)
                    if asin and re.match(r'^[A-Z0-9]{10}$', asin):
                        break
                
                # Try to extract from links
                if not asin:
                    links = container.find_all('a', href=True)
                    for link in links:
                        href = link.get('href', '')
                        asin_match = re.search(r'/dp/([A-Z0-9]{10})', href)
                        if asin_match:
                            asin = asin_match.group(1)
                            break
            
            # If still no ASIN, try to extract from the container HTML
            if not asin:
                container_html = str(container)
                asin_match = re.search(r'/dp/([A-Z0-9]{10})', container_html)
                if asin_match:
                    asin = asin_match.group(1)
            
            # If still no ASIN, generate a temporary one for testing
            if not asin:
                # Create a temporary identifier for products without ASIN
                temp_id = f"TEMP_{hash(str(container)) % 1000000:06d}"
                safe_print(f"  [WARNING] No ASIN found, using temp ID: {temp_id}")
                asin = temp_id
            
            # Thread-safe ASIN check (only for real ASINs)
            if re.match(r'^[A-Z0-9]{10}$', asin):
                with self.asins_lock:
                    if asin in self.used_asins:
                        return None
                    self.used_asins.add(asin)
            
            product['asin'] = asin
            
            # Title and URL extraction with improved methods
            title_elem = None
            link = None
            title_text = ""
            
            # Method 1: H2 elements with links
            h2_elements = container.find_all('h2')
            for h2 in h2_elements:
                link_elem = h2.find('a')
                if link_elem and link_elem.get('href'):
                    title_text = link_elem.get_text().strip()
                    if title_text and len(title_text) > 5:
                        title_elem = h2
                        link = link_elem
                        break
            
            # Method 2: Any link with /dp/ in href
            if not title_elem:
                links = container.find_all('a', href=re.compile(r'/dp/'))
                for potential_link in links:
                    text = potential_link.get_text().strip()
                    if text and len(text) > 5:
                        title_text = text
                        title_elem = potential_link
                        link = potential_link
                        break
            
            # Method 3: Look for any text that looks like a product title
            if not title_elem:
                # Try to find spans or divs with product-like text
                text_elements = container.find_all(['span', 'div', 'h3'], string=re.compile(r'.{10,}'))
                for elem in text_elements:
                    text = elem.get_text().strip()
                    if text and len(text) > 10 and not re.match(r'^\d+[,\.]\d*', text):
                        title_text = text
                        # Find the closest link
                        link = elem.find_parent().find('a', href=re.compile(r'/dp/'))
                        if link:
                            title_elem = elem
                            break
            
            # If still no title, try to extract from any text in the container
            if not title_text:
                all_text = container.get_text()
                lines = [line.strip() for line in all_text.split('\n') if line.strip()]
                for line in lines:
                    if len(line) > 10 and not re.match(r'^\d+[,\.]\d*', line) and not re.match(r'^\d+$', line):
                        title_text = line
                        break
            
            if not title_text or len(title_text) < 5:
                safe_print(f"  [WARNING] No valid title found for ASIN: {asin}")
                return None
            
            product['title'] = title_text
            
            # URL extraction
            if link and link.get('href'):
                href = link.get('href')
                domain = self.config.get('amazon_domain', f"amazon{self.config['amazon_tld']}")
                if href.startswith('/'):
                    product['url'] = f"https://{domain}{href}"
                else:
                    product['url'] = href
            else:
                # Fallback URL construction
                domain = self.config.get('amazon_domain', f"amazon{self.config['amazon_tld']}")
                product['url'] = f"https://{domain}/dp/{asin}"
            
            # Price extraction with multiple methods
            price_text = ""
            price_value = 0
            
            # Method 1: Complete price structure
            price_range = container.find('span', class_='a-price-range')
            if price_range:
                price_text = price_range.get_text().strip()
            
            # Method 2: Combine price parts
            if not price_text:
                whole_elem = container.find('span', class_='a-price-whole')
                fraction_elem = container.find('span', class_='a-price-fraction')
                currency_elem = container.find('span', class_='a-price-symbol')
                
                if whole_elem:
                    price_text = whole_elem.get_text().strip()
                    if fraction_elem:
                        price_text += fraction_elem.get_text().strip()
                    if currency_elem:
                        price_text += currency_elem.get_text().strip()
            
            # Method 3: Offscreen price
            if not price_text:
                offscreen_elem = container.find('span', class_='a-offscreen')
                if offscreen_elem:
                    price_text = offscreen_elem.get_text().strip()
            
            # Method 4: Look for any price-like text in the container
            if not price_text:
                all_text = container.get_text()
                price_patterns = [
                    r'(\d+[,\.]\d*)\s*€',
                    r'€\s*(\d+[,\.]\d*)',
                    r'(\d+[,\.]\d*)\s*EUR',
                    r'EUR\s*(\d+[,\.]\d*)',
                    r'(\d+[,\.]\d*)\s*euros',
                    r'euros\s*(\d+[,\.]\d*)'
                ]
                for pattern in price_patterns:
                    match = re.search(pattern, all_text)
                    if match:
                        price_text = match.group(0)
                        break
            
            # Extract numeric price value
            if price_text:
                price_match = re.search(r'(\d+[,\.]\d*)', price_text.replace(',', '.'))
                if price_match:
                    try:
                        price_value = float(price_match.group(1))
                        product['price'] = f"{price_value}€"
                    except:
                        product['price'] = price_text
                else:
                    product['price'] = price_text
            else:
                product['price'] = "Prix non disponible"
                price_value = 0
            
            # Rating extraction with multiple methods
            rating = 0
            rating_elem = container.find('span', class_='a-icon-alt')
            if rating_elem:
                rating_text = rating_elem.get_text()
                rating_match = re.search(r'(\d+[,\.]\d*)', rating_text)
                if rating_match:
                    rating = float(rating_match.group(1).replace(',', '.'))
            
            # Alternative rating extraction
            if rating == 0:
                # Look for star ratings in various formats
                star_elements = container.find_all(['span', 'div'], class_=re.compile(r'star|rating'))
                for elem in star_elements:
                    text = elem.get_text()
                    rating_match = re.search(r'(\d+[,\.]\d*)', text)
                    if rating_match:
                        rating = float(rating_match.group(1).replace(',', '.'))
                        break
            
            # If still no rating, look for any text with rating pattern
            if rating == 0:
                all_text = container.get_text()
                rating_match = re.search(r'(\d+[,\.]\d*)\s*de\s*5|(\d+[,\.]\d*)\s*out\s*of\s*5|(\d+[,\.]\d*)\s*/\s*5', all_text)
                if rating_match:
                    rating = float((rating_match.group(1) or rating_match.group(2) or rating_match.group(3)).replace(',', '.'))
            
            product['rating'] = rating
            
            # Review count extraction
            review_count = 0
            review_elems = container.find_all('span', class_='a-size-base')
            for elem in review_elems:
                text = elem.get_text()
                if '(' in text and ')' in text:
                    review_match = re.search(r'\((\d+(?:\s?\d+)*)\)', text)
                    if review_match:
                        try:
                            review_count = int(review_match.group(1).replace(' ', ''))
                            break
                        except:
                            continue
            
            product['review_count'] = review_count
            
            # Quality filtering with fallback mode support
            min_rating_threshold = self.min_rating
            if hasattr(self, '_fallback_mode') and self._fallback_mode:
                min_rating_threshold = max(2.0, self.min_rating - 1.0)  # Much lower threshold in fallback
            
            # Skip only if rating is 0 (no rating at all) in normal mode, or below threshold in fallback
            if rating == 0 and not (hasattr(self, '_fallback_mode') and self._fallback_mode):
                safe_print(f"  [WARNING] Skipping '{title_text[:30]}...' (No rating, threshold: {min_rating_threshold})")
                return None
            elif rating > 0 and rating < min_rating_threshold:
                safe_print(f"  [WARNING] Skipping '{title_text[:30]}...' (Rating: {rating}/5, threshold: {min_rating_threshold})")
                return None
            
            # Price filtering with fallback mode support
            min_price_threshold = self.min_price
            if hasattr(self, '_fallback_mode') and self._fallback_mode:
                min_price_threshold = max(1, self.min_price - 10)  # Much lower threshold in fallback
            
            # Skip only if price is 0 (no price) in normal mode, or below threshold in fallback
            if price_value == 0 and not (hasattr(self, '_fallback_mode') and self._fallback_mode):
                safe_print(f"  [WARNING] Skipping '{title_text[:30]}...' (No price, threshold: {min_price_threshold}€)")
                return None
            elif price_value > 0 and price_value < min_price_threshold:
                safe_print(f"  [WARNING] Skipping '{title_text[:30]}...' (Price: {price_value}€, threshold: {min_price_threshold}€)")
                return None
            
            # Main image
            img_elem = container.find('img', class_='s-image')
            if not img_elem:
                img_elem = container.find('img')
            if img_elem:
                src = img_elem.get('src') or img_elem.get('data-src')
                if src:
                    product['main_image'] = src
            
            # Brand extraction from title
            product['brand'] = self.extract_brand_from_title(title_text)
            
            # Extract ASIN from URL
            asin = self.extract_asin_from_url(product['url'])
            product['asin'] = asin
            
            # Generate affiliate URL
            product['amazon_url'] = product['url']
            if asin:
                # Create clean affiliate URL with ASIN
                domain = self.config.get('amazon_domain', f"amazon{self.config['amazon_tld']}")
                product['affiliate_url'] = f"https://{domain}/dp/{asin}?tag={self.config['affiliate_tag']}"
            else:
                # Fallback: add tag to existing URL
                separator = '&' if '?' in product['url'] else '?'
                product['affiliate_url'] = f"{product['url']}{separator}tag={self.config['affiliate_tag']}"
            
            product['scraped_at'] = datetime.now().isoformat()
            product['country'] = self.market
            product['currency'] = self.config['currency']
            
            return product
            
        except Exception as e:
            safe_print(f"[ERROR] Error extracting product: {str(e)}")
            return None
    
    def extract_asin_from_url(self, url):
        """Extract ASIN from Amazon URL"""
        try:
            # Common ASIN patterns in Amazon URLs
            patterns = [
                r'/dp/([A-Z0-9]{10})',
                r'/product/([A-Z0-9]{10})',
                r'/gp/product/([A-Z0-9]{10})',
                r'asin=([A-Z0-9]{10})',
                r'/([A-Z0-9]{10})/'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, url)
                if match:
                    return match.group(1)
            
            return None
        except Exception:
            return None
    
    def extract_brand_from_title(self, title):
        """Extract brand name from product title"""
        # Generic brands for various product categories
        brands = [
            'Samsung', 'Apple', 'iPhone', 'Xiaomi', 'Huawei', 'Nokia', 'Oppo', 'Realme', 
            'OnePlus', 'Motorola', 'LG', 'Sony', 'Google', 'Pixel', 'Honor', 'Vivo',
            'Alcatel', 'TCL', 'Blackview', 'Doogee', 'Ulefone', 'Cubot', 'Oukitel',
            'Cat', 'Caterpillar', 'Gigaset', 'Panasonic', 'Philips', 'Siemens',
            'Ninja', 'SEB', 'Moulinex', 'Tefal', 'Delonghi', 'Cosori', 'Cecotec',
            'Bosch', 'KitchenAid', 'Kenwood', 'Braun', 'Dyson', 'Shark', 'iRobot',
            'JBL', 'Sony', 'Bose', 'Sennheiser', 'Audio-Technica', 'Marshall',
            'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour', 'New Balance'
        ]
        
        title_upper = title.upper()
        for brand in brands:
            if brand.upper() in title_upper:
                return brand
        
        # Fallback: first word
        words = title.split()
        return words[0] if words else "Unknown"
    
    def create_search_terms(self, category_name, level):
        """Create search terms based on category name and level"""
        category_lower = category_name.lower()
        search_terms = []
        
        if level == 0:  # Main categories
            search_terms = [category_lower, f"{category_lower} amazon"]
        
        elif level == 1:  # Brand subcategories
            brand_name = category_name.lower()
            search_terms = [f"{brand_name} {category_lower}", f"{brand_name} amazon"]
        
        elif level == 2:  # Specific models
            model_name = category_name.lower()
            search_terms = [model_name, f"{model_name} amazon"]
        
        else:
            # Fallback
            search_terms = [category_lower, f"{category_lower} amazon"]
        
        return search_terms
    
    def load_market_config(self, market):
        """Load market configuration from country-config.json"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'country-config.json')
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            if market not in config_data['countries']:
                safe_print(f"[WARNING] Country '{market}' not found, using default '{config_data['default_country']}'")
                market = config_data['default_country']
            
            country_config = config_data['countries'][market]
            
            # Convert to expected format for backward compatibility
            return {
                "name": country_config["name"],
                "amazon_tld": f".{country_config['domain'].split('.')[1]}",  # Extract TLD from domain
                "amazon_domain": country_config["domain"],
                "affiliate_tag": country_config["affiliate_tag"],
                "language": country_config["language"],
                "currency": country_config["currency"],
                "currency_symbol": "€" if country_config["currency"] == "EUR" else "$"
            }
        except Exception as e:
            safe_print(f"[ERROR] Could not load country config: {e}")
            # Fallback to Spanish market
            return {
                "name": "Spain",
                "amazon_tld": ".es",
                "amazon_domain": "amazon.es",
                "affiliate_tag": "clickclickh02-21",
                "language": "es-ES",
                "currency": "EUR",
                "currency_symbol": "€"
            }
    
    def extract_all_media(self, response_text, soup):
        """Extract up to 5 images and videos from Amazon product page"""
        carousel_images = []
        carousel_videos = []
        
        # Method 1: Extract multiple images using regex patterns
        try:
            # Extract hiRes images (highest quality)
            hires_images = re.findall(r'"hiRes":"([^"]+)"', response_text)
            safe_print(f"  [DEBUG] Found {len(hires_images)} hiRes images")
            
            for img_url in hires_images[:5]:  # Limit to 5 images
                clean_url = img_url.replace('\\/', '/')
                if clean_url.startswith('http') and clean_url not in carousel_images:
                    carousel_images.append(clean_url)
            
            # If we don't have 5 images yet, get large images
            if len(carousel_images) < 5:
                large_images = re.findall(r'"large":"([^"]+)"', response_text)
                safe_print(f"  [DEBUG] Found {len(large_images)} large images")
                
                for img_url in large_images:
                    if len(carousel_images) >= 5:
                        break
                    clean_url = img_url.replace('\\/', '/')
                    if clean_url.startswith('http') and clean_url not in carousel_images:
                        carousel_images.append(clean_url)
            
            # If still not enough, get main images
            if len(carousel_images) < 5:
                main_images = re.findall(r'"main":"([^"]+)"', response_text)
                safe_print(f"  [DEBUG] Found {len(main_images)} main images")
                
                for img_url in main_images:
                    if len(carousel_images) >= 5:
                        break
                    clean_url = img_url.replace('\\/', '/')
                    if clean_url.startswith('http') and clean_url not in carousel_images:
                        carousel_images.append(clean_url)
                        
        except Exception as e:
            safe_print(f"  [WARNING] Image extraction failed: {e}")
        
        # Method 2: Fallback to carousel JSON if regex didn't work
        if len(carousel_images) < 5:
            try:
                carousel_pattern = r'"colorImages":\s*{\s*"initial":\s*(\[.*?\])'
                carousel_match = re.search(carousel_pattern, response_text, re.DOTALL)
                
                if carousel_match:
                    carousel_data = json.loads(carousel_match.group(1))
                    safe_print(f"  [DEBUG] Found carousel JSON with {len(carousel_data)} items")
                    
                    for item in carousel_data:
                        if len(carousel_images) >= 5:
                            break
                        if isinstance(item, dict):
                            img_url = item.get('hiRes') or item.get('large') or item.get('main')
                            if img_url and img_url.startswith('http') and img_url not in carousel_images:
                                carousel_images.append(img_url)
                                
            except Exception as e:
                safe_print(f"  [WARNING] Carousel JSON extraction failed: {e}")
        
        # Method 3: Extract videos
        try:
            video_urls = re.findall(r'"videoUrl":"([^"]+)"', response_text)
            for video_url in video_urls[:2]:  # Limit to 2 videos
                clean_url = video_url.replace('\\/', '/')
                if clean_url.startswith('http') and clean_url not in carousel_videos:
                    carousel_videos.append(clean_url)
        except Exception as e:
            safe_print(f"  [WARNING] Video extraction failed: {e}")
        
        # Enhance image quality by upgrading Amazon's size parameters
        enhanced_images = []
        for img_url in carousel_images:
            try:
                enhanced_url = img_url
                
                # Upgrade to highest quality (1500px)
                size_upgrades = {
                    '._SL75_': '._SL1500_',
                    '._SL160_': '._SL1500_',
                    '._SL300_': '._SL1500_',
                    '._SL500_': '._SL1500_',
                    '._AC_SL75_': '._AC_SL1500_',
                    '._AC_SL160_': '._AC_SL1500_',
                    '._AC_SL300_': '._AC_SL1500_',
                    '._AC_SL500_': '._AC_SL1500_',
                }
                
                for old_size, new_size in size_upgrades.items():
                    enhanced_url = enhanced_url.replace(old_size, new_size)
                
                enhanced_images.append(enhanced_url)
                
            except Exception:
                enhanced_images.append(img_url)
        
        # Remove duplicates while preserving order and limit to 5 images
        final_images = []
        seen = set()
        for img in enhanced_images:
            if img not in seen and len(img) > 30 and len(final_images) < 5:
                seen.add(img)
                final_images.append(img)
        
        # Remove duplicates from videos
        final_videos = []
        seen_videos = set()
        for video in carousel_videos:
            if video not in seen_videos and len(video) > 30:
                seen_videos.add(video)
                final_videos.append(video)
        
        safe_print(f"  [OK] Extracted {len(final_images)} carousel images and {len(final_videos)} videos")
        return final_images, final_videos
    
    def get_detailed_product_info(self, product):
        """Get detailed product information from product page"""
        asin = product.get('asin')
        if not asin:
            safe_print(f"  [ERROR] No ASIN found for product")
            return None
        
        # Check cache first
        cache_key = self.get_cache_key('product', asin)
        cached_result = self.get_cached_data(cache_key)
        if cached_result:
            safe_print(f"  [CACHE] Using cached product details for ASIN: {asin}")
            return cached_result
        
        safe_print(f"  [SEARCH] Getting details for: {product['title'][:30]}...")
        
        response = self.make_request(product['url'])
        if not response:
            safe_print("  [ERROR] Failed to get product page")
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Enhanced media extraction from Amazon carousel
        all_images, videos = self.extract_all_media(response.text, soup)
        
        # Set main image and gallery (limit to 5 images)
        product['image'] = all_images[0] if all_images else product.get('main_image')
        product['images'] = all_images[:5]  # Limit to 5 images max
        product['videos'] = videos[:2]  # Limit to 2 videos max
        
        # Extract product description/features
        descriptions = []
        
        # Method 1: Feature bullets
        feature_bullets = soup.find('div', id='feature-bullets')
        if feature_bullets:
            bullets = feature_bullets.find_all('span', class_='a-list-item')
            for bullet in bullets[:8]:
                text = bullet.get_text(strip=True)
                if text and len(text) > 15 and not any(skip in text.lower() for skip in ['asin', 'dimensions', 'poids', 'fabricant']):
                    descriptions.append(text)
        
        # Method 2: About this item
        about_sections = soup.find_all(['h2', 'h3'], string=re.compile(r'À propos|About|Caractéristiques', re.I))
        for section in about_sections:
            feature_list = section.find_next_sibling('ul')
            if feature_list:
                items = feature_list.find_all('li')
                for item in items[:5]:
                    text = re.sub(r'\s+', ' ', item.get_text(strip=True))
                    if text and len(text) > 15:
                        descriptions.append(text)
        
        product['description'] = descriptions[:10]
        
        # Extract brand info
        brand_elem = soup.find('a', {'id': 'bylineInfo'})
        if brand_elem:
            product['brand'] = brand_elem.get_text(strip=True)
        
        # Ensure ASIN is properly set
        if not product.get('asin'):
            # Try to extract ASIN from URL
            asin = self.extract_asin_from_url(product['url'])
            if asin:
                product['asin'] = asin
                safe_print(f"  [FIX] Extracted ASIN from URL: {asin}")
            else:
                safe_print(f"  [WARNING] Could not extract ASIN for product")
                return None
        
        safe_print(f"  [OK] Extracted {len(product['description'])} description points")
        
        # Cache the detailed product info
        self.cache_data(cache_key, product, 'product')
        
        return product
    
    def scrape_category_products(self, category):
        """Scrape products for all categories (flat structure) with progress tracking"""
        category_id = category['categoryId']
        category_name = category.get('name', category.get('categoryNameCanonical', 'Unknown'))
        level = category['level']
        
        # Skip if already completed
        if category_id in self.completed_categories:
            safe_print(f"\n[SKIP] Category already completed: {category_name}")
            return []
        
        safe_print(f"\n[CATEGORY] Scraping category: {category_name} (Level {level})")
        
        # Use targetKeywords from the category structure
        target_keywords = category.get('targetKeywords', [])
        recommended_products = category.get('recommended_products', random.randint(5, 8))
        
        if not target_keywords:
            safe_print(f"[WARNING] No target keywords for {category_name}")
            return []
        
        safe_print(f"[TARGET] Keywords: {target_keywords}")
        safe_print(f"[TARGET] Recommended products: {recommended_products}")
        
        all_products = []
        
        try:
            # Search with target keywords from category structure
            for keyword_idx, search_term in enumerate(target_keywords):
                if len(all_products) >= recommended_products:
                    break
                    
                safe_print(f"[SEARCH] Keyword {keyword_idx + 1}: '{search_term}'")
                
                # Search multiple pages for this keyword
                for page in range(1, 3):  # Max 2 pages per keyword for efficiency
                    if len(all_products) >= recommended_products:
                        break
                        
                    safe_print(f"  [PAGE] Page {page}...")
                    
                    # Try normal search first
                    products_on_page = self.search_products(search_term, page, fallback_mode=False)
                    
                    # If not enough products, try fallback mode
                    if len(products_on_page) < recommended_products and page == 1:
                        safe_print(f"  [FALLBACK] Not enough products ({len(products_on_page)}/{recommended_products}), trying relaxed filters...")
                        self._fallback_mode = True
                        products_on_page = self.search_products(search_term, page, fallback_mode=True)
                        self._fallback_mode = False
                        
                        # If still not enough, try additional pages with fallback mode
                        if len(products_on_page) < recommended_products:
                            safe_print(f"  [FALLBACK] Still not enough ({len(products_on_page)}/{recommended_products}), trying page 2 with relaxed filters...")
                            self._fallback_mode = True
                            page2_products = self.search_products(search_term, 2, fallback_mode=True)
                            self._fallback_mode = False
                            products_on_page.extend(page2_products)
                    
                    if not products_on_page:
                        safe_print(f"  [WARNING] No products found on page {page}")
                        break
                    
                    # Process products in parallel
                    safe_print(f"  [START] Processing {len(products_on_page)} products in parallel...")
                    
                    with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                        future_to_product = {
                            executor.submit(self.get_detailed_product_info, product): product 
                            for product in products_on_page
                        }
                        
                        for future in concurrent.futures.as_completed(future_to_product):
                            if len(all_products) >= recommended_products:
                                # Cancel remaining futures
                                for f in future_to_product:
                                    f.cancel()
                                break
                                
                            try:
                                detailed_product = future.result()
                                if detailed_product:
                                    all_products.append(detailed_product)
                                    safe_print(f"  [OK] Product {len(all_products)}: {detailed_product['title'][:30]}...")
                            except Exception as exc:
                                safe_print(f"  [ERROR] Product failed: {exc}")
                    
                    # Rate limiting between pages (adaptive)
                    time.sleep(random.uniform(*self.current_delay))
                    
                    if len(products_on_page) < 5:  # Not many products left
                        break
            
            # Limit to target count and add category info
            final_products = all_products[:recommended_products]
            for product in final_products:
                product['category_id'] = category['categoryId']
                product['category_name'] = category_name
                product['category_level'] = level
                
                # Save individual product immediately
                self.save_individual_product(product, category)
            
            self.all_products[category['categoryId']] = final_products
            
            # Mark category as completed and save progress
            self.completed_categories.add(category_id)
            self.save_progress()
            
            safe_print(f"[SUCCESS] Final: {len(final_products)} products for {category_name}")
            safe_print(f"[PROGRESS] Category completed and saved to progress file")
            
            return final_products
            
        except Exception as e:
            safe_print(f"[ERROR] Failed to scrape category {category_name}: {e}")
            return []
    
    def scrape_sample_categories(self, max_categories=5):
        """Scrape a sample of categories for testing with parallel processing"""
        safe_print("[START] Starting Sample Product Scraping with Parallel Processing...")
        
        # Get sample categories (1-2 from each level)
        sample_categories = []
        for level in [0, 1, 2]:
            level_cats = [cat for cat in self.categories if cat['level'] == level]
            sample_categories.extend(level_cats[:2])
        
        sample_categories = sample_categories[:max_categories]
        
        safe_print(f"[STATS] Sample categories to process: {len(sample_categories)}")
        for cat in sample_categories:
            safe_print(f"  - {cat.get('name', cat.get('categoryNameCanonical', 'Unknown'))} (Level {cat['level']})")
        
        total_products = 0
        
        # Process categories in parallel (4 at a time for optimized testing)
        safe_print(f"[SPEED] Processing categories in parallel (4 at a time)...")
        batch_size = 4
        total_batches = (len(sample_categories) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(sample_categories))
            batch_categories = sample_categories[start_idx:end_idx]
            
            safe_print(f"\n--- Batch {batch_num + 1}/{total_batches} ---")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                future_to_category = {
                    executor.submit(self.scrape_category_products, category): category 
                    for category in batch_categories
                }
                
                batch_products = 0
                for i, future in enumerate(concurrent.futures.as_completed(future_to_category), 1):
                    category = future_to_category[future]
                    category_name = category.get('name', category.get('categoryNameCanonical', 'Unknown'))
                    
                    try:
                        products = future.result()
                        batch_products += len(products)
                        total_products += len(products)
                        safe_print(f"[SUCCESS] Category {category_name}: {len(products)} products")
                    except Exception as e:
                        safe_print(f"[ERROR] Error with category {category_name}: {e}")
                
                safe_print(f"[BATCH] Completed batch {batch_num + 1}: {batch_products} products")
        
        safe_print(f"\n[SUCCESS] Sample Scraping Complete!")
        safe_print(f"[STATS] Total Products: {total_products}")
        safe_print(f"[CACHE] Cache hits: {self.cache_hits}, Cache misses: {self.cache_misses}")
        safe_print(f"[CACHE] Cache efficiency: {(self.cache_hits / (self.cache_hits + self.cache_misses) * 100):.1f}%" if (self.cache_hits + self.cache_misses) > 0 else "[CACHE] No cache activity")
    
    def scrape_all_categories(self):
        """Scrape all categories with parallel processing (3 categories at once) and progress resumption"""
        safe_print("[START] Starting Full Product Scraping with Parallel Processing...")
        safe_print(f"[STATS] Total categories: {len(self.categories)}")
        safe_print(f"[PROGRESS] Already completed: {len(self.completed_categories)}")
        
        # Filter out completed categories
        remaining_categories = [cat for cat in self.categories if cat['categoryId'] not in self.completed_categories]
        safe_print(f"[STATS] Remaining categories to process: {len(remaining_categories)}")
        safe_print(f"[SPEED] Processing 4 categories in parallel for optimized efficiency")
        
        if not remaining_categories:
            safe_print("[SUCCESS] All categories already completed!")
            return
        
        total_products = 0
        
        # Process categories in batches of 4-5 for optimized parallel processing
        batch_size = 4  # Increased from 3 to 4 for better throughput
        total_batches = (len(remaining_categories) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(remaining_categories))
            batch_categories = remaining_categories[start_idx:end_idx]
            
            safe_print(f"\n--- Batch {batch_num + 1}/{total_batches} (Categories {start_idx + 1}-{end_idx}) ---")
            
            # Process batch in parallel with optimized workers
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                future_to_category = {
                    executor.submit(self.scrape_category_products, category): category 
                    for category in batch_categories
                }
                
                batch_products = 0
                for i, future in enumerate(concurrent.futures.as_completed(future_to_category), 1):
                    category = future_to_category[future]
                    category_name = category.get('name', category.get('categoryNameCanonical', 'Unknown'))
                    
                    try:
                        products = future.result()
                        batch_products += len(products)
                        total_products += len(products)
                        safe_print(f"[SUCCESS] Category {category_name}: {len(products)} products")
                    except Exception as e:
                        safe_print(f"[ERROR] Error with category {category_name}: {e}")
                
                safe_print(f"[BATCH] Completed batch {batch_num + 1}: {batch_products} products")
            
            # Optimized rest between batches
            if batch_num < total_batches - 1:  # Don't rest after last batch
                safe_print(f"[REST] Resting between batches...")
                time.sleep(random.uniform(3, 6))  # Reduced rest time for better performance
        
        safe_print(f"\n[SUCCESS] Full Scraping Complete!")
        safe_print(f"[STATS] Total Products: {total_products}")
        safe_print(f"[CACHE] Cache hits: {self.cache_hits}, Cache misses: {self.cache_misses}")
        safe_print(f"[CACHE] Cache efficiency: {(self.cache_hits / (self.cache_hits + self.cache_misses) * 100):.1f}%" if (self.cache_hits + self.cache_misses) > 0 else "[CACHE] No cache activity")
        safe_print(f"[PROGRESS] All progress saved to {self.progress_file}")
    
    def save_individual_product(self, product, category):
        """Save individual product immediately to avoid data loss"""
        try:
            asin = product.get('asin')
            if not asin:
                safe_print(f"[WARNING] No ASIN found for product, skipping save")
                return None
            
            # Convert to site format
            site_product = self.convert_to_site_format(product, category)
            
            # Create filename
            filename = f"{asin.lower()}.json"
            
            # Determine path
            if os.path.basename(os.getcwd()) == 'scripts':
                filepath = os.path.join('..', 'data', 'products', filename)
            else:
                filepath = os.path.join('data', 'products', filename)
            
            # Create products directory if it doesn't exist
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Save the product
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(site_product, f, indent=2, ensure_ascii=False)
            
            # Update progress counter
            with self.products_saved_lock:
                self.products_saved_count += 1
                total_saved = self.products_saved_count
            
            safe_print(f"[SAVE] Product saved: {filename} (Total: {total_saved})")
            return filepath
            
        except Exception as e:
            safe_print(f"[ERROR] Could not save individual product {product.get('asin', 'unknown')}: {str(e)}")
            return None
    
    def save_results(self, suffix=""):
        """Save scraping results"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Main results file
        results_file = f"amazon_products_{suffix}_{timestamp}.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump({
                'products_by_category': self.all_products,
                'statistics': self.get_statistics(),
                'scraping_config': {
                    'tier_limits': self.tier_limits,
                    'min_rating': self.min_rating,
                    'min_price': self.min_price
                },
                'timestamp': datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        safe_print(f"[SAVE] Results saved:")
        safe_print(f"  [OK] Main file: {results_file}")
        safe_print(f"  [OK] Individual products already saved progressively")
        
        self.print_summary()
    
    def convert_to_site_format(self, scraped_product, category=None):
        """Convert scraped product to site format"""
        return {
            "productId": scraped_product['asin'],
            "name": scraped_product['title'],
            "slug": self.create_slug(scraped_product['title']),
            "description": " | ".join(scraped_product.get('description', [])[:5]),
            "shortDescription": scraped_product['title'][:100],
            "price": scraped_product.get('price', 'Prix non disponible').replace('€', '').strip(),
            "compareAtPrice": int(float(scraped_product.get('price', '100').replace('€', '').replace(',', '.')) * 1.15) if scraped_product.get('price', '').replace('€', '').replace(',', '.').replace('.', '').isdigit() else 100,
            "images": scraped_product.get('images', [scraped_product.get('image', '')]) if scraped_product.get('images') else [scraped_product.get('image', '')],
            "videos": scraped_product.get('videos', []),
            "category": scraped_product.get('category_name', 'Product'),
            "tags": ["producto", scraped_product.get('brand', '').lower(), scraped_product.get('category_name', '').lower()],
            "amazonUrl": scraped_product.get('affiliate_url', ''),
            "amazonASIN": scraped_product['asin'],
            "affiliateId": self.config['affiliate_tag'],
            "originalAmazonTitle": scraped_product['title'],
            "amazonPrice": scraped_product.get('price', 'Prix non disponible'),
            "amazonRating": scraped_product.get('rating', 4.0),
            "amazonReviewCount": scraped_product.get('review_count', 0),
            "brand": scraped_product.get('brand', 'Unknown'),
            "seo": {
                "title": f"{scraped_product['title']} - Product Expert",
                "description": f"Découvrez {scraped_product['title']} sur Amazon. Note {scraped_product.get('rating', 4.0)}/5 avec {scraped_product.get('review_count', 0)} avis.",
                "keywords": ["producto", scraped_product.get('brand', '').lower(), "amazon", "avis"]
            },
            "reviews": {
                "averageRating": scraped_product.get('rating', 4.0),
                "totalReviews": scraped_product.get('review_count', 0),
                "breakdown": {"5": 60, "4": 25, "3": 10, "2": 3, "1": 2}
            }
        }
    
    def create_slug(self, title):
        """Create URL slug from title"""
        slug = title.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')[:50]
    
    def get_statistics(self):
        """Get comprehensive statistics"""
        total_products = sum(len(prods) for prods in self.all_products.values())
        
        stats = {
            'total_products': total_products,
            'categories_processed': len(self.all_products),
            'unique_asins': len(self.used_asins),
            'products_by_tier': {},
            'brands_distribution': {},
            'price_distribution': {'under_50': 0, '50_100': 0, '100_200': 0, 'over_200': 0}
        }
        
        # Calculate by tier
        for level in [0, 1, 2]:
            level_products = 0
            level_categories = 0
            
            for products in self.all_products.values():
                if products and products[0].get('category_level') == level:
                    level_products += len(products)
                    level_categories += 1
            
            if level_categories > 0:
                stats['products_by_tier'][f'level_{level}'] = {
                    'total_products': level_products,
                    'categories': level_categories,
                    'avg_per_category': round(level_products / level_categories, 1)
                }
        
        # Brand and price distribution
        for products in self.all_products.values():
            for product in products:
                # Brand distribution
                brand = product.get('brand', 'Unknown')
                stats['brands_distribution'][brand] = stats['brands_distribution'].get(brand, 0) + 1
                
                # Price distribution
                price_str = product.get('price', '0€')
                try:
                    price = float(re.search(r'(\d+[,.]?\d*)', price_str.replace(',', '.')).group(1))
                    if price < 50:
                        stats['price_distribution']['under_50'] += 1
                    elif price < 100:
                        stats['price_distribution']['50_100'] += 1
                    elif price < 200:
                        stats['price_distribution']['100_200'] += 1
                    else:
                        stats['price_distribution']['over_200'] += 1
                except:
                    pass
        
        return stats
    
    def create_product_preview_html(self, product, category_name):
        """Create an HTML preview of the product"""
        try:
            html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Preview - {product.get('title', 'Product')}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .product-container {{
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: #232f3e;
            color: white;
            padding: 20px;
            margin: -30px -30px 30px -30px;
            border-radius: 8px 8px 0 0;
        }}
        .category-badge {{
            background: #ff9900;
            color: black;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }}
        .product-title {{
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #0066cc;
        }}
        .product-meta {{
            display: flex;
            gap: 30px;
            margin: 20px 0;
        }}
        .meta-item {{
            text-align: center;
        }}
        .meta-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }}
        .meta-value {{
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }}
        .price {{
            color: #B12704;
            font-size: 24px;
        }}
        .rating {{
            color: #ff9900;
        }}
        .images-section {{
            margin: 30px 0;
        }}
        .images-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }}
        .image-item {{
            text-align: center;
        }}
        .image-item img {{
            max-width: 100%;
            height: 200px;
            object-fit: contain;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            background: white;
        }}
        .description-section {{
            margin: 30px 0;
        }}
        .features-list {{
            list-style: none;
            padding: 0;
        }}
        .features-list li {{
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }}
        .features-list li:before {{
            content: "✓";
            color: #00a652;
            font-weight: bold;
            margin-right: 10px;
        }}
        .affiliate-section {{
            background: #e7f3ff;
            border: 2px solid #0066cc;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }}
        .affiliate-button {{
            background: #ff9900;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }}
        .affiliate-button:hover {{
            background: #e68900;
        }}
        .tech-details {{
            background: #f8f8f8;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }}
        .asin {{
            font-family: monospace;
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
        }}
    </style>
</head>
<body>
    <div class="product-container">
        <div class="header">
            <div class="category-badge">{category_name}</div>
            <h1>Product Preview - Amazon {self.config['name']}</h1>
            <p>Scraped from {self.config.get('amazon_domain', 'amazon.es')} with affiliate tag: {self.config['affiliate_tag']}</p>
        </div>

        <h2 class="product-title">{product.get('title', 'No title available')}</h2>

        <div class="product-meta">
            <div class="meta-item">
                <div class="meta-label">Price</div>
                <div class="meta-value price">{product.get('price', 'N/A')}€</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Rating</div>
                <div class="meta-value rating">{product.get('rating', 'N/A')} ⭐</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Reviews</div>
                <div class="meta-value">{product.get('review_count', 'N/A')}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Brand</div>
                <div class="meta-value">{product.get('brand', 'N/A')}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">ASIN</div>
                <div class="meta-value asin">{product.get('asin', 'N/A')}</div>
            </div>
        </div>
"""

            # Add images section
            images = product.get('images', [])
            if images:
                html_content += f"""
        <div class="images-section">
            <h3>Product Images ({len(images)} images)</h3>
            <div class="images-grid">
"""
                for i, img_url in enumerate(images[:6]):  # Show max 6 images
                    html_content += f"""
                <div class="image-item">
                    <img src="{img_url}" alt="Product Image {i+1}" onerror="this.style.display='none'">
                    <p>Image {i+1}</p>
                </div>
"""
                html_content += """
            </div>
        </div>
"""

            # Add description and features
            description = product.get('description', '')
            features = product.get('features', [])
            
            html_content += f"""
        <div class="description-section">
            <h3>Product Description</h3>
            <p>{description[:500] + '...' if len(description) > 500 else description if description else 'No description available'}</p>
            
            <h3>Key Features</h3>
            <ul class="features-list">
"""
            
            if features:
                for feature in features[:8]:  # Show max 8 features
                    html_content += f"<li>{feature}</li>"
            else:
                html_content += "<li>No features available</li>"
            
            html_content += """
            </ul>
        </div>
"""

            # Add affiliate links section
            html_content += f"""
        <div class="affiliate-section">
            <h3>🛒 Purchase Links</h3>
            <p>These are affiliate links that will earn commission when used:</p>
            <a href="{product.get('affiliate_url', '#')}" class="affiliate-button" target="_blank">
                Buy on Amazon {self.config['name']} 
            </a>
            <a href="{product.get('amazon_url', '#')}" class="affiliate-button" target="_blank" style="background: #666;">
                View Original Product Page
            </a>
        </div>

        <div class="tech-details">
            <h3>Technical Details</h3>
            <p><strong>Country:</strong> {self.config['name']} ({self.market.upper()})</p>
            <p><strong>Currency:</strong> {product.get('currency', 'EUR')}</p>
            <p><strong>Availability:</strong> {product.get('availability', 'Check on Amazon')}</p>
            <p><strong>Shipping:</strong> {product.get('shipping_info', 'Standard shipping available')}</p>
            <p><strong>Scraped:</strong> {product.get('scraped_at', 'N/A')}</p>
        </div>
    </div>
</body>
</html>
"""

            # Save HTML file
            filename = f"product_preview_{product.get('asin', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return filename
            
        except Exception as e:
            safe_print(f"[ERROR] Could not create HTML preview: {str(e)}")
            return None
    
    def save_product_in_site_format(self, product, category):
        """Save product in the format expected by your Next.js site"""
        try:
            asin = product.get('asin')
            if not asin:
                return None
            
            # Create slug from title
            import re
            title = product.get('title', '')
            slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
            slug = re.sub(r'\s+', '-', slug)[:50]  # Limit length
            
            # Generate SEO-optimized description with HTML
            features = product.get('features', [])
            description_html = self.generate_product_description_html(product, features)
            
            # Map to your site's structure
            site_product = {
                "productId": asin,
                "name": product.get('title', ''),
                "slug": slug,
                "description": description_html,
                "shortDescription": product.get('title', ''),
                "price": str(product.get('price', 0)).replace('€', '').strip(),
                "compareAtPrice": int(float(str(product.get('price', 0)).replace('€', '').strip()) * 1.2) if product.get('price') else 0,  # 20% higher for comparison
                "images": product.get('images', [product.get('image_url')] if product.get('image_url') else []),
                "category": category.get('name', ''),
                "tags": [
                    category.get('name', '').lower(),
                    product.get('brand', '').lower(),
                    "producto"
                ],
                "amazonUrl": product.get('affiliate_url', product.get('amazon_url', '')),
                "amazonASIN": asin,
                "affiliateId": self.config.get('affiliate_tag', ''),
                "originalAmazonTitle": product.get('title', ''),
                "amazonPrice": f"{product.get('price', 0)}€",
                "amazonRating": product.get('rating', 0),
                "amazonReviewCount": product.get('review_count', 0),
                "brand": product.get('brand', 'Unknown'),
                "seo": {
                    "title": f"{product.get('title', '')} - {self.config.get('name', 'Store')}",
                    "description": f"Découvrez {product.get('title', '')} sur Amazon. Note {product.get('rating', 'N/A')}/5 avec {product.get('review_count', 0)} avis.",
                    "keywords": [
                        "producto",
                        product.get('brand', '').lower(),
                        category.get('name', '').lower(),
                        "amazon",
                        "oferta"
                    ]
                },
                "specifications": {
                    "availability": product.get('availability', 'In stock'),
                    "shipping": product.get('shipping_info', 'Standard shipping'),
                    "country": self.market.upper(),
                    "currency": product.get('currency', 'EUR')
                },
                "features": features[:10] if features else [],
                "scrapedAt": product.get('scraped_at', datetime.now().isoformat()),
                "lastUpdated": datetime.now().isoformat()
            }
            
            # Save to individual product file
            filename = f"{asin.lower()}.json"
            # Fix path - check if we're in scripts directory or root
            if os.path.basename(os.getcwd()) == 'scripts':
                filepath = os.path.join('..', 'data', 'products', filename)
            else:
                filepath = os.path.join('data', 'products', filename)
            
            # Create products directory if it doesn't exist
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(site_product, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[SAVE] Product saved: {filename}")
            return filepath
            
        except Exception as e:
            safe_print(f"[ERROR] Could not save product {product.get('asin', 'unknown')}: {str(e)}")
            return None
    
    def generate_product_description_html(self, product, features):
        """Generate SEO-optimized HTML description in Spanish"""
        title = product.get('title', '')
        price = product.get('price', 0)
        rating = product.get('rating', 0)
        brand = product.get('brand', 'Desconocido')
        
        html = f"""```html
<h1>{title}</h1>

<p>Descubre el {title} - un producto de calidad de la marca {brand}. Disponible en Amazon con entrega rápida.</p>

<ul>
"""
        
        # Add features as bullet points
        if features:
            for feature in features[:5]:  # Max 5 features
                html += f"  <li><strong>{feature[:100]}...</strong></li>\n"
        else:
            html += f"  <li><strong>Producto de calidad superior</strong> de la marca {brand}</li>\n"
            html += f"  <li><strong>Disponible inmediatamente</strong> en Amazon</li>\n"
            html += f"  <li><strong>Entrega rápida</strong> y excelente servicio al cliente</li>\n"
        
        html += f"""</ul>

<p><strong>Ventajas:</strong></p>
<ul>
  <li><strong>Calidad garantizada:</strong> Valoración Amazon de {rating}/5 estrellas</li>
  <li><strong>Precio competitivo:</strong> Solo {price}€</li>
  <li><strong>Entrega rápida:</strong> Disponible con Amazon Prime</li>
</ul>

<p><strong>Precio: {price}€</strong></p>
<p><a href="#">Comprar ahora</a></p>
```"""
        
        return html
    
    def test_single_category(self):
        """Test scraping a single category"""
        if not self.categories:
            safe_print("[ERROR] No categories found!")
            return
        
        safe_print(f"\n[TEST] Available categories ({len(self.categories)} total):")
        
        # Show first 10 categories for selection
        display_count = min(10, len(self.categories))
        for i in range(display_count):
            cat = self.categories[i]
            safe_print(f"  {i+1}. {cat['name']} (ID: {cat['categoryId']})")
        
        if len(self.categories) > 10:
            safe_print(f"  ... and {len(self.categories) - 10} more")
        
        # Let user choose or default to first one
        try:
            choice = input(f"\nEnter number (1-{display_count}) or press Enter for first one: ").strip()
            if choice == "":
                selected_index = 0
            else:
                selected_index = int(choice) - 1
                if selected_index < 0 or selected_index >= display_count:
                    safe_print("[ERROR] Invalid choice, using first category")
                    selected_index = 0
        except ValueError:
            safe_print("[ERROR] Invalid input, using first category")
            selected_index = 0
        
        selected_category = self.categories[selected_index]
        
        safe_print(f"\n[TEST] Testing category: {selected_category['name']}")
        safe_print(f"[TEST] Category ID: {selected_category['categoryId']}")
        safe_print(f"[TEST] Target keywords: {selected_category.get('targetKeywords', [])}")
        
        # Use the first target keyword or the category name
        keywords = selected_category.get('targetKeywords', [selected_category['name']])
        test_keyword = keywords[0] if keywords else selected_category['name']
        
        safe_print(f"[TEST] Using search keyword: '{test_keyword}'")
        safe_print(f"[TEST] Target products: {selected_category.get('recommended_products', 5)}")
        
        # Start scraping
        safe_print("\n[TEST] Starting product search...")
        products = self.search_products(test_keyword, page=1)
        
        if products:
            safe_print(f"\n[SUCCESS] Found {len(products)} products!")
            
            # Get detailed info for first product (for display)
            first_product = products[0]
            safe_print("\n[PRODUCT] Basic product details:")
            safe_print(f"  Title: {first_product.get('title', 'N/A')[:80]}...")
            safe_print(f"  ASIN: {first_product.get('asin', 'N/A')}")
            safe_print(f"  Price: {first_product.get('price', 'N/A')} {first_product.get('currency', '')}")
            safe_print(f"  Brand: {first_product.get('brand', 'N/A')}")
            safe_print(f"  Rating: {first_product.get('rating', 'N/A')}")
            safe_print(f"  Review Count: {first_product.get('review_count', 'N/A')}")
            safe_print(f"  Amazon URL: {first_product.get('amazon_url', 'N/A')[:80]}...")
            safe_print(f"  Affiliate URL: {first_product.get('affiliate_url', 'N/A')[:80]}...")
            
            # Fetch detailed product information for first product (for display)
            safe_print("\n[DETAIL] Fetching detailed product information...")
            detailed_product = self.get_detailed_product_info(first_product)
            
            if detailed_product:
                safe_print("\n[PRODUCT] Detailed product information:")
                safe_print(f"  Full Title: {detailed_product.get('title', 'N/A')}")
                safe_print(f"  Description: {detailed_product.get('description', 'N/A')[:200]}...")
                safe_print(f"  Features: {len(detailed_product.get('features', []))} bullet points")
                if detailed_product.get('features'):
                    for i, feature in enumerate(detailed_product.get('features', [])[:3]):
                        safe_print(f"    • {feature[:100]}...")
                safe_print(f"  Images: {len(detailed_product.get('images', []))} images found")
                if detailed_product.get('images'):
                    for i, img in enumerate(detailed_product.get('images', [])[:5]):
                        safe_print(f"    {i+1}. {img}")
                safe_print(f"  Availability: {detailed_product.get('availability', 'N/A')}")
                safe_print(f"  Shipping: {detailed_product.get('shipping_info', 'N/A')}")
            else:
                safe_print("\n[WARNING] Could not fetch detailed product information")
            
            # Save individual product files in your site's format
            # Get detailed info for ALL products before saving
            products_saved = 0
            for i, product in enumerate(products[:3]):  # Save first 3 products for testing
                safe_print(f"\n[SAVE] Processing product {i+1}/3: {product.get('asin', 'N/A')}")
                
                # Get detailed info for each product
                if i == 0 and detailed_product:
                    # Use already fetched detailed info for first product
                    product.update(detailed_product)
                else:
                    # Fetch detailed info for other products
                    product_detailed = self.get_detailed_product_info(product)
                    if product_detailed:
                        product.update(product_detailed)
                        safe_print(f"[SAVE] Got {len(product_detailed.get('images', []))} images for {product.get('asin', 'N/A')}")
                    else:
                        safe_print(f"[SAVE] WARNING: No detailed info for {product.get('asin', 'N/A')}")
                
                # Save the product
                product_file = self.save_product_in_site_format(product, selected_category)
                if product_file:
                    products_saved += 1
                    safe_print(f"[SAVE] Product saved: {product_file}")
                else:
                    safe_print(f"[SAVE] Failed to save product: {product.get('asin', 'N/A')}")
            
            # Save test results summary
            test_results = {
                'test_category': selected_category,
                'search_keyword': test_keyword,
                'products_found': len(products),
                'products_saved': products_saved,
                'test_date': datetime.now().isoformat(),
                'country': self.market,
                'config': self.config
            }
            
            import json
            output_file = f"test_single_subcategory_{self.market}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(test_results, f, indent=2, ensure_ascii=False)
            
            safe_print(f"[SAVE] Saved {products_saved} individual product files for your site")
            
            safe_print(f"\n[SAVE] Test results saved to: {output_file}")
            safe_print(f"[INFO] You can now view this product data on your Next.js site!")
            safe_print(f"[SUCCESS] Single subcategory test completed successfully!")
            
        else:
            safe_print(f"\n[WARNING] No products found for '{test_keyword}'")
            safe_print("[INFO] This could be due to:")
            safe_print("  - Very specific search terms")
            safe_print("  - Amazon blocking requests")
            safe_print("  - No products matching quality filters")
    
    def print_summary(self):
        """Print comprehensive summary"""
        stats = self.get_statistics()
        
        safe_print(f"\n[STATS] SCRAPING SUMMARY")
        safe_print("=" * 60)
        safe_print(f"Total Products: {stats['total_products']}")
        safe_print(f"Categories Processed: {stats['categories_processed']}")
        safe_print(f"Unique ASINs: {stats['unique_asins']}")
        
        safe_print(f"\n[STATS] BY TIER:")
        for tier, data in stats['products_by_tier'].items():
            level = tier.split('_')[1]
            safe_print(f"  Level {level}: {data['total_products']} products in {data['categories']} categories (avg: {data['avg_per_category']})")
        
        safe_print(f"\n[STATS] TOP BRANDS:")
        top_brands = sorted(stats['brands_distribution'].items(), key=lambda x: x[1], reverse=True)[:10]
        for brand, count in top_brands:
            safe_print(f"  {brand}: {count} products")
        
        safe_print(f"\n[STATS] PRICE DISTRIBUTION:")
        for range_name, count in stats['price_distribution'].items():
            safe_print(f"  {range_name.replace('_', '-')}: {count} products")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Amazon Product Scraper with Multi-Market Support')
    parser.add_argument('--country', '-c', default='es', 
                       choices=['fr', 'de', 'es', 'it', 'nl', 'pl', 'se', 'com'],
                       help='Target country (default: es)')
    parser.add_argument('--test-single', '-t', action='store_true',
                       help='Test mode: scrape products from just one subcategory')
    parser.add_argument('--speed', '-s', default='normal',
                       choices=['normal', 'fast', 'turbo'],
                       help='Speed mode: normal (balanced), fast (faster), turbo (maximum speed)')
    
    args = parser.parse_args()
    
    safe_print("[START] Professional Amazon Product Scraper - OPTIMIZED VERSION")
    safe_print("=" * 60)
    safe_print(f"[MARKET] Target country: {args.country.upper()}")
    safe_print(f"[SPEED] Mode: CONSERVATIVE OPTIMIZED (Workers: 8, Delays: 1-2s, Session: 200 req)")
    safe_print(f"[PERFORMANCE] Expected: 5-6x faster than original conservative mode")
    
    scraper = AmazonScraper(market=args.country)
    
    if not scraper.categories:
        safe_print("[ERROR] No categories found!")
        exit(1)
    
    safe_print(f"[OK] Loaded {len(scraper.categories)} categories")
    safe_print(f"[OPTIMIZATION] Scraping all categories (flat structure) with 5-8 products each")
    safe_print(f"[TARGET] Quality filters: {scraper.min_rating}+ stars, {scraper.min_price}{scraper.config['currency_symbol']}+ price (with smart fallback)")
    
    # Count categories for accurate reporting (flat structure)
    safe_print(f"[TARGET] Found {len(scraper.categories)} categories to scrape")
    
    # Handle test single mode
    if args.test_single:
        safe_print("\n[TEST] Single category test mode")
        scraper.test_single_category()
        exit(0)
    
    # Automatically run full scraping
    safe_print(f"\n[START] Running FULL scraping ({len(scraper.categories)} categories)...")
    safe_print("[INFO] This will take several hours. Starting automatically...")
    scraper.scrape_all_categories() 