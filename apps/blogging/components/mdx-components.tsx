import * as React from "react"
import Link from "next/link"
import type { MDXComponents } from "mdx/types"

import { Chart } from "@/components/chart"
import { Mermaid } from "@/components/mermaid"
import { cn } from "@typhed/ui/lib/utils"

/**
 * Element overrides passed to `compileMDX`. Headings, links, lists, tables, and
 * blockquotes are styled with theme tokens so posts match the site design.
 *
 * `pre`/`code` are intentionally NOT overridden — `rehype-pretty-code` owns
 * their markup, and their appearance is styled globally in `app/globals.css`.
 */

function MdxAnchor({ href = "", className, ...props }: React.ComponentPropsWithoutRef<"a">) {
  const isExternal = /^https?:\/\//.test(href)
  const classes = cn(
    "font-medium text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand",
    className,
  )

  if (isExternal) {
    return <a href={href} target="_blank" rel="noreferrer" className={classes} {...props} />
  }
  return <Link href={href} className={classes} {...props} />
}

export const mdxComponents: MDXComponents = {
  // Custom block components injected by `remarkDiagrams` from ```mermaid and
  // ```chart fences. Capitalized keys match the MDX JSX element names.
  Mermaid,
  Chart,
  a: MdxAnchor,
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "font-display text-foreground mt-10 scroll-mt-24 text-3xl font-bold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "border-border/60 font-display text-foreground mt-12 scroll-mt-24 border-b pb-2 text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "font-display text-foreground mt-8 scroll-mt-24 text-xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "font-display text-foreground mt-6 scroll-mt-24 text-lg font-semibold",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("text-foreground/90 my-5 leading-7", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("text-foreground/90 my-5 ml-6 list-disc space-y-2", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("text-foreground/90 my-5 ml-6 list-decimal space-y-2", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => <li className={cn("leading-7", className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("border-brand/60 text-muted-foreground my-6 border-l-2 pl-4 italic", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("border-border/60 my-10", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="border-border my-6 overflow-x-auto rounded-lg border">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border-border bg-muted/50 text-foreground border-b px-4 py-2 text-left font-semibold",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn("border-border/60 text-foreground/90 border-b px-4 py-2", className)}
      {...props}
    />
  ),
  img: ({ className, alt, ...props }) => (
    // Static export uses unoptimized images; a plain <img> is correct here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn("border-border my-6 rounded-lg border", className)}
      alt={alt ?? ""}
      {...props}
    />
  ),
}
