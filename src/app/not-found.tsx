import Link from 'next/link';
import { getString } from '../../lib/utils';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
            <span className="text-4xl text-slate-600">🔍</span>
          </div>
        </div>
        
        {/* Error Message */}
        <h1 className="text-6xl font-bold text-slate-800 mb-4">{getString('errors.404.title')}</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">{getString('errors.404.heading')}</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          {getString('errors.404.description')}
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block w-full bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200"
          >
            {getString('errors.404.goHome')}
          </Link>
          <Link 
            href="/"
            className="inline-block w-full bg-white text-slate-800 px-6 py-3 rounded-lg font-medium border border-slate-200 hover:border-slate-300 transition-colors duration-200"
          >
            {getString('errors.404.browseCategories')}
          </Link>
        </div>
        
        {/* Help Text */}
        <p className="text-sm text-slate-500 mt-8">
          {getString('errors.404.helpText')}
        </p>
      </div>
    </div>
  );
}
