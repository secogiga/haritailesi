'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface Props {
  content: string;
  className?: string;
}

const components: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#26496b] underline underline-offset-2 hover:text-[#1e3a56]"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-[0.85em] font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-100 rounded-lg p-3 overflow-x-auto text-sm font-mono my-2">
      {children}
    </pre>
  ),
};

export function MarkdownContent({ content, className }: Props) {
  return (
    <div className={`prose prose-sm max-w-none ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
