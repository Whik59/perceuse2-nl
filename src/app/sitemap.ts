import { getProducts } from '../../lib/getProducts';
import { getCategories } from '../../lib/getCategories';
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.your-domain.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Get all published products and categories
  const products = getProducts();
  const categories = await getCategories();

  // 2. Create sitemap entries for products
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 3. Create sitemap entries for categories
  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: new Date(), // Categories don't have an updatedAt yet, so we use current date
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Add static pages
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    // ... add other static pages here
  ];

  // 5. Combine and return
  return [...staticEntries, ...categoryEntries, ...productEntries];
}
