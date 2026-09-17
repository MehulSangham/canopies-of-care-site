import type { ReactElement, ReactNode } from 'react';

export const IMAGE_DESCRIPTION_WORD_LIMIT = 50;

export function toPlainText(node: ReactNode): string {
    if (node == null || typeof node === 'boolean') {
        return '';
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(toPlainText).join('');
    }

    if (typeof node === 'object' && 'props' in node) {
        return toPlainText((node as ReactElement<{ children?: ReactNode }>).props.children);
    }

    return '';
}

export function truncateToWordLimit(
    text: string,
    limit = IMAGE_DESCRIPTION_WORD_LIMIT,
): { text: string; isTruncated: boolean } {
    const words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length <= limit) {
        return { text: text.trim(), isTruncated: false };
    }

    return {
        text: words.slice(0, limit).join(' '),
        isTruncated: true,
    };
}

function titleDescriptionSeparator(title: ReactNode): string {
    const plainTitle = toPlainText(title).trim();

    if (!plainTitle) {
        return '';
    }

    return /[.!?…]$/.test(plainTitle) ? ' ' : '. ';
}

interface ImageCaptionCredit {
    attributionLabel?: string;
    credit?: string;
    creditHref?: string;
    creditLabel?: string;
}

interface BuildImageCaptionOptions extends ImageCaptionCredit {
    title?: ReactNode | null;
    description?: ReactNode | null;
    mode: 'inline' | 'full';
    onDescriptionExpand?: () => void;
}

export function buildImageCaptionParts({
    title,
    description,
    attributionLabel = 'Credit',
    credit,
    creditHref,
    creditLabel,
    mode,
    onDescriptionExpand,
}: BuildImageCaptionOptions): ReactNode[] {
    const parts: ReactNode[] = [];
    const hasDescription = Boolean(description);
    const hasCredit = Boolean(credit || creditHref);

    if (title) {
        parts.push(
            <span key="title" className="font-extrabold text-[color:var(--color-nis-ink)]">
                {title}
                {hasDescription || hasCredit ? titleDescriptionSeparator(title) : ''}
            </span>,
        );
    }

    if (description) {
        let descriptionContent: ReactNode = description;

        if (mode === 'inline') {
            const plainDescription = toPlainText(description);

            if (plainDescription) {
                const { text, isTruncated } = truncateToWordLimit(plainDescription);

                descriptionContent = (
                    <>
                        {text}
                        {isTruncated ? (
                            <>
                                {' '}
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDescriptionExpand?.();
                                    }}
                                    className="cursor-pointer font-medium italic text-[color:var(--color-nis-ink)] underline underline-offset-2 transition-colors hover:text-nis-hover"
                                    aria-label="Read full image description"
                                >
                                    ... Read more
                                </button>
                            </>
                        ) : null}
                    </>
                );
            }
        }

        parts.push(
            <span key="description" className="font-medium text-[color:var(--color-nis-ink)]">
                {descriptionContent}
                {hasCredit ? ' ' : ''}
            </span>,
        );
    }

    if (hasCredit) {
        parts.push(
            <span key="credit" className="font-medium text-[color:var(--color-nis-ink)]">
                <span className="sr-only">{attributionLabel}: </span>
                <span className="not-italic">Source:</span>{' '}
                {creditHref ? (
                    <a
                        href={creditHref}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 transition-colors hover:text-nis-hover"
                    >
                        {creditLabel || credit || creditHref}
                    </a>
                ) : (
                    <span>{credit}</span>
                )}
            </span>,
        );
    }

    return parts;
}
