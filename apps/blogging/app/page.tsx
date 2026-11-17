import Link from "next/link"

import { AccessBadge } from "@/components/access-badge"
import { SITE } from "@/lib/constants"
import { getAllPosts } from "@/lib/posts"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function HomePage() {
  const posts = getAllPosts()

  return (
    <div className="container max-w-3xl py-16 sm:py-24">
      <section className="animate-fade-up mb-16">
        <h1 className="font-display text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
          {SITE.name}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg leading-8">{SITE.description}</p>
      </section>

      <section>
        <h2 className="font-display text-muted-foreground mb-6 text-sm font-semibold uppercase tracking-wider">
          Latest posts
        </h2>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">
            No posts yet. Add an <code>.mdx</code> file to <code>content/blog/</code> to publish
            your first post.
          </p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug} className="group">
                <Link
                  href={`/blog/${post.slug}/`}
                  className="border-border bg-card/50 hover:border-brand/50 block rounded-xl border p-6 transition-colors"
                >
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <AccessBadge category={post.accessCategory} />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingTimeText}</span>
                  </div>
                  <h3 className="font-display text-foreground group-hover:text-brand mt-2 text-xl font-semibold transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">{post.description}</p>
                  {post.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
