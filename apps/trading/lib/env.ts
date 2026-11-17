/**
 * Client auth configuration. The publishable key is a public value baked into
 * the bundle at build time. When it is absent the whole app runs with auth
 * OFF, so local development and CI builds work without a Clerk key.
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export const CLERK_ENABLED = CLERK_PUBLISHABLE_KEY.length > 0;
