"use client"

/**
 * The Clerk primitives a property's own sign-in prompts use. Apps import them
 * from @typhed/auth so that this package stays the only one that depends on
 * Clerk directly.
 */
export { SignInButton, useAuth, useUser } from "@clerk/react"
