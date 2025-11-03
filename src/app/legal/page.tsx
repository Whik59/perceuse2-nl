import React from 'react';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import { getString } from '../../../lib/utils';

export const metadata: Metadata = {
  title: `${getString('legal.mentionsLegales.title')} | ${getString('common.siteName')}`,
  description: getString('legal.mentionsLegales.description', { domainName: getString('common.domainName') }),
  robots: 'index, follow',
};

const LegalInformationPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {getString('legal.mentionsLegales.title')}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.mentionsLegales.editeur.title')}
              </h2>
              <p>{getString('legal.mentionsLegales.editeur.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.mentionsLegales.hebergeur.title')}
              </h2>
              <p>{getString('legal.mentionsLegales.hebergeur.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.mentionsLegales.responsable.title')}
              </h2>
              <p>{getString('legal.mentionsLegales.responsable.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.mentionsLegales.propriete.title')}
              </h2>
              <p>{getString('legal.mentionsLegales.propriete.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.mentionsLegales.liens.title')}
              </h2>
              <p>{getString('legal.mentionsLegales.liens.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.mentionsLegales.contact.title')}
              </h2>
              <p>{getString('legal.mentionsLegales.contact.content')}</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LegalInformationPage;
