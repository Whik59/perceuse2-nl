import React from 'react';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import { getString } from '../../../lib/utils';

export const metadata: Metadata = {
  title: `${getString('legal.cookies.title')} | ${getString('common.siteName')}`,
  description: getString('legal.cookies.description'),
  robots: 'index, follow',
};

const CookiesPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {getString('legal.cookies.title')}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cookies.definition.title')}
              </h2>
              <p>{getString('legal.cookies.definition.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cookies.types.title')}
              </h2>
              <p>{getString('legal.cookies.types.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cookies.utilisation.title')}
              </h2>
              <p>{getString('legal.cookies.utilisation.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cookies.gestion.title')}
              </h2>
              <p>{getString('legal.cookies.gestion.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cookies.contact.title')}
              </h2>
              <p>{getString('legal.cookies.contact.content')}</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CookiesPage;
