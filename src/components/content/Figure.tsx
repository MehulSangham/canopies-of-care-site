import Image from "next/image";

interface FigureProps {
  src: string;
  alt: string;
  caption?: string;
  number?: number;
  credit?: string;
}

export function Figure({ src, alt, caption, number, credit }: FigureProps) {
  return (
    <figure className="content-figure">
      <div className="figure-image-wrapper">
        <Image
          src={src}
          alt={alt}
          width={960}
          height={540}
          className="figure-image"
        />
      </div>
      {(caption || credit) && (
        <figcaption className="figure-caption">
          {number && <span className="figure-number">Figure {number}: </span>}
          {caption}
          {credit && (
            <>
              {caption && " — "}
              <span className="figure-credit">{credit}</span>
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
