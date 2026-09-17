'use client';

import { useMemo, useState } from 'react';
import { ExpandedImageView } from '@/components/curriculum/ExpandedImageView';
import { buildImageCaptionParts } from '@/components/curriculum/imageCaption';
import { TexturedLine } from '@/components/curriculum/TexturedRail';

const DISPLAY_MAX_HEIGHT_PX = 750;

interface ZoomableImageProps {
 src?: string;
 alt?: string;
 imageTitle?: string;
 imageCaption?: React.ReactNode;
 sourceCredit?: string;
 sourceCreditHref?: string;
 sourceCreditLabel?: string;
 isPortrait?: boolean;
 displayAtNativeSize?: boolean;
 description?: React.ReactNode;
 credit?: string;
 creditHref?: string;
 creditLabel?: string;
 attributionLabel?: string;
 heading?: string;
 children?: React.ReactNode;
}

function toReadableTitle(value: string) {
 return value
 .split(' ')
 .filter(Boolean)
 .map((word) => {
 if (word.length <= 4 && word === word.toUpperCase()) return word;
 return word.charAt(0).toUpperCase() + word.slice(1);
 })
 .join(' ');
}

function getHeadingFromSource(src?: string) {
 if (!src) return null;

 const lastSegment = src.split('/').pop() || src;
 const withoutQuery = lastSegment.split('?')[0];
 const withoutExtension = withoutQuery.replace(/\.[^.]+$/, '');
 const decoded = decodeURIComponent(withoutExtension);
 const normalized = decoded
 .replace(/[-_]+/g, ' ')
 .replace(/([a-z])([A-Z])/g, '$1 $2')
 .replace(/\s+/g, ' ')
 .trim();

 return normalized ? toReadableTitle(normalized) : null;
}

export function ZoomableImage({
 src,
 alt,
 imageTitle,
 imageCaption,
 sourceCredit,
 sourceCreditHref,
 sourceCreditLabel,
 description,
 credit,
 creditHref,
 creditLabel,
 attributionLabel = 'Credit',
 heading,
 displayAtNativeSize = false,
 children,
}: ZoomableImageProps) {
 const [isZoomed, setIsZoomed] = useState(false);
 const [zoomWithCaption, setZoomWithCaption] = useState(false);
 const [nativeDimensions, setNativeDimensions] = useState<{
  width: number;
  height: number;
 } | null>(null);
 const displayTitle = imageTitle || heading || (alt && alt !== 'Article Image' ? alt : null) || getHeadingFromSource(src);
 const displayCaption = imageCaption || description;
 const displayCredit = sourceCredit || credit;
 const displayCreditHref = sourceCreditHref || creditHref;
 const displayCreditLabel = sourceCreditLabel || creditLabel;
 const hasMeta = Boolean(displayCaption || displayCredit || displayCreditHref);
 const openZoom = (withCaption = false) => {
  setZoomWithCaption(withCaption);
  setIsZoomed(true);
 };
 const closeZoom = () => {
  setIsZoomed(false);
  setZoomWithCaption(false);
 };
 const captionOptions = {
  title: displayTitle,
  description: displayCaption,
  attributionLabel,
  credit: displayCredit,
  creditHref: displayCreditHref,
  creditLabel: displayCreditLabel,
 };
 const fullCaptionText = useMemo(
  () => buildImageCaptionParts({ ...captionOptions, mode: 'full' }),
  [attributionLabel, displayCaption, displayCredit, displayCreditHref, displayCreditLabel, displayTitle],
 );
 const inlineCaptionText = useMemo(
  () =>
   buildImageCaptionParts({
    ...captionOptions,
    mode: 'inline',
    onDescriptionExpand: () => openZoom(true),
   }),
  [attributionLabel, displayCaption, displayCredit, displayCreditHref, displayCreditLabel, displayTitle],
 );
 const mediaWidthClass = 'w-full';
 const zoomSurfaceClass = src
  ? 'inline-flex max-w-full'
  : 'flex w-full max-w-[1280px]';
 const nativeImageStyle =
  displayAtNativeSize && nativeDimensions
   ? {
      width: `${nativeDimensions.width}px`,
      maxWidth: '100%',
      height: 'auto',
     }
   : undefined;
 const imageClassName = displayAtNativeSize
  ? 'block h-auto w-auto max-w-full'
  : 'block h-auto w-full max-w-full';

 return (
 <>
 <figure
 className="not-prose my-8 max-w-full"
 data-media-title={displayTitle || undefined}
 >
 <div className="flex w-full justify-center">
 <div className={mediaWidthClass}>
 <div
 onClick={() => openZoom()}
 className={`relative w-full cursor-zoom-in overflow-hidden text-center transition-opacity hover:opacity-95 ${
  displayAtNativeSize ? 'flex items-center justify-center bg-[color:var(--color-nis-white)] px-4 py-6' : ''
 }`}
 style={{ maxHeight: `${DISPLAY_MAX_HEIGHT_PX}px` }}
 >
 {src ? (
 <img
 src={src}
 alt={alt || ''}
 className={imageClassName}
 style={nativeImageStyle ?? { objectFit: 'contain' }}
 onLoad={(event) => {
  if (!displayAtNativeSize) {
   return;
  }

  const { naturalWidth, naturalHeight } = event.currentTarget;

  if (naturalWidth > 0 && naturalHeight > 0) {
   setNativeDimensions({ width: naturalWidth, height: naturalHeight });
  }
 }}
 />
 ) : (
 <div className="flex h-auto w-full items-start justify-center bg-[color:var(--color-nis-white)] pointer-events-none">
 {children}
 </div>
 )}
 </div>
 </div>
 </div>
 {(displayTitle || hasMeta) && (
 <figcaption className="pt-5 text-left">
 <div className="flex w-full justify-center">
 <div className={mediaWidthClass}>
 <TexturedLine
 className="h-[3px] w-1/2"
 color="var(--color-nis-ink)"
 />
 </div>
 </div>
 <div className="mt-5 flex w-full justify-center">
 <div className={mediaWidthClass}>
 <p className="nis-type-small">
 {inlineCaptionText}
 </p>
 </div>
 </div>
 </figcaption>
 )}
 </figure>

 <ExpandedImageView
 open={isZoomed}
 onClose={closeZoom}
 caption={hasMeta || displayTitle ? fullCaptionText : undefined}
 initialCaptionExpanded={zoomWithCaption}
 >
 <div
 className={`nis-surface ${zoomSurfaceClass} flex h-full max-h-full w-full max-w-full items-center justify-center bg-[color:var(--color-nis-paper)] p-4 md:p-6`}
 >
 {src ? (
 <img
 src={src}
 alt={alt || ''}
 className="block h-auto max-h-full w-auto max-w-full object-contain"
 style={nativeImageStyle}
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:w-auto">
 {children}
 </div>
 )}
 </div>
 </ExpandedImageView>
 </>
 );
}
