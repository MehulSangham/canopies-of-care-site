'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelRight, X } from 'lucide-react';
import { TexturedLine, TexturedRail } from '@/components/curriculum/TexturedRail';

function ScrollProgressRail({
    scrollPercent,
    className,
}: {
    scrollPercent: number;
    className?: string;
}) {
    const clamped = Math.min(100, Math.max(0, scrollPercent));

    return (
        <div className={`relative w-[6px] overflow-hidden ${className || ''}`}>
            <TexturedRail
                className="absolute inset-x-0 w-full"
                color="rgba(0, 0, 60, 0.16)"
                style={{ top: 0, height: '100%' }}
            />
            <TexturedRail
                className="absolute inset-x-0 w-full transition-all duration-75"
                color="var(--color-nis-deep-forest)"
                style={{ top: 0, height: `${clamped}%` }}
            />
        </div>
    );
}

function CaptionScrollArea({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [scrollPercent, setScrollPercent] = useState(0);

    const recompute = useCallback(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        const range = element.scrollHeight - element.clientHeight;

        if (range <= 0) {
            setScrollPercent(0);
            return;
        }

        setScrollPercent((element.scrollTop / range) * 100);
    }, []);

    useEffect(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        element.scrollTop = 0;
        const frame = window.requestAnimationFrame(recompute);

        return () => window.cancelAnimationFrame(frame);
    }, [children, recompute]);

    return (
        <div className="relative flex min-h-0 h-full gap-3">
            <div
                ref={scrollRef}
                onScroll={recompute}
                className="min-h-0 flex-1 overflow-y-auto pr-1"
                style={{
                    scrollbarWidth: 'none',
                    overscrollBehavior: 'contain',
                }}
            >
                <div className="pr-2 [&::-webkit-scrollbar]:hidden">
                    <p className="nis-type-small text-left">{children}</p>
                </div>
            </div>

            <div className="absolute right-0 top-0 bottom-0 flex items-start">
                <ScrollProgressRail scrollPercent={scrollPercent} className="h-full" />
            </div>
        </div>
    );
}

interface ExpandedImageViewProps {
    open: boolean;
    onClose: () => void;
    caption?: React.ReactNode;
    initialCaptionExpanded?: boolean;
    overlayControls?: React.ReactNode;
    children: React.ReactNode;
}

export function ExpandedImageView({
    open,
    onClose,
    caption,
    initialCaptionExpanded = false,
    overlayControls,
    children,
}: ExpandedImageViewProps) {
    const [captionExpanded, setCaptionExpanded] = useState(false);
    const hasCaption = Boolean(caption);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setCaptionExpanded(initialCaptionExpanded);
        }
    }, [open, initialCaptionExpanded]);

    const collapseCaptionIfExpanded = () => {
        if (captionExpanded) {
            setCaptionExpanded(false);
            return true;
        }

        return false;
    };

    const handleBackdropClick = () => {
        if (!collapseCaptionIfExpanded()) {
            onClose();
        }
    };

    const handleContentClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        collapseCaptionIfExpanded();
    };

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex cursor-zoom-out flex-col overflow-hidden bg-[color:var(--color-nis-bg)]/95 backdrop-blur-md"
            onClick={handleBackdropClick}
        >
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onClose();
                }}
                className="absolute right-4 top-4 z-[60] border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] p-2 text-[color:var(--color-nis-ink)] transition-colors hover:border-nis-hover hover:text-nis-hover md:right-6 md:top-6"
                aria-label="Close"
            >
                <X className="h-6 w-6" />
            </button>

            {overlayControls}

            <div
                className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 md:p-8"
                onClick={handleContentClick}
            >
                <div className="relative flex h-full w-full max-h-full max-w-full items-center justify-center overflow-hidden">
                    {children}

                    {hasCaption ? (
                        <>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setCaptionExpanded((expanded) => !expanded);
                                }}
                                className={`absolute z-[56] flex -translate-y-1/2 flex-col items-center gap-1.5 border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-paper)] px-2 py-3 text-[color:var(--color-nis-ink)] shadow-sm transition-[right] duration-300 ease-out hover:border-nis-hover hover:text-nis-hover md:px-3 top-[calc(0.125rem+25vh)] md:top-[calc(25vh-0.625rem)] ${
                                    captionExpanded ? 'right-[33.333%]' : 'right-0'
                                }`}
                                aria-expanded={captionExpanded}
                                aria-label={
                                    captionExpanded
                                        ? 'Hide image description'
                                        : 'Show image description'
                                }
                            >
                                <PanelRight
                                    className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                                        captionExpanded ? 'rotate-180' : ''
                                    }`}
                                    aria-hidden="true"
                                />
                                <span className="nis-type-small hidden font-medium [writing-mode:vertical-rl] sm:inline">
                                    {captionExpanded ? 'Hide' : 'Description'}
                                </span>
                            </button>

                            <div
                                className={`absolute inset-y-0 right-0 z-[55] flex w-1/3 flex-col border-l border-[color:var(--color-nis-ink)]/20 bg-[color:var(--color-nis-paper)]/95 shadow-lg backdrop-blur-sm transition-transform duration-300 ease-out ${
                                    captionExpanded
                                        ? 'translate-x-0'
                                        : 'pointer-events-none translate-x-full'
                                }`}
                                aria-hidden={!captionExpanded}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-6 md:px-5 md:pt-8">
                                    <TexturedLine
                                        className="mb-4 h-[3px] w-1/2 flex-shrink-0"
                                        color="var(--color-nis-ink)"
                                    />
                                    <CaptionScrollArea>{caption}</CaptionScrollArea>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
