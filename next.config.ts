import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The archive pages read content/ via fs at request time (never via import),
  // so output file tracing can't see it. Without this, Vercel's serverless
  // functions ship without the content and every archive page 404s.
  outputFileTracingIncludes: {
    "/*": ["content/**/*"],
  },
};

export default nextConfig;
