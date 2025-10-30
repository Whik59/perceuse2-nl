import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import Author from '../../../components/Author';
import { getString, getSiteConfig } from '../../../lib/utils';
import { getAuthor } from '../../../lib/getAuthor';
import { ChevronRight, FileText, Scale, ShoppingCart, Truck, RefreshCw } from 'lucide-react';

// Get site configuration for metadata
const config = getSiteConfig();

// SEO Metadata
export const metadata: Metadata = {
  title: `Conditions Générales de Vente | ${config.siteName}`,
  description: `Consultez nos conditions générales de vente. Tout ce que vous devez savoir sur vos achats chez ${config.siteName}.`,
  robots: 'index, follow',
};

const TermsPage: React.FC = () => {
  const author = getAuthor();
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Scale className="w-16 h-16 mx-auto mb-6 text-green-400" />
              <h1 className="text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                {getString('terms.title')}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {getString('terms.subtitle')}
              </p>
              <div className="mt-6 text-sm text-gray-400">
                {getString('terms.lastUpdated')}: {getString('terms.lastUpdatedDate')}
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
              <span className="font-medium text-gray-900">{getString('terms.title')}</span>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8 lg:p-12">

                {/* General Information */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-blue-600" />
                    {getString('terms.general.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.general.content1')}</p>
                    <p className="mb-4">{getString('terms.general.content2')}</p>
                  </div>
                </section>

                {/* Orders */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <ShoppingCart className="w-6 h-6 mr-3 text-green-600" />
                    {getString('terms.orders.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.orders.process')}</p>
                    <p className="mb-4">{getString('terms.orders.confirmation')}</p>
                    <p className="mb-4">{getString('terms.orders.payment')}</p>
                  </div>
                </section>

                {/* Prices */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('terms.prices.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.prices.currency')}</p>
                    <p className="mb-4">{getString('terms.prices.taxes')}</p>
                    <p className="mb-4">{getString('terms.prices.changes')}</p>
                  </div>
                </section>

                {/* Delivery */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Truck className="w-6 h-6 mr-3 text-purple-600" />
                    {getString('terms.delivery.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.delivery.times')}</p>
                    <p className="mb-4">{getString('terms.delivery.zones')}</p>
                    <p className="mb-4">{getString('terms.delivery.costs')}</p>
                    <p className="mb-4">{getString('terms.delivery.responsibility')}</p>
                  </div>
                </section>

                {/* Returns */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <RefreshCw className="w-6 h-6 mr-3 text-red-600" />
                    {getString('terms.returns.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.returns.period')}</p>
                    <p className="mb-4">{getString('terms.returns.conditions')}</p>
                    <p className="mb-4">{getString('terms.returns.process')}</p>
                    <p className="mb-4">{getString('terms.returns.costs')}</p>
                  </div>
                </section>

                {/* Warranty */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('terms.warranty.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.warranty.duration')}</p>
                    <p className="mb-4">{getString('terms.warranty.coverage')}</p>
                    <p className="mb-4">{getString('terms.warranty.exclusions')}</p>
                  </div>
                </section>

                {/* Liability */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('terms.liability.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.liability.limitations')}</p>
                    <p className="mb-4">{getString('terms.liability.force_majeure')}</p>
                  </div>
                </section>

                {/* Applicable Law */}
                <section className="bg-gray-50 rounded-xl p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {getString('terms.law.title')}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-4">{getString('terms.law.content')}</p>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{getString('terms.contact.title')}</p>
                      <p className="text-gray-600 mb-2">{getString('terms.contact.email')}</p>
                      <p className="text-gray-600">{getString('terms.contact.address')}</p>
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

export default TermsPage; 