import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import { getString, getSiteConfig } from '../../../lib/utils';
import { ChevronRight, FileText, Building, User, Globe, Mail } from 'lucide-react';

// Get site configuration for metadata
const config = getSiteConfig();

// SEO Metadata
export const metadata: Metadata = {
  title: `Mentions Légales | ${config.siteName}`,
  description: `Mentions légales et informations sur ${config.siteName}. Coordonnées de l'entreprise et informations légales obligatoires.`,
  robots: 'index, follow',
};

const LegalPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Building className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
              <h1 className="text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                {getString('legal.title')}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {getString('legal.subtitle')}
              </p>
              <div className="mt-6 text-sm text-gray-400">
                {getString('legal.lastUpdated')}: {getString('legal.lastUpdatedDate')}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                {getString('common.home')}
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{getString('legal.title')}</span>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8 lg:p-12">

                {/* Company Information */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Building className="w-6 h-6 mr-3 text-blue-600" />
                    {getString('legal.company.title')}
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.company.name')}</h3>
                        <p className="text-gray-600">{getString('common.companyName')}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.company.status')}</h3>
                        <p className="text-gray-600">{getString('legal.company.statusValue')}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.company.siret')}</h3>
                        <p className="text-gray-600">{getString('legal.company.siretValue')}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.company.vat')}</h3>
                        <p className="text-gray-600">{getString('legal.company.vatValue')}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Mail className="w-6 h-6 mr-3 text-green-600" />
                    {getString('legal.contact.title')}
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.contact.address')}</h3>
                        <p className="text-gray-600">{getString('legal.contact.addressValue')}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.contact.phone')}</h3>
                        <p className="text-gray-600">{getString('legal.contact.phoneValue')}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.contact.email')}</h3>
                        <p className="text-gray-600">{getString('legal.contact.emailValue')}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Publication Director */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-3 text-purple-600" />
                    {getString('legal.director.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('legal.director.content')}</p>
                  </div>
                </section>

                {/* Hosting */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Globe className="w-6 h-6 mr-3 text-red-600" />
                    {getString('legal.hosting.title')}
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.hosting.provider')}</h3>
                        <p className="text-gray-600">{getString('legal.hosting.providerValue')}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{getString('legal.hosting.address')}</h3>
                        <p className="text-gray-600">{getString('legal.hosting.addressValue')}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Intellectual Property */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('legal.intellectual.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('legal.intellectual.content1')}</p>
                    <p className="mb-4">{getString('legal.intellectual.content2')}</p>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('legal.liability.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('legal.liability.content1')}</p>
                    <p className="mb-4">{getString('legal.liability.content2')}</p>
                  </div>
                </section>

                {/* Personal Data */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('legal.data.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('legal.data.content')}</p>
                    <Link 
                      href="/privacy" 
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {getString('legal.data.privacyLink')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </section>

                {/* Applicable Law */}
                <section className="bg-gray-50 rounded-xl p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('legal.law.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('legal.law.content')}</p>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LegalPage; 