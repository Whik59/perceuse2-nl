# Step 1: Discover keywords for main categories
python scripts/amazon-keyword-scraper.py "arbre a chat" --market fr 
python scripts/ai-category-generator.py "arbre a chat" --language french --min-categories 1 --max-categories 1




# Step 3: Scrape actual products
python scripts/amazon-product-scraper.py --country fr
 python scripts\create-category-products-index.py



# Step 5: Enhance with AI

python scripts/ai-product-enhancer.py --language french --mode ultra-fast --workers 50



python scripts/ai_category_enhancer.py --language french --all




python scripts/generate_sitemap.py 



git remote -v
git remote remove origin
git remote add origin https://github.com/Whik59/massage-de

git add . ; git commit -m "update" ; git push origin main

