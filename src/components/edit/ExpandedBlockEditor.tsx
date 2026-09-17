'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Upload,
  Eye,
  Code,
  ChevronDown,
  Hash,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { BlockPreview } from './BlockPreview';
import { uploadImage } from '@/app/actions/upload-image';
import type { MdxBlock, BlockType } from '@/lib/mdx-blocks';

interface ExpandedBlockEditorProps {
  block: MdxBlock;
  onConfirm: (newRaw: string) => void;
  onCancel: () => void;
  /** Existing footnote IDs in the document, for inserting references */
  footnoteIds?: string[];
  /** Callback to add a new footnote definition block */
  onAddFootnote?: (id: string, text: string) => void;
}

const HEADING_LEVELS = [2, 3, 4, 5, 6] as const;
const CALLOUT_TYPES = ['claim', 'note', 'warning', 'example', 'question'] as const;

export function ExpandedBlockEditor({
  block,
  onConfirm,
  onCancel,
  footnoteIds = [],
  onAddFootnote,
}: ExpandedBlockEditorProps) {
  const [draft, setDraft] = useState(block.raw);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse structured fields from draft based on block type
  const parsed = useMemo(() => parseBlockFields(block.type, draft), [block.type, draft]);

  const previewBlock: MdxBlock = useMemo(
    () => ({ ...block, raw: draft }),
    [block, draft],
  );

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        onConfirm(draft);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, onConfirm, draft]);

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    if (textareaRef.current) autoResize(textareaRef.current);
  }, [draft, autoResize]);

  const isRichEditable = block.type === 'paragraph' || block.type === 'heading';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[color:var(--color-nis-ink)]/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[800px] max-h-[85vh] mx-4 flex flex-col border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[8px_8px_0_0_var(--color-nis-accent)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-nis-soft)] px-5 py-3 bg-[color:var(--color-nis-paper)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
              {block.type}
            </span>

            {/* Type-specific controls in header */}
            {block.type === 'heading' && (
              <HeadingLevelSelect
                level={parsed.headingLevel ?? 2}
                onChange={(lvl) => {
                  const text = draft.replace(/^#{1,6}\s+/, '');
                  setDraft('#'.repeat(lvl) + ' ' + text);
                }}
              />
            )}
            {block.type === 'callout' && (
              <CalloutTypeSelect
                type={parsed.calloutType ?? 'claim'}
                onChange={(t) => {
                  setDraft(draft.replace(/<Callout\s+type="(\w+)">/, `<Callout type="${t}">`));
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                showPreview
                  ? 'bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)]'
                  : 'text-nis-muted hover:text-[color:var(--color-nis-ink)]'
              }`}
            >
              {showPreview ? <Code className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPreview ? 'Source' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {showPreview ? (
            <div className="px-8 py-6">
              <BlockPreview block={previewBlock} />
            </div>
          ) : isRichEditable ? (
            <ExpandedRichEditor
              markdown={draft}
              isHeading={block.type === 'heading'}
              headingLevel={parsed.headingLevel ?? 2}
              onChange={setDraft}
              footnoteIds={footnoteIds}
              onAddFootnote={onAddFootnote}
            />
          ) : block.type === 'image' ? (
            <ImageEditor
              draft={draft}
              onChange={setDraft}
              parsed={parsed}
            />
          ) : block.type === 'video' ? (
            <VideoEditor
              draft={draft}
              onChange={setDraft}
              parsed={parsed}
            />
          ) : block.type === 'footnote' ? (
            <FootnoteEditor
              draft={draft}
              onChange={setDraft}
              parsed={parsed}
            />
          ) : block.type === 'callout' ? (
            <CalloutEditor
              draft={draft}
              onChange={setDraft}
              parsed={parsed}
            />
          ) : (
            <div className="p-5">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  autoResize(e.target);
                }}
                className="w-full resize-none overflow-hidden bg-transparent font-mono text-[13px] leading-[1.6] text-[color:var(--color-nis-ink)] border-0 outline-none"
                spellCheck
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-5 py-2.5 bg-[color:var(--color-nis-paper)] shrink-0">
          <span className="font-mono text-[10px] text-nis-muted">⌘⏎ save · esc close</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(draft)}
              className="px-4 py-1.5 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] hover:bg-[color:var(--color-nis-hover)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Structured editors for specific block types ─── */

function buildImageRaw(alt: string, src: string, caption?: string): string {
  if (caption) return `![${alt}](${src} "${caption}")`;
  return `![${alt}](${src})`;
}

function ImageEditor({
  draft,
  onChange,
  parsed,
}: {
  draft: string;
  onChange: (v: string) => void;
  parsed: ParsedFields;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadImage(fd);
      onChange(buildImageRaw(parsed.alt || 'Image', result.url, parsed.caption));
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="p-5 space-y-4">
      {parsed.src && (
        <div className="border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-paper)] p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={parsed.src} alt={parsed.alt || ''} className="max-h-48 mx-auto object-contain" />
        </div>
      )}

      <div className="grid gap-3">
        <label className="block">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
            Image URL
          </span>
          <input
            type="text"
            value={parsed.src || ''}
            onChange={(e) => onChange(buildImageRaw(parsed.alt || '', e.target.value, parsed.caption))}
            className="field-input"
            placeholder="/images/example.jpg"
          />
        </label>

        <label className="block">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
            Alt text
          </span>
          <input
            type="text"
            value={parsed.alt || ''}
            onChange={(e) => onChange(buildImageRaw(e.target.value, parsed.src || '', parsed.caption))}
            className="field-input"
            placeholder="Describe the image for accessibility"
          />
        </label>

        <label className="block">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
            Caption
          </span>
          <input
            type="text"
            value={parsed.caption || ''}
            onChange={(e) => onChange(buildImageRaw(parsed.alt || '', parsed.src || '', e.target.value || undefined))}
            className="field-input"
            placeholder="Visible caption below the image (optional)"
          />
        </label>

        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold border border-[color:var(--color-nis-ink)] text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] disabled:opacity-40 transition-colors"
          >
            <Upload className="h-3 w-3" />
            {uploading ? 'Uploading…' : 'Upload new image'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoEditor({
  draft,
  onChange,
  parsed,
}: {
  draft: string;
  onChange: (v: string) => void;
  parsed: ParsedFields;
}) {
  const embedUrl = parsed.videoUrl ? getVideoEmbedUrl(parsed.videoUrl) : null;

  return (
    <div className="p-5 space-y-4">
      {embedUrl && (
        <div className="relative border border-[color:var(--color-nis-soft)] bg-black overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={parsed.caption || 'Video preview'}
          />
        </div>
      )}

      <div className="grid gap-3">
        <label className="block">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
            Video URL
          </span>
          <input
            type="text"
            value={parsed.videoUrl || ''}
            onChange={(e) => {
              const captionAttr = parsed.caption ? ` caption="${parsed.caption}"` : '';
              onChange(`<Video url="${e.target.value}"${captionAttr} />`);
            }}
            className="field-input"
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <span className="mt-1 block text-[10px] text-nis-muted">
            Supports YouTube and Vimeo URLs
          </span>
        </label>

        <label className="block">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
            Caption
          </span>
          <input
            type="text"
            value={parsed.caption || ''}
            onChange={(e) => {
              const captionAttr = e.target.value ? ` caption="${e.target.value}"` : '';
              onChange(`<Video url="${parsed.videoUrl || ''}"${captionAttr} />`);
            }}
            className="field-input"
            placeholder="Video caption (optional)"
          />
        </label>
      </div>
    </div>
  );
}

function getVideoEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function FootnoteEditor({
  draft,
  onChange,
  parsed,
}: {
  draft: string;
  onChange: (v: string) => void;
  parsed: ParsedFields;
}) {
  return (
    <div className="p-5 space-y-4">
      <label className="block">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
          Footnote ID
        </span>
        <input
          type="text"
          value={parsed.footnoteId || ''}
          onChange={(e) => {
            const id = e.target.value.replace(/\s/g, '');
            onChange(`[^${id}]: ${parsed.footnoteText || ''}`);
          }}
          className="field-input font-mono"
          placeholder="1"
        />
      </label>

      <label className="block">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
          Footnote text
        </span>
        <textarea
          value={parsed.footnoteText || ''}
          onChange={(e) => {
            onChange(`[^${parsed.footnoteId || 'n'}]: ${e.target.value}`);
          }}
          rows={4}
          className="field-input font-serif resize-y"
          placeholder="The footnote content…"
        />
      </label>

      <p className="text-[11px] text-nis-muted">
        Reference this footnote in text with{' '}
        <code className="font-mono bg-[color:var(--color-nis-paper)] px-1 py-0.5 border border-[color:var(--color-nis-soft)]">
          [^{parsed.footnoteId || 'n'}]
        </code>
      </p>
    </div>
  );
}

function CalloutEditor({
  draft,
  onChange,
  parsed,
}: {
  draft: string;
  onChange: (v: string) => void;
  parsed: ParsedFields;
}) {
  return (
    <div className="p-5 space-y-4">
      <label className="block">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted mb-1 block">
          Callout content
        </span>
        <textarea
          value={parsed.calloutBody || ''}
          onChange={(e) => {
            onChange(`<Callout type="${parsed.calloutType || 'claim'}">\n${e.target.value}\n</Callout>`);
          }}
          rows={6}
          className="field-input resize-y"
          placeholder="Your claim or note here…"
        />
      </label>
    </div>
  );
}

/* ─── Rich text editor for paragraphs/headings (expanded version) ─── */

function ExpandedRichEditor({
  markdown,
  isHeading,
  headingLevel,
  onChange,
  footnoteIds,
  onAddFootnote,
}: {
  markdown: string;
  isHeading: boolean;
  headingLevel: number;
  onChange: (md: string) => void;
  footnoteIds?: string[];
  onAddFootnote?: (id: string, text: string) => void;
}) {
  const [showFootnoteMenu, setShowFootnoteMenu] = useState(false);
  const [showFnCreate, setShowFnCreate] = useState(false);
  const [newFnText, setNewFnText] = useState('');
  const fnMenuRef = useRef<HTMLDivElement>(null);
  const fnTextRef = useRef<HTMLTextAreaElement>(null);

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
          ? 'outline-none px-6 py-5 font-sans font-bold tracking-tight text-[color:var(--color-nis-ink)] ' +
            (headingLevel === 2 ? 'text-2xl' : headingLevel === 3 ? 'text-xl' : 'text-lg')
          : 'outline-none px-6 py-5 text-[1.25rem] leading-[1.8] font-medium text-[color:var(--color-nis-ink)] min-h-[200px]',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey && isHeading) return true;
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMd(ed.getHTML(), isHeading, headingLevel));
    },
  });

  // Close footnote menu on outside click
  useEffect(() => {
    if (!showFootnoteMenu) return;
    const handler = (e: MouseEvent) => {
      if (fnMenuRef.current && !fnMenuRef.current.contains(e.target as Node)) {
        setShowFootnoteMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFootnoteMenu]);

  const insertFootnoteRef = useCallback(
    (fnId: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(`[^${fnId}]`).run();
      setShowFootnoteMenu(false);
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[color:var(--color-nis-soft)] px-5 py-2 bg-[color:var(--color-nis-paper)] flex-wrap">
        <ToolbarBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          title="Bold (⌘B)"
          className="font-bold"
        />
        <ToolbarBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          title="Italic (⌘I)"
          className="italic"
        />
        <ToolbarBtn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="S"
          title="Strikethrough"
          className="line-through"
        />
        <ToolbarBtn
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          label="<>"
          title="Inline code (⌘E)"
          className="font-mono text-[10px]"
        />
        <div className="w-px h-4 bg-[color:var(--color-nis-soft)] mx-1.5" />
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
        {!isHeading && (
          <div className="relative" ref={fnMenuRef}>
            <ToolbarBtn
              active={showFootnoteMenu}
              onClick={() => setShowFootnoteMenu(!showFootnoteMenu)}
              label="fn"
              title="Insert footnote reference"
              className="font-mono text-[10px]"
            />

            {showFootnoteMenu && !showFnCreate && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)]">
                <div className="px-3 py-2 border-b border-[color:var(--color-nis-soft)]">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                    Insert footnote
                  </span>
                </div>

                {/* Existing footnotes */}
                {footnoteIds && footnoteIds.length > 0 && (
                  <div className="border-b border-[color:var(--color-nis-soft)]">
                    {footnoteIds.map((fnId) => (
                      <button
                        key={fnId}
                        type="button"
                        onClick={() => insertFootnoteRef(fnId)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] transition-colors"
                      >
                        <Hash className="h-3 w-3 text-nis-muted shrink-0" />
                        <span className="font-mono text-xs">[^{fnId}]</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Create new */}
                {onAddFootnote && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowFnCreate(true);
                      setNewFnText('');
                      setTimeout(() => fnTextRef.current?.focus(), 50);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)] transition-colors"
                  >
                    <span className="text-nis-muted">+</span>
                    Create new footnote
                  </button>
                )}
              </div>
            )}

            {/* Inline footnote creation form */}
            {showFnCreate && (
              <div className="absolute left-0 top-full mt-1 z-50 w-[320px] border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)] shadow-[4px_4px_0_0_var(--color-nis-accent)]">
                <div className="px-3 py-2 border-b border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-paper)]">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-nis-muted">
                    New footnote
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <textarea
                    ref={fnTextRef}
                    value={newFnText}
                    onChange={(e) => setNewFnText(e.target.value)}
                    placeholder="Write the footnote text…"
                    rows={3}
                    className="w-full resize-none border border-[color:var(--color-nis-soft)] bg-[color:var(--color-nis-white)] px-2.5 py-2 text-sm text-[color:var(--color-nis-ink)] outline-none focus:border-[color:var(--color-nis-ink)] transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey && newFnText.trim()) {
                        e.preventDefault();
                        const nextNum = footnoteIds && footnoteIds.length > 0
                          ? Math.max(...footnoteIds.map((id) => parseInt(id) || 0)) + 1
                          : 1;
                        const newId = String(nextNum);
                        editor.chain().focus().insertContent(`[^${newId}]`).run();
                        onAddFootnote!(newId, newFnText.trim());
                        setShowFnCreate(false);
                        setShowFootnoteMenu(false);
                        setNewFnText('');
                      }
                      if (e.key === 'Escape') {
                        setShowFnCreate(false);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between border-t border-[color:var(--color-nis-soft)] px-3 py-1.5 bg-[color:var(--color-nis-paper)]">
                  <span className="font-mono text-[10px] text-nis-muted">⌘⏎ add</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowFnCreate(false)}
                      className="px-2 py-1 text-[11px] font-bold text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!newFnText.trim()}
                      onClick={() => {
                        const nextNum = footnoteIds && footnoteIds.length > 0
                          ? Math.max(...footnoteIds.map((id) => parseInt(id) || 0)) + 1
                          : 1;
                        const newId = String(nextNum);
                        editor.chain().focus().insertContent(`[^${newId}]`).run();
                        onAddFootnote!(newId, newFnText.trim());
                        setShowFnCreate(false);
                        setShowFootnoteMenu(false);
                        setNewFnText('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)] hover:bg-[color:var(--color-nis-hover)] disabled:opacity-40 transition-colors"
                    >
                      Add footnote
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

/* ─── Small UI components ─── */

function HeadingLevelSelect({
  level,
  onChange,
}: {
  level: number;
  onChange: (lvl: number) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none bg-transparent border border-[color:var(--color-nis-soft)] pl-2 pr-6 py-0.5 text-[11px] font-bold text-[color:var(--color-nis-ink)] cursor-pointer"
      >
        {HEADING_LEVELS.map((l) => (
          <option key={l} value={l}>
            H{l}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 h-3 w-3 text-nis-muted pointer-events-none" />
    </div>
  );
}

function CalloutTypeSelect({
  type,
  onChange,
}: {
  type: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={type}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent border border-[color:var(--color-nis-soft)] pl-2 pr-6 py-0.5 text-[11px] font-bold text-[color:var(--color-nis-ink)] cursor-pointer capitalize"
      >
        {CALLOUT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 h-3 w-3 text-nis-muted pointer-events-none" />
    </div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  label,
  title,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        inline-flex h-7 w-7 items-center justify-center text-xs transition-colors
        ${active
          ? 'bg-[color:var(--color-nis-ink)] text-[color:var(--color-nis-bg)]'
          : 'text-[color:var(--color-nis-ink)] hover:bg-[color:var(--color-nis-accent-soft)]'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
}

/* ─── Parsing helpers ─── */

interface ParsedFields {
  headingLevel?: number;
  calloutType?: string;
  calloutBody?: string;
  footnoteId?: string;
  footnoteText?: string;
  alt?: string;
  src?: string;
  caption?: string;
  videoUrl?: string;
}

function parseBlockFields(type: BlockType, raw: string): ParsedFields {
  switch (type) {
    case 'heading': {
      const m = raw.match(/^(#{1,6})\s/);
      return { headingLevel: m ? m[1].length : 2 };
    }
    case 'callout': {
      const tm = raw.match(/<Callout\s+type="(\w+)">/);
      const bm = raw.match(/<Callout[^>]*>\n?([\s\S]*?)\n?<\/Callout>/);
      return {
        calloutType: tm?.[1] || 'claim',
        calloutBody: bm?.[1]?.trim() || '',
      };
    }
    case 'footnote': {
      const fm = raw.match(/^\[\^(\w+)\]:\s([\s\S]*)$/);
      return {
        footnoteId: fm?.[1] || '',
        footnoteText: fm?.[2] || '',
      };
    }
    case 'image': {
      const im = raw.match(/^!\[([^\]]*)\]\(([^)"]+)(?:\s+"([^"]*)")?\)/);
      return {
        alt: im?.[1] || '',
        src: im?.[2]?.trim() || '',
        caption: im?.[3] || undefined,
      };
    }
    case 'video': {
      const vm = raw.match(/^<Video\s+url="([^"]+)"\s*(?:caption="([^"]*)")?\s*\/>/);
      return {
        videoUrl: vm?.[1] || '',
        caption: vm?.[2] || undefined,
      };
    }
    default:
      return {};
  }
}

/* ─── Markdown ↔ HTML conversion (same as RichTextBlock) ─── */

function mdToHtml(md: string, isHeading: boolean, level: number): string {
  let text = md;
  if (isHeading) text = text.replace(/^#{1,6}\s+/, '');
  text = text.replace(/\[\^(\w+)\]/g, '‹fn:$1›');

  let html = text;
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  if (!isHeading) html = `<p>${html}</p>`;
  return html;
}

function htmlToMd(html: string, isHeading: boolean, level: number): string {
  let md = html;
  md = md.replace(/<code>([\s\S]*?)<\/code>/g, '`$1`');
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
  md = md.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  md = md.replace(/<s>([\s\S]*?)<\/s>/g, '~~$1~~');
  md = md.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  md = md.replace(/<p>([\s\S]*?)<\/p>/g, '$1');
  md = md.replace(/<br\s*\/?>/g, '\n');
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  md = md.replace(/‹fn:(\w+)›/g, '[^$1]');
  if (isHeading) md = '#'.repeat(level) + ' ' + md.trim();
  return md.trim();
}
