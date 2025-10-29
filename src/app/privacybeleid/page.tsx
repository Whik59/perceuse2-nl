import React from 'react';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import { getString } from '../../../lib/utils';

export const metadata: Metadata = {
  title: `${getString('legal.politiqueConfidentialite.title')} | ${getString('common.siteName')}`,
  description: getString('legal.politiqueConfidentialite.description', { domainName: getString('common.domainName') }),
  robots: 'index, follow',
};

const PrivacybeleidPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {getString('legal.politiqueConfidentialite.title')}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.politiqueConfidentialite.introduction.title')}
              </h2>
              <p>{getString('legal.politiqueConfidentialite.introduction.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.politiqueConfidentialite.collecte.title')}
              </h2>
              <p>{getString('legal.politiqueConfidentialite.collecte.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.politiqueConfidentialite.utilisation.title')}
              </h2>
              <p>{getString('legal.politiqueConfidentialite.utilisation.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.politiqueConfidentialite.cookies.title')}
              </h2>
              <p>{getString('legal.politiqueConfidentialite.cookies.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.politiqueConfidentialite.droits.title')}
              </h2>
              <p>{getString('legal.politiqueConfidentialite.droits.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.politiqueConfidentialite.contact.title')}
              </h2>
              <p>{getString('legal.politiqueConfidentialite.contact.content')}</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacybeleidPage;
