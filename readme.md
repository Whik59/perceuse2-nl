# Step 1: Discover keywords for main categories
python scripts/amazon-keyword-scraper.py "massage" --market fr 
python scripts/ai-category-generator.py massage --language french --min-categories 3 --max-categories 5




# Step 3: Scrape actual products
python scripts/amazon-product-scraper.py --country fr



# Step 5: Enhance with AI

python scripts/ai-product-enhancer.py --language french --mode ultra-fast --workers 50

 python scripts\create-category-products-index.py

python scripts/ai_category_enhancer.py --language french --all




python scripts/generate_sitemap.py --site-url 

