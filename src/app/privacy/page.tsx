import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import Author from '../../../components/Author';
import { getString, getSiteConfig } from '../../../lib/utils';
import { getAuthor } from '../../../lib/getAuthor';
import { ChevronRight, Shield, Lock, Eye, FileText } from 'lucide-react';

// Get site configuration for metadata
const config = getSiteConfig();

// SEO Metadata
export const metadata: Metadata = {
  title: `${getString('privacy.title')} | ${config.siteName}`,
  description: `${getString('privacy.introduction')} ${getString('privacy.title')} detallada para ${config.siteName}.`,
  robots: 'index, follow',
};

const PrivacyPage: React.FC = () => {
  const author = getAuthor();
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-6 text-blue-400" />
              <h1 className="text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                {getString('privacy.title')}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {getString('privacy.subtitle')}
              </p>
              <div className="mt-6 text-sm text-gray-400">
                {getString('privacy.lastUpdated')}: {getString('privacy.lastUpdatedDate')}
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
              <span className="font-medium text-gray-900">{getString('privacy.title')}</span>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8 lg:p-12">
                
                {/* Introduction */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-blue-600" />
                    {getString('privacy.introduction.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.introduction.content1')}</p>
                    <p className="mb-4">{getString('privacy.introduction.content2')}</p>
                  </div>
                </section>

                {/* Data Collection */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Eye className="w-6 h-6 mr-3 text-green-600" />
                    {getString('privacy.dataCollection.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.dataCollection.intro')}</p>
                    <ul className="space-y-2 mb-6">
                      <li>• {getString('privacy.dataCollection.personalInfo')}</li>
                      <li>• {getString('privacy.dataCollection.contactInfo')}</li>
                      <li>• {getString('privacy.dataCollection.paymentInfo')}</li>
                      <li>• {getString('privacy.dataCollection.navigationInfo')}</li>
                    </ul>
                  </div>
                </section>

                {/* Data Usage */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-purple-600" />
                    {getString('privacy.dataUsage.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.dataUsage.intro')}</p>
                    <ul className="space-y-2 mb-6">
                      <li>• {getString('privacy.dataUsage.orderProcessing')}</li>
                      <li>• {getString('privacy.dataUsage.customerService')}</li>
                      <li>• {getString('privacy.dataUsage.marketing')}</li>
                      <li>• {getString('privacy.dataUsage.improvements')}</li>
                    </ul>
                  </div>
                </section>

                {/* Data Protection */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Lock className="w-6 h-6 mr-3 text-red-600" />
                    {getString('privacy.dataProtection.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.dataProtection.content1')}</p>
                    <p className="mb-4">{getString('privacy.dataProtection.content2')}</p>
                  </div>
                </section>

                {/* User Rights */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('privacy.userRights.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.userRights.intro')}</p>
                    <ul className="space-y-2 mb-6">
                      <li>• {getString('privacy.userRights.access')}</li>
                      <li>• {getString('privacy.userRights.rectification')}</li>
                      <li>• {getString('privacy.userRights.deletion')}</li>
                      <li>• {getString('privacy.userRights.portability')}</li>
                      <li>• {getString('privacy.userRights.opposition')}</li>
                    </ul>
                  </div>
                </section>

                {/* Cookies */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('privacy.cookies.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.cookies.content1')}</p>
                    <p className="mb-4">{getString('privacy.cookies.content2')}</p>
                  </div>
                </section>

                {/* Contact */}
                <section className="bg-gray-50 rounded-xl p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('privacy.contact.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('privacy.contact.content')}</p>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{getString('privacy.contact.email')}</p>
                      <p className="text-gray-600 mb-4">{getString('privacy.contact.address')}</p>
                      <p className="text-sm text-gray-500">{getString('privacy.contact.responseTime')}</p>
                    </div>
                  </div>
                </section>

                {/* Author Section */}
                <div className="mt-16 bg-slate-50 py-16 border-t border-slate-100 -mx-8 px-8">
                  <Author 
                    author={author}
                    productCategory="boormachines"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage; 