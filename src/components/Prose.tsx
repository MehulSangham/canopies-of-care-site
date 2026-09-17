import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Callout from "@/components/tina/Callout";
import CaptionedImage from "@/components/tina/CaptionedImage";
import DataTable from "@/components/tina/DataTable";
import FootnoteRef from "@/components/tina/FootnoteRef";
import Footnote from "@/components/tina/Footnote";

const mdxComponents: MDXRemoteProps["components"] = {
  Callout,
  CaptionedImage,
  DataTable,
  FootnoteRef,
  Footnote,
};

interface ProseProps {
  content: string;
}

export default function Prose({ content }: ProseProps) {
  return (
    <article className="prose">
      <MDXRemote
        source={content}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: "wrap" }],
            ],
          },
        }}
      />
    </article>
  );
}
