# Step 1: Discover keywords for main categories
python scripts/amazon-keyword-scraper.py "robot" --market es 


# Step 2: Create category structure
python scripts/create-category-hierarchy.py

# Step 3: Scrape actual products
python scripts/amazon-product-scraper.py --country de

step 4 rely categories products 

 python scripts\create-category-products-index.py

# Step 4: Enhance with AI
# German output
python scripts/ai_category_enhancer.py --language german --all

python scripts/ai-product-enhancer.py --language german --mode ultra-fast --workers 50


python scripts/generate_sitemap.py --site-url https://kaufen-staubsauger.de

