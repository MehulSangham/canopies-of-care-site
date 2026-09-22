'use client';

import { useCallback, type ReactNode } from 'react';
import { EditModeProvider, useEditMode } from '@/components/edit/EditModeProvider';
import { EditButton } from '@/components/edit/EditButton';
import { EditToolbar } from '@/components/edit/EditToolbar';
import { XrayEditor } from '@/components/edit/XrayEditor';
import { ToastProvider } from '@/components/edit/Toast';
import { EditableRegion } from '@/components/edit/EditableRegion';
import { EditableText } from '@/components/edit/EditableText';
import { EditableMeta } from '@/components/edit/EditableMeta';
import { EditableBody } from '@/components/edit/EditableBody';
import { BlocksProvider } from '@/components/edit/BlocksContext';
import { TaxonomyProvider } from '@/components/edit/TaxonomyProvider';
import { saveContent } from '@/app/actions/save-content';
import { HeaderFrame } from '@/components/curriculum/HeaderFrame';
import { ArticleContent } from '@/components/curriculum/ArticleContent';

interface ClaimData {
  slug: string;
  title: string;
  subtitle?: string;
  section: string;
  order: number;
  status: string;
  body: string;
}

interface ClaimPageClientProps {
  slug: string;
  claim: ClaimData;
  prev: ClaimData | null;
  next: ClaimData | null;
  sectionTitles: Record<string, string>;
  isAdmin: boolean;
  renderedBody: ReactNode;
  children: ReactNode;
}

function EditableHeader({
  claim,
  prev,
  next,
  sectionTitles,
}: {
  claim: ClaimData;
  prev: ClaimData | null;
  next: ClaimData | null;
  sectionTitles: Record<string, string>;
}) {
  const { isEditMode } = useEditMode();

  return (
    <>
      <EditableRegion label="Title">
        <HeaderFrame
          kicker={`Section ${claim.section}: ${sectionTitles[claim.section] || claim.section}`}
          title={claim.title}
          titleSlot={
            isEditMode ? (
              <EditableText
                field="title"
                value={claim.title}
                as="h1"
                className="nis-header-frame__title"
                placeholder="Enter title..."
              />
            ) : undefined
          }
          prev={
            prev
              ? { href: `/archive/${prev.slug}`, title: `${prev.section}${prev.order}: ${prev.title}` }
              : undefined
          }
          next={
            next
              ? { href: `/archive/${next.slug}`, title: `${next.section}${next.order}: ${next.title}` }
              : undefined
          }
        />
      </EditableRegion>

      {(claim.subtitle || isEditMode) && (
        <EditableRegion label="Subtitle" className="mt-3">
          <EditableText
            field="subtitle"
            value={claim.subtitle || ''}
            as="p"
            className="font-serif text-lg text-nis-muted"
            placeholder="Enter subtitle..."
          />
        </EditableRegion>
      )}

      <EditableMeta
        section={claim.section}
        order={claim.order}
        status={claim.status}
        sectionTitles={sectionTitles}
      />
    </>
  );
}

function EditControls({ slug }: { slug: string }) {
  const { pendingChanges } = useEditMode();

  const handleSave = useCallback(async () => {
    await saveContent({ slug, ...pendingChanges });
  }, [slug, pendingChanges]);

  return (
    <>
      <EditButton />
      <EditToolbar onSave={handleSave} />
      <XrayEditor />
    </>
  );
}

/**
 * Editable content for the main column.
 * Renders header + body with block editing.
 */
export function ClaimContent({
  claim,
  prev,
  next,
  sectionTitles,
  renderedBody,
}: {
  claim: ClaimData;
  prev: ClaimData | null;
  next: ClaimData | null;
  sectionTitles: Record<string, string>;
  renderedBody: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[686px] mt-0 mb-[30px]">
      <EditableHeader
        claim={claim}
        prev={prev}
        next={next}
        sectionTitles={sectionTitles}
      />
      <EditableBody markdown={claim.body}>
        <ArticleContent>{renderedBody}</ArticleContent>
      </EditableBody>
    </div>
  );
}

/**
 * Top-level client wrapper.
 * Provides EditMode + Blocks contexts so the aside (LeftRailContent)
 * and main column (ClaimContent) share block state.
 */
export function ClaimPageClient({
  slug,
  claim,
  prev,
  next,
  sectionTitles,
  isAdmin,
  renderedBody,
  children,
}: ClaimPageClientProps) {
  return (
    <ToastProvider>
      <EditModeProvider isAdmin={isAdmin} slug={slug}>
        {/* EditControls sit inside the gate so the toolbar (and its page
            assistant) can reach the blocks context while editing. */}
        <EditModeGate markdown={claim.body}>
          {children}
          <EditControls slug={slug} />
        </EditModeGate>
      </EditModeProvider>
    </ToastProvider>
  );
}

/**
 * Conditionally wraps children in BlocksProvider when edit mode is on,
 * so both the outline panel and body editor share block state.
 */
function EditModeGate({
  markdown,
  children,
}: {
  markdown: string;
  children: ReactNode;
}) {
  const { isEditMode } = useEditMode();

  if (isEditMode) {
    return (
      <TaxonomyProvider>
        <BlocksProvider markdown={markdown}>{children}</BlocksProvider>
      </TaxonomyProvider>
    );
  }

  return <>{children}</>;
}
