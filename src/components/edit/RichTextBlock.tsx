'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { Hash, Maximize2 } from 'lucide-react';

interface RichTextBlockProps {
  markdown: string;
  onConfirm: (newMarkdown: string) => void;
  onCancel: () => void;
  isHeading?: boolean;
  headingLevel?: number;
  onExpand?: () => void;
  footnoteIds?: string[];
  onAddFootnote?: (id: string, note: string, sources: string[]) => void;
}

export function RichTextBlock({
  markdown,
  onConfirm,
  onCancel,
  isHeading = false,
  headingLevel = 2,
  onExpand,
  footnoteIds = [],
  onAddFootnote,
}: RichTextBlockProps) {
  const [showFnMenu, setShowFnMenu] = useState(false);
  const [showFnCreate, setShowFnCreate] = useState(false);
  const [newFnText, setNewFnText] = useState('');
  const [newFnSources, setNewFnSources] = useState('');
  const fnRef = useRef<HTMLDivElement>(null);
  const fnTextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showFnMenu) return;
    const handler = (e: MouseEvent) => {
      if (fnRef.current && !fnRef.current.contains(e.target as Node)) {
        setShowFnMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFnMenu]);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: isHeading ? false : undefined,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'underline text-[color:var(--color-nis-ink)]' },
      }),
    ],
    content: mdToHtml(markdown, isHeading, headingLevel),
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: isHeading
          ? 'outline-none px-4 py-3 font-sans font-bold tracking-tight text-[color:var(--color-nis-ink)] ' +
            (headingLevel === 2 ? 'text-2xl' : headingLevel === 3 ? 'text-xl' : 'text-lg')
          : 'outline-none px-4 py-3 text-[1.25rem] leading-7 font-medium text-[color:var(--color-nis-ink)]',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey && isHeading) {
          return true;
        }
        return false;
      },
    },
  });

  const handleConfirm = useCallback(() => {
    if (!editor) return;
    onConfirm(htmlToMd(editor.getHTML(), isHeading, headingLevel));
  }, [editor, onConfirm, isHeading, headingLevel]);

  useEffect(() => {
    if (!editor) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        handleConfirm();
      }
    };

    const el = editor.view.dom;
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [editor, onCancel, handleConfirm]);

  if (!editor) return null;

  return (
    <div className="border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)]">
      {/* Toolbar */}
      {!isHeading && (
        <div className="flex items-center gap-0.5 border-b border-[color:var(--color-nis-soft)] px-3 py-1.5 bg-[color:var(--color-nis-paper)]">
          <ToolbarBtn
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="B"
            title="Bold"
          />
          <ToolbarBtn
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="I"
            title="Italic"
            italic
          />
          <ToolbarBtn
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            label="S"
            title="Strikethrough"
            strike
          />
          <div className="w-px h-4 bg-[color:var(--color-nis-soft)] mx-1" />
          <ToolbarBtn
            active={editor.isActive('link')}
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                const url = window.prompt('URL:');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            label="↗"
            title="Link"
          />

          {/* Footnote ref insertion */}
          {(footnoteIds.length > 0 || onAddFootnote) && (
            <>
              <div className="w-px h-4 bg-[color:var(--color-nis-soft)] mx-1" />
              <div className="relative" ref={fnRef}>
                <ToolbarBtn
                  active={showFnMenu}
                  onClick={() => setShowFnMenu(!showFnMenu)}
                  label="fn"
                  title="Insert footnote"
                />
                {showFnMenu && !showFnCreate && (
                  <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)]">
                    {footnoteIds.map((fnId) => (
                      <button
                        key={fnId}
                        type="button"
                        onClick={() => {
                          editor.chain().focus().insertContent(`[^${fnId}]`).run();
                          setShowFnMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] transition-colors"
                      >
                        <Hash className="h-3 w-3 text-nis-muted shrink-0" />
                        <span className="font-mono text-xs">[^{fnId}]</span>
                      </button>
                    ))}
                    {onAddFootnote && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowFnCreate(true);
                          setNewFnText('');
                          setNewFnSources('');
                          setTimeout(() => fnTextRef.current?.focus(), 50);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] transition-colors border-t border-[color:var(--color-nis-soft)]"
                      >
                        <span className="text-nis-muted">+</span>
                        New footnote
                      </button>
                    )}
                  </div>
                )}

                {/* Inline footnote creation form */}
                {showFnCreate && (() => {
                  const canAdd = !!(newFnText.trim() || newFnSources.trim());
                  const submitNewFootnote = () => {
                    if (!canAdd) return;
                    const nextNum = footnoteIds.length > 0
                      ? Math.max(...footnoteIds.map((id) => parseInt(id) || 0)) + 1
                      : 1;
                    const newId = String(nextNum);
                    editor.chain().focus().insertContent(`[^${newId}]`).run();
                    onAddFootnote!(newId, newFnText.trim(), newFnSources.split('\n').map((s) => s.trim()).filter(Boolean));
                    setShowFnCreate(false);
                    setShowFnMenu(false);
                    setNewFnText('');
                    setNewFnSources('');
                  };
                  return (
                  <div className="absolute left-0 top-full mt-1 z-50 w-[320px] border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)]">
                    <div className="px-3 py-2 border-b border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-paper)]">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                        New footnote
                      </span>
                    </div>
                    <div className="px-3 py-2.5">
                      <label className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                        Note
                      </label>
                      <textarea
                        ref={fnTextRef}
                        value={newFnText}
                        onChange={(e) => setNewFnText(e.target.value)}
                        placeholder="The substantive point (optional if sources given)…"
                        rows={2}
                        className="w-full resize-none border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-2.5 py-2 text-sm text-[color:var(--color-nis-ink)] outline-none focus:border-[color:var(--color-nis-ink)] transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.metaKey) {
                            e.preventDefault();
                            submitNewFootnote();
                          }
                          if (e.key === 'Escape') setShowFnCreate(false);
                        }}
                      />
                      <label className="mb-1 mt-2 block font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                        Sources — one per line
                      </label>
                      <textarea
                        value={newFnSources}
                        onChange={(e) => setNewFnSources(e.target.value)}
                        placeholder={'Author, Title (Publisher, Year). https://…'}
                        rows={3}
                        className="w-full resize-none border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-2.5 py-2 text-sm text-[color:var(--color-nis-ink)] outline-none focus:border-[color:var(--color-nis-ink)] transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.metaKey) {
                            e.preventDefault();
                            submitNewFootnote();
                          }
                          if (e.key === 'Escape') setShowFnCreate(false);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-3 py-1.5 bg-[color:var(--color-nis-paper)]">
                      <span className="font-mono text-[10px] text-nis-muted">⌘⏎ add</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setShowFnCreate(false); }}
                          className="px-2 py-1 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!canAdd}
                          onClick={submitNewFootnote}
                          className="px-2.5 py-1 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] hover:bg-[color:var(--color-nis-hover)] disabled:opacity-40 transition-colors"
                        >
                          Add footnote
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* Expand button */}
          {onExpand && (
            <>
              <div className="w-px h-4 bg-[color:var(--color-nis-soft)] mx-1" />
              <button
                type="button"
                onClick={onExpand}
                title="Expand editor"
                className="inline-flex h-6 w-6 items-center justify-center text-nis-muted hover:text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] transition-colors"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Footer with actions */}
      <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-3 py-1.5 bg-[color:var(--color-nis-paper)]">
        <span className="font-mono text-[10px] text-nis-muted">⌘⏎ save · esc cancel</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-2.5 py-1 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] hover:bg-[color:var(--color-nis-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  label,
  title,
  italic,
  strike,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  italic?: boolean;
  strike?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        inline-flex h-6 w-6 items-center justify-center text-xs font-bold transition-colors
        ${active
          ? 'bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)]'
          : 'text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)]'
        }
        ${italic ? 'italic' : ''}
        ${strike ? 'line-through' : ''}
      `}
    >
      {label}
    </button>
  );
}

function mdToHtml(md: string, isHeading: boolean, level: number): string {
  let text = md;
  if (isHeading) {
    text = text.replace(/^#{1,6}\s+/, '');
  }

  text = text.replace(/\[\^(\w+)\]/g, '‹fn:$1›');

  let html = text;
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  if (!isHeading) {
    html = `<p>${html}</p>`;
  }

  return html;
}

function htmlToMd(html: string, isHeading: boolean, level: number): string {
  let md = html;

  md = md.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
  md = md.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  md = md.replace(/<s>([\s\S]*?)<\/s>/g, '~~$1~~');
  md = md.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');

  md = md.replace(/<p>([\s\S]*?)<\/p>/g, '$1');
  md = md.replace(/<br\s*\/?>/g, '\n');
  md = md.replace(/<[^>]+>/g, '');

  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');

  md = md.replace(/‹fn:(\w+)›/g, '[^$1]');

  if (isHeading) {
    md = '#'.repeat(level) + ' ' + md.trim();
  }

  return md.trim();
}
