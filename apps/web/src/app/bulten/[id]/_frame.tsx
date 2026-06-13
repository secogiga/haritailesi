'use client';

export function NewsletterFrame({ html, title }: { html: string; title: string }) {
  return (
    <iframe
      srcDoc={html}
      title={title}
      className="w-full border-0"
      style={{ minHeight: '600px' }}
      onLoad={(e) => {
        const iframe = e.currentTarget;
        const doc = iframe.contentDocument;
        if (doc?.body) iframe.style.height = `${doc.body.scrollHeight + 32}px`;
      }}
    />
  );
}
