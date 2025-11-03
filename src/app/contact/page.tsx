import React from 'react';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import Author from '../../../components/Author';
import { getString } from '../../../lib/utils';
import { getAuthor } from '../../../lib/getAuthor';

export const metadata: Metadata = {
  title: `${getString('legal.contact.title')} | ${getString('common.siteName')}`,
  description: getString('legal.contact.description', { domainName: getString('common.domainName') }),
  robots: 'index, follow',
};

const ContactPage: React.FC = () => {
  const author = getAuthor();
  
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

          {/* Author Section */}
          <div className="mt-16 bg-slate-50 py-16 border-t border-slate-100 -mx-8 px-8">
            <Author 
              productCategory={getString('common.defaultProductCategory')}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
