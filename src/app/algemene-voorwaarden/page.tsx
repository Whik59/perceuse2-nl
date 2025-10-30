import React from 'react';
import { Metadata } from 'next';
import Layout from '../../../components/layout/Layout';
import Author from '../../../components/Author';
import { getString } from '../../../lib/utils';
import { getAuthor } from '../../../lib/getAuthor';

export const metadata: Metadata = {
  title: `${getString('legal.cgu.title')} | ${getString('common.siteName')}`,
  description: getString('legal.cgu.description', { domainName: getString('common.domainName') }),
  robots: 'index, follow',
};

const AlgemeneVoorwaardenPage: React.FC = () => {
  const author = getAuthor();
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {getString('legal.cgu.title')}
          </h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cgu.objet.title')}
              </h2>
              <p>{getString('legal.cgu.objet.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cgu.acceptation.title')}
              </h2>
              <p>{getString('legal.cgu.acceptation.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cgu.services.title')}
              </h2>
              <p>{getString('legal.cgu.services.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cgu.responsabilite.title')}
              </h2>
              <p>{getString('legal.cgu.responsabilite.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {getString('legal.cgu.modification.title')}
              </h2>
              <p>{getString('legal.cgu.modification.content')}</p>
            </section>
          </div>

          {/* Author Section */}
          <div className="mt-16 bg-slate-50 py-16 border-t border-slate-100 -mx-8 px-8">
            <Author 
              author={author}
              productCategory="boormachines"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AlgemeneVoorwaardenPage;

