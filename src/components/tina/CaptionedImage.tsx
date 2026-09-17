import Image from "next/image";

interface CaptionedImageProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export default function CaptionedImage({
  src,
  alt,
  caption,
  credit,
}: CaptionedImageProps) {
  return (
    <figure className="my-8">
      <div className="rounded-lg overflow-hidden border border-[var(--card-border)]">
        <Image
          src={src}
          alt={alt}
          width={960}
          height={540}
          className="w-full h-auto"
        />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-3 text-sm leading-relaxed text-[var(--cream-subtle)]">
          {caption && <span>{caption}</span>}
          {caption && credit && <span> — </span>}
          {credit && (
            <span className="italic font-['Redaction_20']">{credit}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
