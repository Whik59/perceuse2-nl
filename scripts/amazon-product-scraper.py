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
        
        # OPTIMIZED: Only scrape subcategories (level 1)
        # Main categories get products automatically from their subcategories
        self.scrape_only_subcategories = True
        
        # Quality filters
        self.min_rating = 4.0
        self.min_price = 20  # Minimum price in local currency
        
        # Track unique products (thread-safe)
        self.used_asins = set()
        self.used_urls = set()
        self.asins_lock = threading.Lock()
        
        # Results storage
        self.all_products = {}
        
        # Setup advanced session
        self.session = self.setup_advanced_session()
        
        # Load categories
        self.categories = self.load_categories()
        
        # User agents for rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ]
        
    def setup_advanced_session(self):
        """Setup session with advanced stealth features"""
        session = requests.Session()
        
        # Advanced headers with proper language for current market
        language_header = self.get_language_header()
        session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
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
        })
        
        # Add realistic cookies for current market
        market_cookies = self.get_market_cookies()
        session.cookies.update(market_cookies)
        
        return session
    
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
        """Make HTTP request with advanced retry logic and CAPTCHA detection"""
        for attempt in range(retries):
            try:
                # Random delay to appear human
                time.sleep(random.uniform(3, 7))
                
                # Use random headers for this request
                headers = self.get_random_headers()
                
                response = self.session.get(url, headers=headers, timeout=15)
                
                # Check for various blocking scenarios
                if response.status_code == 503:
                    safe_print(f"  [WARNING] Rate limited (503), waiting longer...")
                    time.sleep(random.uniform(15, 25))
                    continue
                elif response.status_code == 429:
                    safe_print(f"  [WARNING] Too many requests (429), backing off...")
                    time.sleep(random.uniform(20, 35))
                    continue
                elif 'validateCaptcha' in response.text or 'Continuer les achats' in response.text:
                    safe_print(f"  [WARNING] CAPTCHA detected on attempt {attempt + 1}")
                    if attempt < retries - 1:
                        safe_print("  [RETRY] Waiting longer before retry...")
                        time.sleep(random.uniform(15, 25))
                        continue
                    else:
                        safe_print("  [ERROR] All attempts failed due to CAPTCHA")
                        return None
                
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                safe_print(f"  [WARNING] Attempt {attempt + 1} failed: {str(e)}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(8, 15))
                    continue
                    
        return None
    
    def load_categories(self):
        """Load category structure from locales/categories.json"""
        try:
            categories_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'categories.json')
            with open(categories_path, 'r', encoding='utf-8') as f:
                categories_data = json.load(f)
            
            # Filter categories that need products (flat structure)
            categories = []
            
            for category in categories_data:
                if category.get('needs_products', False):
                    categories.append({
                        'categoryId': category['categoryId'],
                        'name': category['categoryNameCanonical'],
                        'slug': category['slug'],
                        'level': category['level'],
                        'parentId': category.get('parentCategoryId'),
                        'targetKeywords': [category['categoryNameCanonical']],
                        'needs_products': True,
                        'recommended_products': category.get('recommended_products', 5)
                    })
            
            main_categories = len([c for c in categories_data if c['level'] == 0])
            safe_print(f"[OK] Loaded {main_categories} main categories, {len(categories)} categories need products")
            return categories
            
        except Exception as e:
            safe_print(f"[ERROR] Error loading categories: {e}")
            return []
    
    def search_products(self, keyword, page=1):
        """Search for products with advanced filtering"""
        # Build search URL with price filter using the domain from config
        domain = self.config.get('amazon_domain', f"amazon{self.config['amazon_tld']}")
        search_url = f"https://{domain}/s?k={keyword.replace(' ', '+')}&page={page}&low-price={self.min_price}&ref=sr_pg_{page}"
        
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
        
        return products
    
    def extract_product_info(self, container):
        """Extract comprehensive product information"""
        try:
            # Skip sponsored products
            if container.find('span', string=re.compile(r'Sponsorisé|Sponsored|Gesponsert', re.I)):
                return None
            
            product = {}
            
            # Extract ASIN first (most reliable identifier)
            asin = container.get('data-asin')
            if not asin:
                asin_match = re.search(r'/dp/([A-Z0-9]{10})', str(container))
                asin = asin_match.group(1) if asin_match else None
            
            if not asin:
                return None
            
            # Thread-safe ASIN check
            with self.asins_lock:
                if asin in self.used_asins:
                    return None
                self.used_asins.add(asin)
            
            product['asin'] = asin
            
            # Title and URL extraction with multiple methods
            title_elem = None
            link = None
            
            # Method 1: H2 elements
            h2_elements = container.find_all('h2')
            for h2 in h2_elements:
                link = h2.find('a')
                if link and link.get('href'):
                    title_elem = h2
                    break
            
            # Method 2: Direct links
            if not title_elem:
                links = container.find_all('a', href=re.compile(r'/dp/'))
                for potential_link in links:
                    text = potential_link.get_text().strip()
                    if text and len(text) > 10:
                        link = potential_link
                        title_elem = potential_link
                        break
            
            if not link or not link.get('href'):
                return None
            
            # Extract title and URL
            title_text = title_elem.get_text().strip()
            if not title_text or len(title_text) < 10:
                return None
            
            product['title'] = title_text
            href = link.get('href')
            domain = self.config.get('amazon_domain', f"amazon{self.config['amazon_tld']}")
            product['url'] = urljoin(f'https://{domain}', href)
            
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
            
            # Rating extraction
            rating = 0
            rating_elem = container.find('span', class_='a-icon-alt')
            if rating_elem:
                rating_text = rating_elem.get_text()
                rating_match = re.search(r'(\d+[,\.]\d*)', rating_text)
                if rating_match:
                    rating = float(rating_match.group(1).replace(',', '.'))
            
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
            
            # Quality filtering
            if rating < self.min_rating:
                safe_print(f"  [WARNING] Skipping '{title_text[:30]}...' (Rating: {rating}/5)")
                return None
            

            
            if price_value < self.min_price:
                safe_print(f"  [WARNING] Skipping '{title_text[:30]}...' (Price: {price_value}€)")
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
        # Updated brands for telefono category
        brands = [
            'Samsung', 'Apple', 'iPhone', 'Xiaomi', 'Huawei', 'Nokia', 'Oppo', 'Realme', 
            'OnePlus', 'Motorola', 'LG', 'Sony', 'Google', 'Pixel', 'Honor', 'Vivo',
            'Alcatel', 'TCL', 'Blackview', 'Doogee', 'Ulefone', 'Cubot', 'Oukitel',
            'Cat', 'Caterpillar', 'Gigaset', 'Panasonic', 'Philips', 'Siemens',
            'Ninja', 'SEB', 'Moulinex', 'Tefal', 'Delonghi', 'Cosori', 'Cecotec'
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
            if "sans huile" in category_lower:
                search_terms = ["friteuse sans huile", "air fryer", "friteuse air"]
            elif "huile" in category_lower:
                search_terms = ["friteuse huile", "friteuse traditionnelle"]
            else:
                search_terms = [f"friteuse {category_lower}", category_lower]
        
        elif level == 1:  # Brand subcategories
            brand_name = category_name.lower()
            search_terms = [f"friteuse {brand_name}", f"{brand_name} friteuse", f"{brand_name} air fryer"]
        
        elif level == 2:  # Specific models
            model_name = category_name.lower()
            search_terms = [model_name, f"friteuse {model_name}"]
        
        else:
            # Fallback
            search_terms = [category_lower, f"friteuse {category_lower}"]
        
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
        """Extract images and videos specifically from Amazon product carousel"""
        carousel_images = []
        carousel_videos = []
        
        # Method 1: Extract from main product carousel JSON (most reliable)
        try:
            # Look for the main image carousel data structure
            # Amazon stores carousel images in colorImages.initial array
            carousel_pattern = r'"colorImages":\s*{\s*"initial":\s*(\[.*?\])'
            carousel_match = re.search(carousel_pattern, response_text, re.DOTALL)
            
            if carousel_match:
                try:
                    carousel_data = json.loads(carousel_match.group(1))
                    safe_print(f"  [OK] Found carousel with {len(carousel_data)} items")
                    
                    for item in carousel_data:
                        # Get the highest quality image from each carousel item
                        if isinstance(item, dict):
                            # Priority: hiRes > large > main
                            img_url = item.get('hiRes') or item.get('large') or item.get('main')
                            if img_url and img_url.startswith('http'):
                                carousel_images.append(img_url)
                                
                except json.JSONDecodeError:
                    safe_print("  [WARNING] Could not parse carousel JSON")
            
            # Look for product videos in the carousel
            video_pattern = r'"videos":\s*\[([^\]]+)\]'
            video_match = re.search(video_pattern, response_text)
            
            if video_match:
                try:
                    # Extract video URLs from the videos array
                    video_urls = re.findall(r'"url":"([^"]*\.mp4[^"]*)"', video_match.group(1))
                    for video_url in video_urls:
                        clean_url = video_url.replace('\\/', '/')
                        if clean_url.startswith('http'):
                            carousel_videos.append(clean_url)
                            
                except Exception as e:
                    safe_print(f"  [WARNING] Video extraction failed: {e}")
                    
        except Exception as e:
            safe_print(f"  [WARNING] Carousel JSON extraction failed: {e}")
        
        # Method 2: Fallback to main product image if carousel not found
        if not carousel_images:
            try:
                # Look for the main product image
                main_img_patterns = [
                    r'"hiRes":"([^"]+)"',
                    r'"large":"([^"]+)"',
                    r'data-a-dynamic-image="([^"]+)"'
                ]
                
                for pattern in main_img_patterns:
                    matches = re.findall(pattern, response_text)
                    for match in matches:
                        img_url = match.replace('\\u0026', '&').replace('\\"', '"').replace('\\/', '/')
                        if img_url.startswith('http') and img_url not in carousel_images:
                            carousel_images.append(img_url)
                            break  # Only get the first high-quality image as fallback
                    if carousel_images:
                        break
                        
            except Exception as e:
                safe_print(f"  [WARNING] Fallback image extraction failed: {e}")
        
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
        
        # Remove duplicates while preserving order
        final_images = []
        seen = set()
        for img in enhanced_images:
            if img not in seen and len(img) > 30:  # Filter out small/invalid URLs
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
        safe_print(f"  [SEARCH] Getting details for: {product['title'][:30]}...")
        
        response = self.make_request(product['url'])
        if not response:
            safe_print("  [ERROR] Failed to get product page")
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Enhanced media extraction from Amazon carousel
        all_images, videos = self.extract_all_media(response.text, soup)
        
        # Set main image and gallery
        product['image'] = all_images[0] if all_images else product.get('main_image')
        product['images'] = all_images[:12]  # Up to 12 images for gallery
        product['videos'] = videos[:5]  # Up to 5 videos
        
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
        
        safe_print(f"  [OK] Extracted {len(product['description'])} description points")
        return product
    
    def scrape_category_products(self, category):
        """Scrape products for subcategories only using their targetKeywords"""
        category_name = category['categoryNameCanonical']
        level = category['level']
        
        # OPTIMIZATION: Skip main categories (level 0) - they get products from subcategories
        if level == 0:
            safe_print(f"\n[SKIP] Main category: {category_name} (products come from subcategories)")
            return []
        
        safe_print(f"\n[CATEGORY] Scraping subcategory: {category_name} (Level {level})")
        
        # Use targetKeywords from the optimized category structure
        target_keywords = category.get('targetKeywords', [])
        recommended_products = category.get('recommendedProducts', 10)
        
        if not target_keywords:
            safe_print(f"[WARNING] No target keywords for {category_name}")
            return []
        
        safe_print(f"[TARGET] Keywords: {target_keywords}")
        safe_print(f"[TARGET] Recommended products: {recommended_products}")
        
        all_products = []
        
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
                
                products_on_page = self.search_products(search_term, page)
                if not products_on_page:
                    safe_print(f"  [WARNING] No products found on page {page}")
                    break
                
                # Process products in parallel
                safe_print(f"  [START] Processing {len(products_on_page)} products in parallel...")
                
                with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
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
                
                # Rate limiting between pages
                time.sleep(random.uniform(8, 15))
                
                if len(products_on_page) < 5:  # Not many products left
                    break
        
        # Limit to target count and add category info
        final_products = all_products[:target_count]
        for product in final_products:
            product['category_id'] = category['categoryId']
            product['category_name'] = category_name
            product['category_level'] = level
        
        self.all_products[category['categoryId']] = final_products
        safe_print(f"[SUCCESS] Final: {len(final_products)} products for {category_name}")
        
        return final_products
    
    def scrape_sample_categories(self, max_categories=5):
        """Scrape a sample of categories for testing"""
        safe_print("[START] Starting Sample Product Scraping...")
        
        # Get sample categories (1-2 from each level)
        sample_categories = []
        for level in [0, 1, 2]:
            level_cats = [cat for cat in self.categories if cat['level'] == level]
            sample_categories.extend(level_cats[:2])
        
        sample_categories = sample_categories[:max_categories]
        
        safe_print(f"[STATS] Sample categories to process: {len(sample_categories)}")
        for cat in sample_categories:
            safe_print(f"  - {cat['categoryNameCanonical']} (Level {cat['level']})")
        
        total_products = 0
        
        for i, category in enumerate(sample_categories, 1):
            safe_print(f"\n--- Progress: {i}/{len(sample_categories)} ---")
            
            try:
                products = self.scrape_category_products(category)
                total_products += len(products)
                
                # Rest between categories
                safe_print(f"[RETRY] Resting between categories...")
                time.sleep(random.uniform(15, 25))
                
            except Exception as e:
                safe_print(f"[ERROR] Error with category {category['categoryNameCanonical']}: {e}")
                continue
        
        safe_print(f"\n[SUCCESS] Sample Scraping Complete!")
        safe_print(f"[STATS] Total Products: {total_products}")
        
        self.save_results("sample")
    
    def scrape_all_categories(self):
        """Scrape all categories"""
        safe_print("[START] Starting Full Friteuse Scraping...")
        safe_print(f"[STATS] Categories to process: {len(self.categories)}")
        
        total_products = 0
        
        for i, category in enumerate(self.categories, 1):
            safe_print(f"\n--- Progress: {i}/{len(self.categories)} ---")
            
            try:
                products = self.scrape_category_products(category)
                total_products += len(products)
                
                # Save progress every 10 categories
                if i % 10 == 0:
                    self.save_results(f"progress_{i}")
                
                # Rest between categories
                time.sleep(random.uniform(15, 25))
                
            except Exception as e:
                safe_print(f"[ERROR] Error with category {category['categoryNameCanonical']}: {e}")
                continue
        
        safe_print(f"\n[SUCCESS] Full Scraping Complete!")
        safe_print(f"[STATS] Total Products: {total_products}")
        
        self.save_results("final")
    
    def save_results(self, suffix=""):
        """Save scraping results"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Main results file
        results_file = f"friteuse_products_{suffix}_{timestamp}.json"
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
        
        # Create individual product files
        os.makedirs('data/products', exist_ok=True)
        product_count = 0
        
        for category_id, products in self.all_products.items():
            for product in products:
                # Convert to site format
                site_product = self.convert_to_site_format(product)
                
                # Save individual product file
                product_file = f"data/products/{product['asin'].lower()}.json"
                with open(product_file, 'w', encoding='utf-8') as f:
                    json.dump(site_product, f, indent=2, ensure_ascii=False)
                product_count += 1
        
        safe_print(f"[SAVE] Results saved:")
        safe_print(f"  [OK] Main file: {results_file}")
        safe_print(f"  [OK] Individual products: {product_count} files in data/products/")
        
        self.print_summary()
    
    def convert_to_site_format(self, scraped_product):
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
            "category": scraped_product.get('category_name', 'Friteuse'),
            "tags": ["friteuse", scraped_product.get('brand', '').lower(), scraped_product.get('category_name', '').lower()],
            "amazonUrl": scraped_product.get('affiliate_url', ''),
            "amazonASIN": scraped_product['asin'],
            "affiliateId": self.config['affiliate_tag'],
            "originalAmazonTitle": scraped_product['title'],
            "amazonPrice": scraped_product.get('price', 'Prix non disponible'),
            "amazonRating": scraped_product.get('rating', 4.0),
            "amazonReviewCount": scraped_product.get('review_count', 0),
            "brand": scraped_product.get('brand', 'Unknown'),
            "seo": {
                "title": f"{scraped_product['title']} - Friteuse Expert",
                "description": f"Découvrez {scraped_product['title']} sur Amazon. Note {scraped_product.get('rating', 4.0)}/5 avec {scraped_product.get('review_count', 0)} avis.",
                "keywords": ["friteuse", scraped_product.get('brand', '').lower(), "amazon", "avis"]
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
    
    def get_detailed_product_info(self, product):
        """Fetch detailed product information from product page"""
        try:
            if not product.get('amazon_url'):
                return None
            
            safe_print(f"[DETAIL] Fetching details for ASIN: {product.get('asin', 'N/A')}")
            
            # Make request to product page with Spanish language preference
            response = self.make_request(product['amazon_url'])
            if not response:
                return None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            detailed_info = {}
            
            # Check if we're getting Spanish content
            page_lang = soup.find('html', {'lang': True})
            if page_lang and 'es' not in page_lang.get('lang', '').lower():
                safe_print(f"[WARNING] Page language may not be Spanish: {page_lang.get('lang', 'unknown')}")
            
            # Extract full title
            title_elem = soup.find('span', {'id': 'productTitle'})
            if title_elem:
                detailed_info['title'] = title_elem.get_text(strip=True)
            
            # Extract description
            desc_elem = soup.find('div', {'id': 'feature-bullets'})
            if not desc_elem:
                desc_elem = soup.find('div', {'id': 'productDescription'})
            if desc_elem:
                detailed_info['description'] = desc_elem.get_text(strip=True)
            
            # Extract features/bullet points
            features = []
            feature_list = soup.find('div', {'id': 'feature-bullets'})
            if feature_list:
                bullets = feature_list.find_all('span', class_='a-list-item')
                for bullet in bullets:
                    text = bullet.get_text(strip=True)
                    if text and len(text) > 10 and not text.startswith('Make sure'):
                        features.append(text)
            detailed_info['features'] = features[:10]  # Limit to 10 features
            
            # Extract images using the proven regex method for Amazon carousel
            images = []
            videos = []
            
            safe_print(f"[DEBUG] Starting image extraction using regex method...")
            
            # Method 1: Direct regex extraction from page HTML (most reliable)
            try:
                page_html = response.text
                safe_print(f"[DEBUG] Page HTML length: {len(page_html)} characters")
                
                # Extract high-resolution images first
                hires_images = re.findall(r'"hiRes":"([^"]+)"', page_html)
                safe_print(f"[DEBUG] Found {len(hires_images)} hiRes images")
                
                if hires_images:
                    for i, img_url in enumerate(hires_images):
                        # Clean the URL (remove escape characters)
                        clean_url = img_url.replace('\\/', '/')
                        if clean_url not in images:
                            images.append(clean_url)
                            safe_print(f"[DEBUG] HiRes image {i+1}: {clean_url[:60]}...")
                
                # Fallback to large images if no hiRes found
                if len(images) < 3:
                    large_images = re.findall(r'"large":"([^"]+)"', page_html)
                    safe_print(f"[DEBUG] Found {len(large_images)} large images")
                    
                    for i, img_url in enumerate(large_images):
                        clean_url = img_url.replace('\\/', '/')
                        if clean_url not in images:
                            images.append(clean_url)
                            safe_print(f"[DEBUG] Large image {i+1}: {clean_url[:60]}...")
                
                # Also look for main images
                if len(images) < 5:
                    main_images = re.findall(r'"main":"([^"]+)"', page_html)
                    safe_print(f"[DEBUG] Found {len(main_images)} main images")
                    
                    for i, img_url in enumerate(main_images):
                        clean_url = img_url.replace('\\/', '/')
                        if clean_url not in images:
                            images.append(clean_url)
                            safe_print(f"[DEBUG] Main image {i+1}: {clean_url[:60]}...")
                
                # Look for video URLs
                video_urls = re.findall(r'"videoUrl":"([^"]+)"', page_html)
                safe_print(f"[DEBUG] Found {len(video_urls)} videos")
                
                for video_url in video_urls:
                    clean_url = video_url.replace('\\/', '/')
                    if clean_url not in videos:
                        videos.append(clean_url)
                        safe_print(f"[DEBUG] Video: {clean_url[:60]}...")
                        
            except Exception as e:
                safe_print(f"[DEBUG] Error in regex extraction: {str(e)}")
            
            # Method 2: Fallback to thumbnail extraction if regex didn't work
            if len(images) < 3:
                safe_print(f"[DEBUG] Regex found {len(images)} images, trying thumbnail extraction...")
                
                # Target specific Amazon carousel elements
                carousel_selectors = [
                    'div[id*="altImages"]',
                    'span[class*="a-button-thumbnail"]'
                ]
                
                for selector in carousel_selectors:
                    try:
                        elements = soup.select(selector)
                        safe_print(f"[DEBUG] Found {len(elements)} elements with selector: {selector}")
                        
                        for element in elements:
                            imgs = element.find_all('img')
                            for img in imgs:
                                src = img.get('src') or img.get('data-src')
                                if src and 'images/I/' in src:
                                    # Extract image ID and create high-res URL
                                    img_id_match = re.search(r'/I/([A-Za-z0-9+%]+)', src)
                                    if img_id_match:
                                        img_id = img_id_match.group(1)
                                        high_res_url = f"https://m.media-amazon.com/images/I/{img_id}._AC_SL1500_.jpg"
                                        if high_res_url not in images:
                                            images.append(high_res_url)
                                            safe_print(f"[DEBUG] Thumbnail converted: {img_id}")
                    except Exception as e:
                        safe_print(f"[DEBUG] Error with selector {selector}: {str(e)}")
            
            # Method 3: Dynamic image data as final fallback
            if len(images) < 2:
                safe_print(f"[DEBUG] Still only {len(images)} images, trying dynamic image data...")
                
                dynamic_imgs = soup.find_all('img', {'data-a-dynamic-image': True})
                for img in dynamic_imgs:
                    try:
                        dynamic_data = img.get('data-a-dynamic-image')
                        if dynamic_data:
                            img_data = json.loads(dynamic_data)
                            # Get the highest resolution version
                            best_url = None
                            best_size = 0
                            
                            for img_url, dimensions in img_data.items():
                                if isinstance(dimensions, list) and len(dimensions) >= 2:
                                    size = dimensions[0] * dimensions[1]
                                    if size > best_size:
                                        best_size = size
                                        best_url = img_url
                            
                            if best_url and best_url not in images:
                                images.append(best_url)
                                safe_print(f"[DEBUG] Dynamic image: {best_url[:60]}...")
                    except Exception as e:
                        safe_print(f"[DEBUG] Error parsing dynamic image: {str(e)}")
            
            safe_print(f"[DEBUG] Total images found: {len(images)}")
            
            # Smart image deduplication and quality filtering
            unique_images = []
            seen_image_ids = set()
            
            # Sort images by quality preference (highest resolution first)
            def get_image_quality_score(img_url):
                if '_AC_SL1500_' in img_url:
                    return 1000  # Highest quality
                elif '_AC_SL1000_' in img_url:
                    return 900
                elif '_AC_SX679_' in img_url:
                    return 800
                elif '_AC_SX' in img_url:
                    # Extract width for scoring
                    width_match = re.search(r'_AC_SX(\d+)_', img_url)
                    if width_match:
                        return int(width_match.group(1))
                    return 500
                else:
                    return 100  # Lowest quality
            
            # Sort by quality score (highest first)
            images.sort(key=get_image_quality_score, reverse=True)
            
            for img_url in images:
                # Extract image ID to avoid duplicates
                img_id_match = re.search(r'/I/([^/._]+)', img_url)  # More precise regex
                if img_id_match:
                    img_id = img_id_match.group(1)
                    
                    # Skip very small/low quality images
                    if any(x in img_url.lower() for x in ['_ss', '_sx40_', '_sx50_', '_sx75_', '_sx100_']):
                        continue
                    
                    if img_id not in seen_image_ids:
                        seen_image_ids.add(img_id)
                        # Ensure we get the highest quality version
                        if '_AC_SL1500_' not in img_url:
                            # Convert to highest quality
                            high_quality_url = f"https://m.media-amazon.com/images/I/{img_id}._AC_SL1500_.jpg"
                            unique_images.append(high_quality_url)
                        else:
                            unique_images.append(img_url)
                        
                        # Stop at 10 images max
                        if len(unique_images) >= 10:
                            break
            
            detailed_info['images'] = unique_images[:10]  # Max 10 unique high-quality images
            detailed_info['videos'] = list(dict.fromkeys(videos))[:5]   # Limit to 5 videos
            
            safe_print(f"[DEBUG] Found {len(unique_images)} unique high-quality images and {len(videos)} videos")
            
            # Extract availability
            availability_elem = soup.find('div', {'id': 'availability'})
            if availability_elem:
                avail_text = availability_elem.get_text(strip=True)
                detailed_info['availability'] = avail_text
            else:
                detailed_info['availability'] = "Check on Amazon"
            
            # Extract shipping info
            shipping_elem = soup.find('div', {'id': 'mir-layout-DELIVERY_BLOCK'})
            if not shipping_elem:
                shipping_elem = soup.find('span', string=re.compile(r'delivery|shipping', re.I))
            if shipping_elem:
                detailed_info['shipping_info'] = shipping_elem.get_text(strip=True)[:200]
            else:
                detailed_info['shipping_info'] = "Standard shipping available"
            
            # Extract additional product details
            detail_bullets = soup.find('div', {'id': 'detailBullets_feature_div'})
            if detail_bullets:
                details = {}
                rows = detail_bullets.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) == 2:
                        key = cells[0].get_text(strip=True).replace(':', '')
                        value = cells[1].get_text(strip=True)
                        details[key] = value
                detailed_info['product_details'] = details
            
            safe_print(f"[DETAIL] Successfully extracted detailed info")
            return detailed_info
            
        except Exception as e:
            safe_print(f"[ERROR] Error fetching detailed product info: {str(e)}")
            return None
    
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
                    "telefono"
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
                        "telefono",
                        product.get('brand', '').lower(),
                        category.get('name', '').lower(),
                        "movil",
                        "smartphone"
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
            filepath = os.path.join('..', 'data', 'products', filename)
            
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
    
    def test_single_subcategory(self):
        """Test scraping a single subcategory"""
        subcategories = [cat for cat in self.categories if cat.get('level') == 1]
        
        if not subcategories:
            safe_print("[ERROR] No subcategories found!")
            return
        
        safe_print(f"\n[TEST] Available subcategories ({len(subcategories)} total):")
        
        # Show first 10 subcategories for selection
        display_count = min(10, len(subcategories))
        for i in range(display_count):
            cat = subcategories[i]
            safe_print(f"  {i+1}. {cat['name']} (ID: {cat['categoryId']})")
        
        if len(subcategories) > 10:
            safe_print(f"  ... and {len(subcategories) - 10} more")
        
        # Let user choose or default to first one
        try:
            choice = input(f"\nEnter number (1-{display_count}) or press Enter for first one: ").strip()
            if choice == "":
                selected_index = 0
            else:
                selected_index = int(choice) - 1
                if selected_index < 0 or selected_index >= display_count:
                    safe_print("[ERROR] Invalid choice, using first subcategory")
                    selected_index = 0
        except ValueError:
            safe_print("[ERROR] Invalid input, using first subcategory")
            selected_index = 0
        
        selected_category = subcategories[selected_index]
        
        safe_print(f"\n[TEST] Testing subcategory: {selected_category['name']}")
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
                    for i, img in enumerate(detailed_product.get('images', [])[:3]):
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
    
    args = parser.parse_args()
    
    safe_print("[START] Professional Amazon Product Scraper")
    safe_print("=" * 60)
    safe_print(f"[MARKET] Target country: {args.country.upper()}")
    
    scraper = AmazonScraper(market=args.country)
    
    if not scraper.categories:
        safe_print("[ERROR] No categories found!")
        exit(1)
    
    safe_print(f"[OK] Loaded {len(scraper.categories)} categories")
    safe_print(f"[OPTIMIZATION] Only scraping subcategories (level 1) with targetKeywords")
    safe_print(f"[TARGET] Quality filters: {scraper.min_rating}+ stars, {scraper.min_price}{scraper.config['currency_symbol']}+ price")
    
    # Count subcategories for accurate reporting
    subcategories = [cat for cat in scraper.categories if cat.get('level') == 1]
    safe_print(f"[TARGET] Found {len(subcategories)} subcategories to scrape")
    
    # Handle test single mode
    if args.test_single:
        safe_print("\n[TEST] Single subcategory test mode")
        scraper.test_single_subcategory()
        exit(0)
    
    print("\nChoose scraping mode:")
    print(f"1. Sample scraping (5 subcategories) - Quick test")
    print(f"2. Full scraping ({len(subcategories)} subcategories) - Complete catalog")
    print(f"3. Test single subcategory - Test one specific subcategory")
    
    choice = input("\nEnter choice (1, 2, or 3): ").strip()
    
    if choice == "1":
        safe_print("\n[START] Running SAMPLE scraping...")
        scraper.scrape_sample_categories(5)
    elif choice == "2":
        safe_print("\n[START] Running FULL scraping...")
        response = input("This will take several hours. Continue? (y/N): ")
        if response.lower() == 'y':
            scraper.scrape_all_categories()
        else:
            safe_print("[ERROR] Cancelled.")
    elif choice == "3":
        safe_print("\n[TEST] Single subcategory test mode")
        scraper.test_single_subcategory()
    else:
        safe_print("[ERROR] Invalid choice. Exiting.") 