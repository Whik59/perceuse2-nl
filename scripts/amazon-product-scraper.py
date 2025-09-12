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
        
        # Tier-based product limits
        self.tier_limits = {
            0: {"min": 50, "max": 100},  # Main categories
            1: {"min": 15, "max": 30},   # Subcategories  
            2: {"min": 3, "max": 8}      # Sub-subcategories
        }
        
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
        
        # Advanced headers
        session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
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
        
        # Add realistic cookies
        session.cookies.update({
            'session-id': f'262-{random.randint(1000000, 9999999)}-{random.randint(1000000, 9999999)}',
            'ubid-acbfr': f'262-{random.randint(1000000, 9999999)}-{random.randint(1000000, 9999999)}',
            'i18n-prefs': 'EUR',
            'lc-acbfr': 'fr_FR',
            'sp-cdn': 'L5Z9:FR',
        })
        
        return session
    
    def get_random_headers(self):
        """Get randomized headers for each request"""
        headers = {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
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
        """Load category structure"""
        try:
            with open("data/categories.json", 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            safe_print(f"[ERROR] Error loading categories: {e}")
            return []
    
    def search_products(self, keyword, page=1):
        """Search for products with advanced filtering"""
        # Build search URL with price filter
                    search_url = f"https://www.amazon{self.config['amazon_tld']}/s?k={keyword.replace(' ', '+')}&page={page}&low-price={self.min_price}&ref=sr_pg_{page}"
        
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
                            product['url'] = urljoin(f'https://www.amazon{self.config["amazon_tld"]}', href)
            
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
            
            # Generate affiliate URL
            product['amazon_url'] = product['url']
            product['affiliate_url'] = f"{product['url']}?tag={self.config['affiliate_tag']}"
            product['scraped_at'] = datetime.now().isoformat()
            
            return product
            
        except Exception as e:
            safe_print(f"[ERROR] Error extracting product: {str(e)}")
            return None
    
    def extract_brand_from_title(self, title):
        """Extract brand name from product title"""
        brands = [
            'Ninja', 'Philips', 'SEB', 'Moulinex', 'Tefal', 'Delonghi', 
            'Cosori', 'Cecotec', 'Princess', 'Tristar', 'Russell Hobbs',
            'Aigostar', 'Innsky', 'Proscenic', 'Tower', 'Klarstein',
            'Rowenta', 'Krups', 'Brandt', 'Electrolux'
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
        """Load market configuration from config file"""
        try:
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
                "affiliate_tag": "clickclickh01-21",
                "language": "french",
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
        """Scrape products for a specific category using parallel processing"""
        category_name = category['categoryNameCanonical']
        level = category['level']
        
        safe_print(f"\n[CATEGORY] Scraping: {category_name} (Level {level})")
        
        # Create search terms based on category name
        search_terms = self.create_search_terms(category_name, level)
        
        # Determine target count based on tier
        limits = self.tier_limits[level]
        target_count = random.randint(limits['min'], limits['max'])
        safe_print(f"[TARGET] Target: {target_count} products")
        
        all_products = []
        
        # Search with generated terms
        for keyword_idx, search_term in enumerate(search_terms[:2]):
            if len(all_products) >= target_count:
                break
                
            safe_print(f"[SEARCH] Term {keyword_idx + 1}: '{search_term}'")
            
            # Search multiple pages for this keyword
            for page in range(1, 4):  # Max 3 pages per keyword
                if len(all_products) >= target_count:
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
                        if len(all_products) >= target_count:
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
    parser.add_argument('--market', '-m', default='fr', 
                       choices=['fr', 'de', 'es', 'it', 'nl', 'pl', 'se', 'us'],
                       help='Target market (default: fr)')
    
    args = parser.parse_args()
    
    safe_print("[START] Professional Amazon Product Scraper")
    safe_print("=" * 60)
    safe_print(f"[MARKET] Target market: {args.market.upper()}")
    
    scraper = AmazonScraper(market=args.market)
    
    if not scraper.categories:
        safe_print("[ERROR] No categories found!")
        exit(1)
    
    safe_print(f"[OK] Loaded {len(scraper.categories)} categories")
    safe_print(f"[TARGET] Tier limits: {scraper.tier_limits}")
    safe_print(f"[TARGET] Quality filters: {scraper.min_rating}+ stars, {scraper.min_price}{scraper.config['currency_symbol']}+ price")
    
    print("\nChoose scraping mode:")
    print("1. Sample scraping (5 categories) - Quick test")
    print("2. Full scraping (87 categories) - Complete catalog")
    
    choice = input("\nEnter choice (1 or 2): ").strip()
    
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
    else:
        safe_print("[ERROR] Invalid choice. Exiting.") 