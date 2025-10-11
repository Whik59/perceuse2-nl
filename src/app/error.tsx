'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-200 to-red-300 rounded-full flex items-center justify-center">
            <span className="text-4xl text-red-600">⚠️</span>
          </div>
        </div>
        
        {/* Error Message */}
        <h1 className="text-4xl font-bold text-red-800 mb-4">Something went wrong!</h1>
        <h2 className="text-xl font-semibold text-red-700 mb-4">Application Error</h2>
        <p className="text-red-600 mb-8 leading-relaxed">
          We encountered an unexpected error. Don't worry, our team has been notified and is working to fix it.
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full bg-red-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="inline-block w-full bg-white text-red-800 px-6 py-3 rounded-lg font-medium border border-red-200 hover:border-red-300 transition-colors duration-200"
          >
            Go Home
          </Link>
        </div>
        
        {/* Help Text */}
        <p className="text-sm text-red-500 mt-8">
          If the problem persists, please contact our support team.
        </p>
        
        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-red-600 font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 p-4 bg-red-100 rounded-lg text-xs text-red-800 overflow-auto">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
