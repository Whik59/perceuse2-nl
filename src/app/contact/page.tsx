import React from 'react';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import { getString } from '../../../lib/utils';

export const metadata: Metadata = {
  title: `${getString('legal.contact.title')} | ${getString('common.siteName')}`,
  description: getString('legal.contact.description', { domainName: getString('common.domainName') }),
  robots: 'index, follow',
};

const ContactPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {getString('legal.contact.title')}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.contact.information.title')}
              </h2>
              <p>{getString('legal.contact.information.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.contact.contact.title')}
              </h2>
              <p className="whitespace-pre-line">{getString('legal.contact.contact.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.contact.horaires.title')}
              </h2>
              <p>{getString('legal.contact.horaires.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.contact.reponse.title')}
              </h2>
              <p>{getString('legal.contact.reponse.content')}</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
