import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Callout from "@/components/tina/Callout";

const mdxComponents: MDXRemoteProps["components"] = {
  Callout,
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
