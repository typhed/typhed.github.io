import * as React from "react"
import Link from "next/link"

import { ACCESS_CATEGORIES } from "@/lib/constants"
import type { PostMeta } from "@/lib/posts"

/**
 * Right-rail "Related" section driven by a post's `related` frontmatter slugs
 * (already resolved to listing metadata upstream by `getRelatedPosts`, which
 * drops unknown/hidden slugs). It sits below the access panel in the rail and
 * is omitted when nothing resolves. Each entry links to the post by title with
 * a small access-tier + reading-time caption. Colors come from theme tokens.
 */
export function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null

  return (
    <nav aria-label="Related posts" className="text-sm">
      <p className="font-display text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
        Related
      </p>
      <ul className="space-y-3">
        {posts.map((post) => {
          const access = ACCESS_CATEGORIES[post.accessCategory]
          return (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}/`} className="group block">
                <span className="text-foreground group-hover:text-brand block font-medium leading-snug transition-colors">
                  {post.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-[calc(11px*var(--font-scale,1))]">
                  <span aria-hidden="true">{access.emoji}</span>{" "}
                  <span className="sr-only">{access.label}. </span>
                  {post.readingTimeText}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default RelatedPosts
