'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

const btnCls =
  'px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors';
const activeCls = 'bg-gray-100 text-gray-900';

export function InlineRichEditor({ value, onChange, minHeight = 280 }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || '', false);
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-[var(--color-mavi)] focus-within:ring-1 focus-within:ring-[var(--color-mavi)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnCls} ${editor.isActive('bold') ? activeCls : ''}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnCls} ${editor.isActive('italic') ? activeCls : ''} italic`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btnCls} ${editor.isActive('heading', { level: 2 }) ? activeCls : ''}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btnCls} ${editor.isActive('heading', { level: 3 }) ? activeCls : ''}`}>H3</button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnCls} ${editor.isActive('bulletList') ? activeCls : ''}`}>• Liste</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnCls} ${editor.isActive('orderedList') ? activeCls : ''}`}>1. Liste</button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnCls}>↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnCls}>↪</button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 cursor-text [&_.ProseMirror]:outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
