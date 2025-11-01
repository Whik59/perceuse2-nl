import { notFound } from 'next/navigation';
import { getCategoryBySlug, getCategories } from '../../../../lib/getCategories';
import { getProducts } from '../../../../lib/getProducts';
import { generateCategorySEO } from '../../../../lib/seo';
import { getLocalizedSiteConfig } from '../../../../lib/utils';
import type { Metadata } from 'next';
import CategoryClient from './CategoryClient';

interface CategoryPageProps {
  params: {
    slug: string[];
  };
}

// Generate dynamic metadata for category pages
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const fullSlug = params.slug.join('/');
  const category = getCategoryBySlug(fullSlug);
  
  if (!category) {
    return {
      title: 'Catégorie non trouvée',
      description: 'La catégorie demandée n\'a pas été trouvée.',
    };
  }

  const siteConfig = getLocalizedSiteConfig();
  const seoData = generateCategorySEO(category, siteConfig);
  
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
          url: seoData.ogImage || '/default-category.jpg',
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
      images: [seoData.ogImage || '/default-category.jpg'],
    },
    alternates: {
      canonical: seoData.canonical,
    },
    other: {
      'application/ld+json': JSON.stringify(seoData.structuredData),
    },
  };
}

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = await getCategories(); // This now only returns published categories
  
  return categories.map((category) => ({
    slug: category.slug.split('/'),
  }));
}

// Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const fullSlug = params.slug.join('/');
  const category = getCategoryBySlug(fullSlug);
  
  if (!category || (category.publishAt && new Date(category.publishAt) > new Date())) {
    notFound();
  }

  const categories = await getCategories();
  const products = getProducts();
  
  return <CategoryClient category={category} categories={categories} products={products} />;
};

export default CategoryPage;
