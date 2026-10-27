import React from 'react';

/**
 * Renders CMS dynamic legal content with responsive styling
 * Supports rich HTML as well as plain formatted text with fallback
 */
export default function LegalContentRenderer({ content, loading, fallbackContent }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse py-4 min-h-[70vh]">
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-3.5 bg-slate-100 rounded w-full"></div>
          <div className="h-3.5 bg-slate-100 rounded w-11/12"></div>
          <div className="h-3.5 bg-slate-100 rounded w-4/5"></div>
        </div>
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded w-2/5"></div>
          <div className="h-3.5 bg-slate-100 rounded w-full"></div>
          <div className="h-3.5 bg-slate-100 rounded w-10/12"></div>
          <div className="h-3.5 bg-slate-100 rounded w-3/4"></div>
        </div>
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3.5 bg-slate-100 rounded w-full"></div>
          <div className="h-3.5 bg-slate-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (content && typeof content === 'string' && content.trim().length > 0) {
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(content);

    if (hasHtmlTags) {
      return (
        <div
          className="legal-dynamic-content prose max-w-none text-slate-700 leading-relaxed
            [&>h1]:text-[18px] [&>h1]:font-bold [&>h1]:text-slate-900 [&>h1]:mb-4
            [&>h2]:text-[16px] [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-6 [&>h2]:mb-2.5 [&>h2:first-child]:mt-0
            [&>h3]:text-[14px] [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-4 [&>h3]:mb-2
            [&>p]:text-[13px] [&>p]:text-gray-600 [&>p]:leading-relaxed [&>p]:mb-3
            [&>ul]:list-disc [&>ul]:list-inside [&>ul]:text-[13px] [&>ul]:text-gray-600 [&>ul]:space-y-1.5 [&>ul]:ml-2 [&>ul]:mb-4
            [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:text-[13px] [&>ol]:text-gray-600 [&>ol]:space-y-1.5 [&>ol]:ml-2 [&>ol]:mb-4
            [&>strong]:text-slate-900 [&>strong]:font-bold
            [&>blockquote]:border-l-4 [&>blockquote]:border-primary-green [&>blockquote]:bg-green-50/50 [&>blockquote]:p-3 [&>blockquote]:rounded-r-lg"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // Plain text with line breaks
    return (
      <div className="space-y-4 text-[13px] text-gray-600 leading-relaxed">
        {content.split(/\n\s*\n/).map((para, idx) => (
          <p key={idx} className="whitespace-pre-line">{para}</p>
        ))}
      </div>
    );
  }

  return fallbackContent || null;
}
