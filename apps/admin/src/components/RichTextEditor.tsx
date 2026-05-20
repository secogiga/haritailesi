'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, minHeight = 250 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  if (!editor) return (
    <div className="border border-gray-300 rounded-lg bg-gray-50 animate-pulse" style={{ minHeight }} />
  );

  function Btn({
    onClick, active, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
          active
            ? 'bg-[var(--color-mavi)] text-white'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        }`}
      >
        {children}
      </button>
    );
  }

  function Divider() {
    return <div className="w-px bg-gray-300 self-stretch mx-0.5" />;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-mavi)] focus-within:border-[var(--color-mavi)]">
      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 px-2 py-1.5 flex flex-wrap items-center gap-0.5 bg-gray-50">
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Başlık 2">
          H2
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Başlık 3">
          H3
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Kalın">
          <strong>B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="İtalik">
          <em>İ</em>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Üstü Çizili">
          <s>S</s>
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Madde İşaretli Liste">
          • Liste
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numaralı Liste">
          1. Liste
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Alıntı">
          &ldquo; &rdquo;
        </Btn>
        <Divider />
        <Btn
          onClick={() => {
            const prev = editor.isActive('link') ? editor.getAttributes('link').href as string : '';
            const url = window.prompt('Bağlantı URL:', prev);
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().unsetLink().run();
            } else {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          title="Bağlantı Ekle/Kaldır"
        >
          🔗 Bağlantı
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Geri Al">↩</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="İleri Al">↪</Btn>
      </div>

      {/* ─── Editor Area ────────────────────────────────────────────────── */}
      <div
        className="prose prose-sm max-w-none px-4 py-3 cursor-text [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
