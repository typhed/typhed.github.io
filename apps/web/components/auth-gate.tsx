"use client";

import { SignInButton, useAuth } from "@clerk/react";
import { Lock } from "lucide-react";

import { CLERK_ENABLED } from "@/lib/env";
import { SITE } from "@/lib/constants";
import { Button } from "@/components/ui/button";

/**
 * Whole-workspace gate. The brief requires a user to be signed in before using
 * the platform, so the tool area is wrapped in this component. When Clerk is
 * disabled (no key configured) the gate is transparent so local builds work.
 *
 * Note: this is a client-side gate. Uploaded data never leaves the browser, so
 * there is nothing server-side to protect here - the gate enforces sign-in for
 * access and accounts, not data secrecy.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  // Guard before the hook: with no key there is no ClerkProvider to host it.
  if (!CLERK_ENABLED) {
    return <>{children}</>;
  }
  return <AuthGateInner>{children}</AuthGateInner>;
}

function AuthGateInner({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="container py-24">
        <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (isSignedIn) {
    return <>{children}</>;
  }

  return <SignInPrompt />;
}

function SignInPrompt() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-brand">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Sign in to open the workspace
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {SITE.name} uses the same free {SITE.tagline} account as the main site
        and the blog. Sign in once and you are signed in everywhere.
      </p>
      <div className="mt-6">
        <SignInButton mode="modal">
          <Button variant="brand" size="lg">
            Sign in to continue
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}
