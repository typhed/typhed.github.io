/**
 * The Clerk publishable key, a public value inlined into the bundle at build
 * time from NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Every property uses the same key,
 * so one sign-in on clerk.typhed.com is recognised on every subdomain.
 *
 * Without a key, auth is off everywhere: the provider renders its children
 * bare and every gate passes through, so a local build runs without Clerk. The
 * deploy workflow refuses to build production without the key.
 */
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""

export const CLERK_ENABLED = CLERK_PUBLISHABLE_KEY.length > 0
