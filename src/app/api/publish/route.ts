import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { memoryCache, CACHE_KEYS } from '../../../../lib/cache';

// This is a secret key to prevent unauthorized access.
// You MUST set this in your Vercel environment variables.
const PUBLISH_SECRET = process.env.PUBLISH_SECRET;

type QueueItem = {
  type: 'category' | 'product';
  slug: string;
  filePath: string;
  publishAt: string;
};

// Use Edge Runtime for quick responses
export const runtime = 'nodejs'; // Must be nodejs for fs access

export async function POST(request: NextRequest) {
  // 1. Authenticate the request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${PUBLISH_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Load the publish queue
  const queuePath = path.join(process.cwd(), 'data', 'publish-queue.json');
  if (!fs.existsSync(queuePath)) {
    return NextResponse.json({ message: 'Publish queue not found.' }, { status: 404 });
  }

  const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
  const items: QueueItem[] = queueData.items || [];
  const now = new Date();

  // 3. Find items that are due for publishing
  const itemsToPublish = items.filter(item => new Date(item.publishAt) <= now);

  if (itemsToPublish.length === 0) {
    return NextResponse.json({ message: 'No items to publish at this time.' });
  }

  const publishedSlugs: string[] = [];
  let updatedCount = 0;

  // 4. Process each item
  for (const item of itemsToPublish) {
    try {
      const data = JSON.parse(fs.readFileSync(item.filePath, 'utf-8'));
      let itemUpdated = false;

      // Handle categories.json (which is an array) vs. product files (which are objects)
      if (item.type === 'category' && Array.isArray(data)) {
        let categoryFound = false;
        // Find the specific category/subcategory in the array
        for (const cat of data) {
          if (cat.slug === item.slug && cat.publish === false) {
            cat.publish = true;
            itemUpdated = true;
            categoryFound = true;
            break;
          }
          if (cat.subcategories) {
            for (const sub of cat.subcategories) {
              if (`${cat.slug}/${sub.slug}` === item.slug && sub.publish === false) {
                sub.publish = true;
                itemUpdated = true;
                categoryFound = true;
                break;
              }
            }
          }
          if (categoryFound) break;
        }
      } else if (item.type === 'product' && data.publish === false) {
        data.publish = true;
        itemUpdated = true;
      }

      // 5. If updated, write file and revalidate path
      if (itemUpdated) {
        fs.writeFileSync(item.filePath, JSON.stringify(data, null, 2), 'utf-8');
        const pathToRevalidate = item.type === 'product' ? `/product/${item.slug}` : `/category/${item.slug}`;
        revalidatePath(pathToRevalidate);
        
        // Also revalidate homepage and the main sitemap
        revalidatePath('/');
        revalidatePath('/sitemap.xml');
        
        // Clear relevant cache entries to ensure fresh data
        if (item.type === 'product') {
          memoryCache.delete(CACHE_KEYS.PRODUCTS_BY_SLUG(item.slug));
          memoryCache.delete(CACHE_KEYS.PRODUCTS_LIST);
        } else {
          memoryCache.delete(CACHE_KEYS.CATEGORY_BY_SLUG(item.slug));
          memoryCache.delete(CACHE_KEYS.CATEGORIES_LIST);
        }

        publishedSlugs.push(item.slug);
        updatedCount++;
      }
    } catch (error) {
      console.error(`Failed to process item ${item.slug}:`, error);
    }
  }

  return NextResponse.json({
    message: `Processed ${itemsToPublish.length} due items. Published ${updatedCount} new items.`,
    published: publishedSlugs,
  });
}
