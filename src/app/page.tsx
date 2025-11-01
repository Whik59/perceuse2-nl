import { getProducts } from '../../lib/getProducts';
import { getCategories } from '../../lib/getCategories';
import { Product, Category } from '../../lib/types';
import HomeClient from './HomeClient';
import { generateHomepageSEO } from '../../lib/seo';
import { getLocalizedSiteConfig } from '../../lib/utils';
import type { Metadata } from 'next';

// Generate dynamic metadata for homepage
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getLocalizedSiteConfig();
  const seoData = generateHomepageSEO(siteConfig);
  
  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords?.join(', '),
    openGraph: {
      title: seoData.title,
      description: seoData.description,
      url: seoData.canonical,
      siteName: siteConfig.site.name,
      images: [
        {
          url: seoData.ogImage || '/logo.png',
          width: 1200,
          height: 630,
          alt: seoData.title,
        },
      ],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
      images: [seoData.ogImage || '/logo.png'],
    },
    alternates: {
      canonical: seoData.canonical,
    },
    other: {
      'application/ld+json': JSON.stringify(seoData.structuredData),
    },
  };
}

// Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

const HomePage = async () => {
  // Fetch data on the server
  const products: Product[] = getProducts();
  const categories: Category[] = await getCategories();

  return <HomeClient products={products} categories={categories} />;
};

export default HomePage;

