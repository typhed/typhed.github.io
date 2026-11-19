import { describe, expect, it } from "vitest"

import { formatPostDate, getAllPosts } from "@/lib/posts"

describe("post dates", () => {
  it("keeps every frontmatter date as a yyyy-mm-dd string", () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    for (const post of posts) {
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it("formats a post date as the same day in any time zone", () => {
    const zone = process.env.TZ
    // UTC-05:00: a local-time read of UTC midnight would show the day before.
    process.env.TZ = "America/New_York"
    try {
      expect(formatPostDate("2026-07-13")).toBe("July 13, 2026")
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  })
})
