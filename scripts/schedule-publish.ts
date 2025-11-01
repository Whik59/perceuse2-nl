/*
  Scheduling script: adds `publish` and `publishAt` to data files.
  - Prioritizes categories first (from data/categories.json), then products (from data/products/*.json)
  - Writes an aggregated queue to data/publish-queue.json

  Run (Node 18+):
    npx tsx scripts/schedule-publish.ts

  Optional arguments:
    --startDate <isodate>   (e.g., "2025-11-01T08:00:00Z")
    --dailyCategories <num>   (e.g., 5)
    --dailyProducts <num>     (e.g., 50)
    --intervalMinutes <num>   (e.g., 60)
    --dryRun                  (e.g., --dryRun)
*/

import fs from 'fs';
import path from 'path';

// Helper to parse CLI args, with fallback to environment variables
function getArg(name: string, defaultValue: string): string {
    const flag = `--${name}`;
    const argIndex = process.argv.indexOf(flag);
    if (argIndex > -1 && process.argv[argIndex + 1]) {
        return process.argv[argIndex + 1];
    }
    // Check for boolean flag without value
    if (argIndex > -1 && (name === 'dryRun')) {
        return 'true';
    }
    return process.env[name.toUpperCase()] || defaultValue;
}

type QueueItem = {
  type: 'category' | 'product';
  slug: string;
  filePath: string;
  publishAt: string; // ISO
};

const root = process.cwd();
const categoriesJsonPath = path.join(root, 'data', 'categories.json');
const categoriesDir = path.join(root, 'data', 'categories');
const productsDir = path.join(root, 'data', 'products');
const queueOutPath = path.join(root, 'data', 'publish-queue.json');

const START_DATE = new Date(getArg('startDate', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()));
const DAILY_CATEGORIES = parseInt(getArg('dailyCategories', '5'), 10);
const DAILY_PRODUCTS = parseInt(getArg('dailyProducts', '50'), 10);
const INTERVAL_MINUTES = parseInt(getArg('intervalMinutes', '60'), 10);
const DRY_RUN = getArg('dryRun', 'false').toLowerCase() === 'true';

function isoAt(date: Date): string {
  return new Date(date).toISOString();
}

function nextSlots(total: number, perDay: number, start: Date, intervalMinutes: number): Date[] {
  const slots: Date[] = [];
  let dayCursor = new Date(start);
  let publishedToday = 0;

  for (let i = 0; i < total; i++) {
    if (publishedToday >= perDay) {
      // move to next day at same time of day as START_DATE
      const nextDay = new Date(dayCursor);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      nextDay.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), 0);
      dayCursor = nextDay;
      publishedToday = 0;
    }

    // distribute within the day using interval
    const slot = new Date(dayCursor.getTime() + (publishedToday * intervalMinutes * 60 * 1000));
    slots.push(slot);
    publishedToday++;
  }

  return slots;
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch (e) {
    return null;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function main() {
  const queue: QueueItem[] = [];

  // 1) Collect categories from categories.json (main + subcategories)
  const categoriesRoot = readJson<any[]>(categoriesJsonPath) || [];
  const flatCategories: { slug: string; isSub?: boolean }[] = [];
  for (const cat of categoriesRoot) {
    if (cat && typeof cat.slug === 'string') flatCategories.push({ slug: cat.slug });
    if (Array.isArray(cat?.subcategories)) {
      for (const sub of cat.subcategories) {
        if (sub && typeof sub.slug === 'string') flatCategories.push({ slug: `${cat.slug}/${sub.slug}` });
      }
    }
  }

  // 2) Collect products from data/products/*.json
  const productFiles = fs.existsSync(productsDir)
    ? fs.readdirSync(productsDir).filter(f => f.endsWith('.json'))
    : [];
  const products: { slug: string; filePath: string }[] = [];
  for (const fileName of productFiles) {
    const fp = path.join(productsDir, fileName);
    const data = readJson<any>(fp);
    if (!data) continue;
    const slug: string = data.slug || fileName.replace(/\.json$/i, '').toLowerCase();
    products.push({ slug, filePath: fp });
  }

  // 3) Build schedule: categories first, then products
  const catSlots = nextSlots(flatCategories.length, Math.max(1, DAILY_CATEGORIES), START_DATE, INTERVAL_MINUTES);
  const prodStart = catSlots.length > 0 ? new Date(catSlots[catSlots.length - 1].getTime() + INTERVAL_MINUTES * 60 * 1000) : START_DATE;
  const prodSlots = nextSlots(products.length, Math.max(1, DAILY_PRODUCTS), prodStart, INTERVAL_MINUTES);

  // 4) Apply to categories.json structure (add publish/publishAt)
  {
    let idx = 0;
    for (let i = 0; i < categoriesRoot.length; i++) {
      const cat = categoriesRoot[i];
      if (!cat) continue;

      // main
      if (typeof cat.slug === 'string') {
        const slot = catSlots[idx++];
        if (slot) {
          if (!cat.publish) cat.publish = false; // default until date is reached
          if (!cat.publishAt) cat.publishAt = isoAt(slot);
        }
      }

      // subs
      if (Array.isArray(cat.subcategories)) {
        for (let j = 0; j < cat.subcategories.length; j++) {
          const sub = cat.subcategories[j];
          if (sub && typeof sub.slug === 'string') {
            const slot = catSlots[idx++];
            if (slot) {
              if (!sub.publish) sub.publish = false;
              if (!sub.publishAt) sub.publishAt = isoAt(slot);
            }
          }
        }
      }
    }

    if (!DRY_RUN) writeJson(categoriesJsonPath, categoriesRoot);

    // queue entries for categories (use categories dir files if exist to provide filePath context)
    idx = 0;
    for (const fc of flatCategories) {
      const slot = catSlots[idx++];
      if (!slot) break;
      // Attempt resolve per-category file; otherwise reference categories.json
      const guessed = path.join(categoriesDir, `${fc.slug.replace(/\//g, '-')}.json`);
      const filePath = fs.existsSync(guessed) ? guessed : categoriesJsonPath;
      queue.push({ type: 'category', slug: fc.slug, filePath, publishAt: isoAt(slot) });
    }
  }

  // 5) Apply to products files
  {
    let idx = 0;
    for (const p of products) {
      const slot = prodSlots[idx++];
      if (!slot) break;
      const data = readJson<any>(p.filePath) || {};
      if (data.publish === undefined) data.publish = false; // default until date is reached
      if (!data.publishAt) data.publishAt = isoAt(slot);
      if (!DRY_RUN) writeJson(p.filePath, data);
      queue.push({ type: 'product', slug: p.slug, filePath: p.filePath, publishAt: isoAt(slot) });
    }
  }

  // 6) Write queue
  if (!DRY_RUN) writeJson(queueOutPath, { generatedAt: isoAt(new Date()), daily: { categories: DAILY_CATEGORIES, products: DAILY_PRODUCTS }, startDate: isoAt(START_DATE), intervalMinutes: INTERVAL_MINUTES, items: queue });

  // 7) Output summary
  console.log(`\nScheduling complete${DRY_RUN ? ' (dry-run)' : ''}.`);
  console.log(`  Categories scheduled: ${flatCategories.length} (daily ${DAILY_CATEGORIES})`);
  console.log(`  Products scheduled:   ${products.length} (daily ${DAILY_PRODUCTS})`);
  console.log(`  First slot:           ${isoAt(START_DATE)}`);
  if (!DRY_RUN) console.log(`  Queue written:        ${queueOutPath}`);
}

main().catch((e) => {
  console.error('Scheduling failed:', e);
  process.exit(1);
});


