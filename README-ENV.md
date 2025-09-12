# Environment Variables Configuration

## Required Environment Variables

To properly configure your Ma Peluche store, set the following environment variables:

### Site Configuration
```bash
SITE_NAME="Ma Peluche"
COMPANY_NAME="Ma Peluche SARL"
SITE_URL="https://mapeluche.com"
```

### Contact Information
```bash
CONTACT_EMAIL="contact@mapeluche.com"
BUSINESS_ADDRESS="123 Rue du Commerce, 75001 Paris, France"
BUSINESS_PHONE="+33 1 23 45 67 89"
```

### Business Registration
```bash
BUSINESS_SIRET="123 456 789 00012"
BUSINESS_VAT="FR12 123456789"
BUSINESS_LEGAL_FORM="SARL (Société à Responsabilité Limitée)"
```

### Legal Information
```bash
LEGAL_LAST_UPDATED="15 janvier 2024"
HOSTING_PROVIDER="Vercel Inc."
HOSTING_ADDRESS="340 S Lemon Ave #4133, Walnut, CA 91789, USA"
```

### SEO Configuration
```bash
SEO_DEFAULT_TITLE="Ma Peluche - Peluches de Qualité Exceptionnelle"
SEO_DEFAULT_DESCRIPTION="Boutique en ligne spécialisée dans les peluches premium avec livraison gratuite et garantie satisfaction."
SEO_KEYWORDS="peluches,doudou,jouets,enfant,qualité,livraison gratuite"
```

### Business Features
```bash
FREE_SHIPPING_THRESHOLD="50"
RETURN_PERIOD_DAYS="14"
WARRANTY_PERIOD="2 ans"
```

### Payment Configuration
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
```

### AWS S3 Configuration (for product images)
```bash
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-west-1"
AWS_S3_BUCKET="mapeluche-images"
```

## Dynamic Configuration System

### How It Works

1. **Configuration File**: All environment variables are centralized in `lib/config.ts`
2. **String Templates**: `locales/strings.json` uses placeholder templates like `{SITE_NAME}`, `{COMPANY_NAME}`, etc.
3. **Dynamic Replacement**: The `getString()` function automatically replaces placeholders with actual values
4. **Fallback Values**: If environment variables are not set, sensible defaults are used

### Supported Placeholders

All legal pages and content support these dynamic placeholders:

- `{SITE_NAME}` - Site name (e.g., "Ma Peluche")
- `{COMPANY_NAME}` - Legal company name (e.g., "Ma Peluche SARL")
- `{CONTACT_EMAIL}` - Business contact email
- `{BUSINESS_ADDRESS}` - Complete business address
- `{BUSINESS_PHONE}` - Business phone number
- `{BUSINESS_SIRET}` - SIRET registration number
- `{BUSINESS_VAT}` - VAT registration number
- `{BUSINESS_LEGAL_FORM}` - Legal business structure
- `{LAST_UPDATED}` - Last update date for legal documents
- `{HOSTING_PROVIDER}` - Website hosting provider
- `{HOSTING_ADDRESS}` - Hosting provider address

### Usage Example

```typescript
// In any component
import { getString } from '../lib/utils';

// This will automatically replace {COMPANY_NAME} with the actual company name
const companyInfo = getString('legal.company.name');

// You can also provide custom replacements
const customText = getString('some.template', { 
  CUSTOM_PLACEHOLDER: 'Custom Value' 
});
```

## Legal Pages Configuration

The legal pages (Privacy Policy, Terms of Service, Legal Notice) are automatically configured to use:

- **Environment variables** for all business information
- **Dynamic string replacement** for all content
- **Fallback values** if environment variables are not set
- **Proper French legal compliance** formatting

## Site Configuration

Company information is also managed in `data/site-config.json` for:
- Site metadata
- Business contact information  
- SEO configuration
- Payment provider settings

## Deployment

When deploying your application:

1. Set all required environment variables in your hosting platform
2. Update `data/site-config.json` with your specific business information
3. All legal pages and content will automatically use the configured values
4. No code changes needed - everything is dynamically generated

## Example .env File

```bash
# Create a .env.local file with your specific values:
SITE_NAME="Your Store Name"
COMPANY_NAME="Your Company SARL"
CONTACT_EMAIL="contact@yourstore.com"
BUSINESS_ADDRESS="Your Business Address"
BUSINESS_PHONE="Your Phone Number"
# ... add all other variables as needed
``` 