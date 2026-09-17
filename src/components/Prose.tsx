import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Callout from "@/components/tina/Callout";
import CaptionedImage from "@/components/tina/CaptionedImage";
import DataTable from "@/components/tina/DataTable";
import { Sidenote, FootnoteItem, FootnoteList } from "@/components/content/Sidenote";
import { VideoEmbed } from "@/components/content/VideoEmbed";
import { Figure } from "@/components/content/Figure";

const mdxComponents: MDXRemoteProps["components"] = {
  Callout,
  CaptionedImage,
  DataTable,
  Sidenote,
  FootnoteItem,
  FootnoteList,
  VideoEmbed,
  Figure,
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
