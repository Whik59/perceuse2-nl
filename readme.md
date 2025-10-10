# Step 1: Discover keywords for main categories
python scripts/amazon-keyword-scraper.py "massage" --market de 
python scripts/ai-category-generator.py massage --language german --min-categories 40 --max-categories 50




# Step 3: Scrape actual products
python scripts/amazon-product-scraper.py --country fr
 python scripts\create-category-products-index.py



# Step 5: Enhance with AI

python scripts/ai-product-enhancer.py --language french --mode ultra-fast --workers 50



python scripts/ai_category_enhancer.py --language french --all




python scripts/generate_sitemap.py 

