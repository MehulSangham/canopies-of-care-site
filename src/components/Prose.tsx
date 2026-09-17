import { Children, type ComponentProps, Fragment, type ReactNode, isValidElement } from "react";
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
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
  img: MdxImage,
  p: Paragraph,
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
        },
      }}
    />
  );
}
