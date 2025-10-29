import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import { Button } from '../../../components/ui/Button';
import { getString } from '../../../lib/utils';
import { 
  Star, 
  Check, 
  Mail, 
  Phone, 
  Clock,
  Shield,
  Award,
  Users,
  Heart,
  Target,
  Lightbulb,
  Globe
} from 'lucide-react';

const AboutPage: React.FC = () => {
  // Use static translations from common.json
  const aboutData = {
    hero: {
      title: getString('about.hero.title'),
      subtitle: getString('about.hero.subtitle')
    },
    introduction: getString('about.introduction'),
    mission: getString('about.mission'),
    whyChooseUs: [
      getString('about.whyChooseUs.quality'),
      getString('about.whyChooseUs.expertise'),
      getString('about.whyChooseUs.customerService'),
      getString('about.whyChooseUs.amazonPartnership'),
      getString('about.whyChooseUs.localSupport'),
      getString('about.whyChooseUs.trust')
    ],
    expertise: getString('about.expertise'),
    values: [
      {
        title: getString('about.values.quality.title'),
        description: getString('about.values.quality.description')
      },
      {
        title: getString('about.values.trust.title'),
        description: getString('about.values.trust.description')
      },
      {
        title: getString('about.values.customerFirst.title'),
        description: getString('about.values.customerFirst.description')
      },
      {
        title: getString('about.values.innovation.title'),
        description: getString('about.values.innovation.description')
      }
    ],
    contactInfo: {
      email: getString('siteConfig.business.email'),
      phone: getString('siteConfig.business.phone'),
      responseTime: "Binnen 24 uur"
    },
    trustSignals: [
      getString('about.trustSignals.amazonPartner'),
      getString('about.trustSignals.securePayment'),
      getString('about.trustSignals.fastDelivery'),
      getString('about.trustSignals.customerSupport')
    ]
  };

  return (
    <>
      <Head>
        <title>{aboutData.hero.title} | {getString('common.siteName')}</title>
        <meta name="description" content={aboutData.hero.subtitle} />
        <meta name="keywords" content="boormachines, about us, expertise, quality, customer service" />
        
        {/* Open Graph */}
        <meta property="og:title" content={aboutData.hero.title} />
        <meta property="og:description" content={aboutData.hero.subtitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/about`} />
        
        {/* About Us Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: getString('common.siteName'),
              description: aboutData.hero.subtitle,
              url: `${typeof window !== 'undefined' ? window.location.origin : ''}`,
              logo: `${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png`,
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: aboutData.contactInfo.phone,
                contactType: 'customer service',
                email: aboutData.contactInfo.email
              },
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'NL'
              },
              sameAs: [
                'https://www.linkedin.com/company/your-company'
              ]
            })
          }}
        />
      </Head>

      <Layout>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    {aboutData.hero.title}
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                    {aboutData.hero.subtitle}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2 bg-orange-100 rounded-lg px-4 py-2">
                    <Award className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">{getString('about.hero.expertise')}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-100 rounded-lg px-4 py-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">{getString('about.hero.trusted')}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-100 rounded-lg px-4 py-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">{getString('about.hero.customers')}</span>
                  </div>
                </div>
              </div>
              
              {/* Hero Image */}
              <div className="relative">
                <div className="aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <Image
                    src="/about-us.png"
                    alt={aboutData.hero.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500 rounded-full opacity-20"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-orange-300 rounded-full opacity-20"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg prose-gray max-w-none">
              <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {aboutData.introduction}
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {getString('about.missionTitle')}
              </h2>
            </div>
            <div className="prose prose-lg prose-gray max-w-none text-center">
              <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {aboutData.mission}
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {getString('about.whyChooseUsTitle')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getString('about.whyChooseUsSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aboutData.whyChooseUs.map((reason, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium leading-relaxed">{reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {getString('about.expertiseTitle')}
              </h2>
            </div>
            <div className="prose prose-lg prose-gray max-w-none text-center">
              <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {aboutData.expertise}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {getString('about.valuesTitle')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getString('about.valuesSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {aboutData.values.map((value, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Signals Section */}
        <section className="py-16 lg:py-24 bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                {getString('about.trustSignalsTitle')}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {getString('about.trustSignalsSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {aboutData.trustSignals.map((signal, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-medium">{signal}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {getString('about.contactTitle')}
              </h2>
              <p className="text-xl text-gray-600">
                {getString('about.contactSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">E-mail</h3>
                <p className="text-gray-600">{aboutData.contactInfo.email}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Telefoon</h3>
                <p className="text-gray-600">{aboutData.contactInfo.phone}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reactietijd</h3>
                <p className="text-gray-600">Binnen 24 uur</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
                  Contact Opnemen
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default AboutPage;
