import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '../../../../lib/getProducts';
import { getCategories } from '../../../../lib/getCategories';
import { generateProductSEO } from '../../../../lib/seo';
import { getLocalizedSiteConfig } from '../../../../lib/utils';
import type { Metadata } from 'next';
import ProductClient from './ProductClient';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Generate dynamic metadata for product pages
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: 'Produit non trouvé',
      description: 'Le produit demandé n\'a pas été trouvé.',
    };
  }

  const siteConfig = getLocalizedSiteConfig();
  const seoData = generateProductSEO(product, siteConfig);
  
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
          url: seoData.ogImage || product.imagePaths[0],
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
      images: [seoData.ogImage || product.imagePaths[0]],
    },
    alternates: {
      canonical: seoData.canonical,
    },
    other: {
      'application/ld+json': JSON.stringify(seoData.structuredData),
    },
  };
}

// Generate static params for all products
export async function generateStaticParams() {
  const products = getProducts(); // This now only returns published products
  
  return products.map((product) => ({
    slug: product.slug,
  }));
}

// Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

const ProductPage = async ({ params }: ProductPageProps) => {
  const product = getProductBySlug(params.slug);
  
  if (!product || (product.publishAt && new Date(product.publishAt) > new Date())) {
    notFound();
  }

  const categories = await getCategories();
  
  return <ProductClient product={product} categories={categories} />;
};

export default ProductPage;
