import { Children, type ComponentProps, Fragment, type ReactNode, isValidElement } from "react";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import Callout from "@/components/tina/Callout";
import { ZoomableImage } from "@/components/curriculum/ZoomableImage";
import { parseMdxImageCaption } from "@/lib/content/imageSources";

function MdxImage(props: { src?: string; alt?: string; title?: string }) {
  const { description, credit, creditHref } = parseMdxImageCaption(props.title);

  return (
    <ZoomableImage
      src={props.src}
      alt={props.alt || "Article Image"}
      description={description}
      credit={credit}
      creditHref={creditHref}
    />
  );
}

function Video(props: { url: string; caption?: string }) {
  const embedUrl = getVideoEmbedUrl(props.url);

  return (
    <figure className="my-8">
      <div
        className="relative border border-[color:var(--color-nis-soft)] bg-black overflow-hidden"
        style={{ paddingBottom: "56.25%" }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={props.caption || "Video"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
            <a
              href={props.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              Open video ↗
            </a>
          </div>
        )}
      </div>
      {props.caption && (
        <figcaption className="mt-2 text-center font-serif text-sm text-nis-muted italic">
          {props.caption}
        </figcaption>
      )}
    </figure>
  );
}

function getVideoEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function MdxLink(props: ComponentProps<"a">) {
  const href = props.href || "";
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-[color:var(--color-nis-ink)] hover:text-[color:var(--color-nis-hover)]"
      >
        {props.children}
        <span className="inline-block ml-0.5 text-[0.7em] opacity-60 no-underline">↗</span>
      </a>
    );
  }

  return <a {...props} className="underline text-[color:var(--color-nis-ink)] hover:text-[color:var(--color-nis-hover)]" />;
}

function isMeaningfulParagraphChild(child: ReactNode) {
  if (typeof child === "string") return child.trim().length > 0;
  return child !== null && child !== undefined && child !== false;
}

function isBlockMediaChild(child: ReactNode) {
  if (!isValidElement(child)) return false;
  return child.type === MdxImage || child.type === ZoomableImage || child.type === "img";
}

function Paragraph({ children, ...props }: ComponentProps<"p">) {
  const normalizedChildren = Children.toArray(children).filter(isMeaningfulParagraphChild);

  if (normalizedChildren.length === 0) return null;

  if (normalizedChildren.every(isBlockMediaChild)) {
    return <>{normalizedChildren}</>;
  }

  if (!normalizedChildren.some(isBlockMediaChild)) {
    return <p {...props}>{children}</p>;
  }

  const groups: ReactNode[][] = [];
  let currentGroup: ReactNode[] = [];
  let currentIsBlock: boolean | null = null;

  for (const child of normalizedChildren) {
    const isBlock = isBlockMediaChild(child);

    if (currentIsBlock === null) {
      currentIsBlock = isBlock;
      currentGroup = [child];
      continue;
    }

    if (currentIsBlock === isBlock) {
      currentGroup.push(child);
      continue;
    }

    groups.push(currentGroup);
    currentGroup = [child];
    currentIsBlock = isBlock;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  let inlineParagraphIndex = 0;

  return (
    <>
      {groups.map((group, index) => {
        if (isBlockMediaChild(group[0])) {
          return <Fragment key={index}>{group}</Fragment>;
        }

        const paragraphProps = inlineParagraphIndex === 0 ? props : {};
        inlineParagraphIndex += 1;

        return (
          <p key={index} {...paragraphProps}>
            {group}
          </p>
        );
      })}
    </>
  );
}

const mdxComponents: MDXRemoteProps["components"] = {
  Callout,
  Video,
  img: MdxImage,
  p: Paragraph,
  a: MdxLink,
};

interface ProseProps {
  content: string;
}

export default function Prose({ content }: ProseProps) {
  return (
    <MDXRemote
      source={content}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
