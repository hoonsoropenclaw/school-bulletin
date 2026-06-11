'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '32px'];

const COLORS = [
  '#1f2937', // ink-800
  '#e87919', // accent-500
  '#dc2626', // red
  '#2563eb', // blue
  '#16a34a', // green
  '#7c3aed', // purple
  '#db2777', // pink
  '#475569', // slate
];

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,  // 簡化,不用 h1-h6
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-accent-600 underline', target: '_blank', rel: 'noopener noreferrer' },
      }),
      TextStyle, Color, FontSize,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      // Tiptap Color 預設輸出 rgb(r, g, b),我們統一存 hex
      const html = editor.getHTML();
      const normalized = html.replace(
        /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
        (_, r, g, b) => {
          const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
          return '#' + hex(r) + hex(g) + hex(b);
        },
      );
      onChange(normalized);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] focus:outline-none px-3 py-2',
      },
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <div className="input min-h-[200px]">載入編輯器...</div>;
  }

  function setLink() {
    const previousUrl = editor!.getAttributes('link').href;
    const url = window.prompt('連結 URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="rounded-md border border-ink-300 bg-white focus-within:border-ink-500 focus-within:ring-1 focus-within:ring-ink-500">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-ink-200 bg-ink-50 px-2 py-1.5">
        {/* 字體大小 (Tiptap 3 FontSize extension) */}
        <select
          className="rounded border border-ink-200 bg-white px-1.5 py-0.5 text-xs"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(v).run();
            }
          }}
          title="字體大小"
        >
          <option value="">預設</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="mx-0.5 h-4 w-px bg-ink-300" />

        {/* 粗體 / 斜體 / 底線 */}
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="粗體 (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜體 (Ctrl+I)"
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="底線 (Ctrl+U)"
        >
          <span className="underline">U</span>
        </ToolbarButton>

        <span className="mx-0.5 h-4 w-px bg-ink-300" />

        {/* 顏色 */}
        <div className="flex items-center gap-0.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => editor.chain().focus().setColor(c).run()}
              className={
                'h-4 w-4 rounded-sm border ' +
                (editor.isActive('textStyle', { color: c }) ? 'border-ink-900 ring-1 ring-ink-900' : 'border-ink-200')
              }
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <span className="mx-0.5 h-4 w-px bg-ink-300" />

        {/* 列表 */}
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="項目符號"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="編號列表"
        >
          1.
        </ToolbarButton>

        <span className="mx-0.5 h-4 w-px bg-ink-300" />

        {/* 連結 */}
        <ToolbarButton active={editor.isActive('link')} onClick={setLink} title="超連結">
          🔗
        </ToolbarButton>

        <span className="mx-0.5 h-4 w-px bg-ink-300" />

        {/* 清除格式 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="rounded px-1.5 py-0.5 text-xs text-ink-500 hover:bg-ink-100"
          title="清除格式"
        >
          ✕
        </button>
      </div>

      <EditorContent editor={editor} />
      {placeholder && !editor.getText() && (
        <div className="pointer-events-none -mt-[180px] px-3 py-2 text-sm text-ink-400">
          {placeholder}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        'rounded px-2 py-0.5 text-xs transition-colors ' +
        (active
          ? 'bg-accent-100 text-accent-700'
          : 'text-ink-700 hover:bg-ink-100')
      }
    >
      {children}
    </button>
  );
}
