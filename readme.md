# Step 1: Discover keywords for main categories
python scripts/amazon-keyword-scraper.py "sofa" --market de 
python scripts/ai-category-generator.py "sofa" --language german --min-categories 35 --max-categories 50




# Step 3: Scrape actual products
python scripts/amazon-product-scraper.py --country de
 python scripts\create-category-products-index.py



# Step 5: Enhance with AI

python scripts/ai-product-enhancer.py --language german --mode ultra-fast --workers 40



python scripts/ai_category_enhancer.py --language german --all




python scripts/generate_sitemap.py 



git remote -v



git remote remove origin; git remote add origin https://github.com/Whik59/drone-nl; git add .; git commit -m "german template"; git push --force origin main



python scripts/pipeline.py "drone" "nl" --language dutch --min-categories 1 --max-categories 1

