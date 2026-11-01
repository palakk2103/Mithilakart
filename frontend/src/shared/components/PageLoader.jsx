import React from 'react';

// Lightweight Suspense fallback; reserves viewport height so the footer
// doesn't jump while a route chunk loads.
const PageLoader = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center" role="status" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#65B842]" />
  </div>
);

export default PageLoader;
