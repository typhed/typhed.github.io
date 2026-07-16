/**
 * Reference serverless entitlement gate - the "real" gate for a high-value paid
 * tool whose computation is the product. It is NOT part of the static GitHub
 * Pages build; deploy it separately (Cloudflare Workers, Vercel Edge, or any
 * edge/Node runtime) and point the paid tool at it.
 *
 * Why this exists: the in-app `<Entitled>` gate is a soft gate - a Pro tool's
 * JavaScript still ships in the static bundle and can be reached by a
 * determined user. When the maths itself must be protected, move it here: the
 * browser sends the user's Clerk session token, this function verifies it and
 * the entitlement server-side, and only then runs the protected computation.
 * The frontend stays static; only this one function leaves GitHub Pages.
 *
 * This file is intentionally dependency-light pseudocode-grade reference. In a
 * real deployment use `@clerk/backend`'s `verifyToken` (JWKS-backed) instead of
 * the placeholder below, and set CLERK_SECRET_KEY / CLERK_JWT_KEY as secrets.
 */

export interface GateRequest {
  /** Clerk session token from the browser (Authorization: Bearer ...). */
  token: string;
  /** The feature the caller wants, e.g. "risk-parity". */
  feature: string;
  /** Tool inputs (never trusted for auth; only for the computation). */
  payload: unknown;
}

export interface ClerkClaims {
  sub: string;
  publicMetadata?: { tier?: string; entitlements?: string[] };
}

/**
 * Verify a Clerk session token. Replace with `@clerk/backend`'s `verifyToken`,
 * which validates the signature against Clerk's JWKS and the token lifetime.
 */
async function verifyClerkToken(_token: string): Promise<ClerkClaims | null> {
  // In production:
  //   import { verifyToken } from "@clerk/backend";
  //   return await verifyToken(_token, { jwtKey: env.CLERK_JWT_KEY }) as ClerkClaims;
  throw new Error("Wire up @clerk/backend verifyToken before deploying.");
}

/** True if the verified user is entitled to the feature. */
function isEntitled(claims: ClerkClaims, feature: string): boolean {
  const meta = claims.publicMetadata ?? {};
  if (meta.tier === "pro") return true;
  return Array.isArray(meta.entitlements) && meta.entitlements.includes(feature);
}

/**
 * Edge/Worker entry point. Returns the protected result only for a verified,
 * entitled caller; otherwise 401/403. The gate is enforced server-side, so it
 * cannot be bypassed from the browser.
 */
export async function handleGate(request: GateRequest): Promise<{
  status: number;
  body: unknown;
}> {
  const claims = await verifyClerkToken(request.token).catch(() => null);
  if (!claims) return { status: 401, body: { error: "invalid session" } };

  if (!isEntitled(claims, request.feature)) {
    return { status: 403, body: { error: "not entitled", feature: request.feature } };
  }

  // Only reached by a verified, entitled user. Run the protected computation
  // here (the code that must not ship to the browser) and return its result.
  const result = runProtectedComputation(request.feature, request.payload);
  return { status: 200, body: { result } };
}

function runProtectedComputation(feature: string, _payload: unknown): unknown {
  // Placeholder: the real, protected analytics live here.
  return { feature, note: "protected computation runs server-side" };
}
