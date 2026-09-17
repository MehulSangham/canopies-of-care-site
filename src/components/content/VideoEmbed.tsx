"use client";

interface VideoEmbedProps {
  src: string;
  poster?: string;
  caption?: string;
}

export function VideoEmbed({ src, poster, caption }: VideoEmbedProps) {
  const isYouTube =
    src.includes("youtube.com") || src.includes("youtu.be");
  const isVimeo = src.includes("vimeo.com");

  if (isYouTube || isVimeo) {
    let embedUrl = src;
    if (isYouTube) {
      const videoId = src.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
      )?.[1];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    if (isVimeo) {
      const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    return (
      <figure className="video-figure">
        <div className="video-wrapper">
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-iframe"
          />
        </div>
        {caption && <figcaption className="video-caption">{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className="video-figure">
      <div className="video-wrapper-native">
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster}
          className="video-native"
        >
          <source src={src} />
        </video>
      </div>
      {caption && <figcaption className="video-caption">{caption}</figcaption>}
    </figure>
  );
}
