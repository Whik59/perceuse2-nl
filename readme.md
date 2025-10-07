# Step 1: Discover keywords for main categories
python scripts/amazon-keyword-scraper.py "patinete electrico" --market es 


# Step 2: Create category structure
python scripts/create-category-hierarchy.py

# Step 3: Scrape actual products
python scripts/amazon-product-scraper.py

# Step 4: Enhance with AI
python scripts/ai_category_enhancer.py
python scripts/ai-product-enhancer.py