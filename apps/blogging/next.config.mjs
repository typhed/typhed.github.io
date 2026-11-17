import { createNextConfig } from "@typhed/next-config"

export default createNextConfig({
  // The MDX toolchain runs only at build time inside server components, so it
  // stays out of the client bundle.
  serverExternalPackages: [
    "next-mdx-remote",
    "remark-gfm",
    "remark-math",
    "rehype-katex",
    "rehype-slug",
    "rehype-autolink-headings",
    "rehype-pretty-code",
    "shiki",
    // Used by the local remark/rehype plugins (remark-diagrams,
    // rehype-collect-headings); external for the same reasons as the rest.
    "unist-util-visit",
    "hast-util-to-string",
  ],
})
