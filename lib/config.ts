// Configuration utility for environment variables
export const siteConfig = {
  // Site Information
  siteName: process.env.SITE_NAME || 'Airfryer Kaufen',
  companyName: process.env.COMPANY_NAME || 'Airfryer GmbH',
  siteUrl: process.env.SITE_URL || 'https://mapeluche.com',
  
  // Business Information
  business: {
    email: process.env.CONTACT_EMAIL || 'contact@mapeluche.com',
    phone: process.env.BUSINESS_PHONE || '+33 1 23 45 67 89',
    address: process.env.BUSINESS_ADDRESS || '123 Rue du Commerce, 75001 Paris, France',
    siret: process.env.BUSINESS_SIRET || '123 456 789 00012',
    vat: process.env.BUSINESS_VAT || 'FR12 123456789',
    legalForm: process.env.BUSINESS_LEGAL_FORM || 'SARL (Société à Responsabilité Limitée)'
  },
  
  // Legal Information
  legal: {
    lastUpdated: process.env.LEGAL_LAST_UPDATED || '15 janvier 2024',
    hostingProvider: process.env.HOSTING_PROVIDER || 'Vercel Inc.',
    hostingAddress: process.env.HOSTING_ADDRESS || '340 S Lemon Ave #4133, Walnut, CA 91789, USA'
  },
  
  // SEO
  seo: {
    defaultTitle: process.env.SEO_DEFAULT_TITLE || 'Ma Peluche - Peluches de Qualité Exceptionnelle',
    defaultDescription: process.env.SEO_DEFAULT_DESCRIPTION || 'Boutique en ligne spécialisée dans les peluches premium avec livraison gratuite et garantie satisfaction.',
    keywords: process.env.SEO_KEYWORDS?.split(',') || ['peluches', 'doudou', 'jouets', 'enfant', 'qualité', 'livraison gratuite']
  },
  
  // Features
  features: {
    freeShippingThreshold: parseInt(process.env.FREE_SHIPPING_THRESHOLD || '50'),
    returnPeriod: parseInt(process.env.RETURN_PERIOD_DAYS || '14'),
    warrantyPeriod: process.env.WARRANTY_PERIOD || '2 ans'
  }
};

// Helper function to get dynamic strings with environment variables
export const getDynamicString = (template: string, replacements: Record<string, string> = {}): string => {
  let result = template;
  
  // Replace common placeholders
  result = result.replace(/\{SITE_NAME\}/g, siteConfig.siteName);
  result = result.replace(/\{COMPANY_NAME\}/g, siteConfig.companyName);
  result = result.replace(/\{CONTACT_EMAIL\}/g, siteConfig.business.email);
  result = result.replace(/\{BUSINESS_ADDRESS\}/g, siteConfig.business.address);
  result = result.replace(/\{BUSINESS_PHONE\}/g, siteConfig.business.phone);
  result = result.replace(/\{BUSINESS_SIRET\}/g, siteConfig.business.siret);
  result = result.replace(/\{BUSINESS_VAT\}/g, siteConfig.business.vat);
  result = result.replace(/\{BUSINESS_LEGAL_FORM\}/g, siteConfig.business.legalForm);
  result = result.replace(/\{LAST_UPDATED\}/g, siteConfig.legal.lastUpdated);
  result = result.replace(/\{HOSTING_PROVIDER\}/g, siteConfig.legal.hostingProvider);
  result = result.replace(/\{HOSTING_ADDRESS\}/g, siteConfig.legal.hostingAddress);
  
  // Replace any additional custom replacements
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return result;
}; 