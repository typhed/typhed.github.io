/**
 * The serverless entitlement gate - the hard gate for a paid tool whose
 * computation is the product. It is NOT part of the static export;
 * deploy it separately (Cloudflare Workers, Vercel Edge, or any
 * fetch-handler runtime) and point the paid tool at it.
 *
 * Why this exists: the in-app `<Entitled>` gate is a soft gate - a Pro
 * tool's JavaScript still ships in the static bundle and can be reached by
 * a determined user. When the maths itself must be protected it moves here:
 * the browser sends the user's Clerk session token, this handler verifies
 * the token and the entitlement server-side, and only then runs the
 * protected computation.
 *
 * Deployment status is tracked in README.md beside this file. Until this
 * handler is deployed and a tool actually calls it, Pro remains a
 * convenience tier and must not be described as hard-protected.
 */

import { verifyToken } from "@clerk/backend"

export interface GateConfig {
  /**
   * Clerk verification material - set exactly one, always from a secret.
   * `jwtKey` (the instance's PEM public key) verifies networklessly;
   * `secretKey` verifies against Clerk's API.
   */
  jwtKey?: string
  secretKey?: string
  /** Origins allowed to call the gate; anything else gets 403. */
  allowedOrigins: readonly string[]
  /** Fixed-window per-user budget; defaults to 30 requests / minute. */
  rateLimit?: { maxRequests: number; windowMs: number }
}

/**
 * Claims this gate reads from the session token. `publicMetadata` is only
 * present when the Clerk instance customises its session token with
 * `{"publicMetadata": "{{user.public_metadata}}"}` - see README.md.
 */
export interface SessionClaims {
  sub: string
  publicMetadata?: { tier?: string; entitlements?: string[] }
}

/** True if the verified user is entitled to the feature. */
export function isEntitled(claims: SessionClaims, feature: string): boolean {
  const meta = claims.publicMetadata ?? {}
  if (meta.tier === "pro") return true
  return Array.isArray(meta.entitlements) && meta.entitlements.includes(feature)
}

const DEFAULT_RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 }
const RATE_MAP_SWEEP_SIZE = 10_000

/**
 * Fixed-window in-memory limiter. Memory is per isolate/instance, so this
 * is a best-effort brake on a single hot caller, not a distributed quota -
 * move the counters to KV / Durable Objects / Redis if the gate ever fronts
 * real spend.
 */
function createRateLimiter(limit: { maxRequests: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>()
  return (key: string, now: number): boolean => {
    if (windows.size > RATE_MAP_SWEEP_SIZE) {
      for (const [k, w] of windows) {
        if (now - w.start >= limit.windowMs) windows.delete(k)
      }
    }
    const window = windows.get(key)
    if (!window || now - window.start >= limit.windowMs) {
      windows.set(key, { start: now, count: 1 })
      return true
    }
    window.count += 1
    return window.count <= limit.maxRequests
  }
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  }
}

function json(status: number, body: unknown, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

/**
 * Build the fetch handler for the gate. Build it once per isolate, so the rate
 * limiter keeps its counts across requests, and wire it to the runtime like:
 *
 *   // Cloudflare Workers
 *   let gate: ((req: Request) => Promise<Response>) | undefined
 *   export default {
 *     fetch: (req: Request, env: Env) =>
 *       (gate ??= createGateHandler({
 *         secretKey: env.CLERK_SECRET_KEY,
 *         allowedOrigins: ["https://trading.typhed.com"],
 *       }))(req),
 *   };
 */
export function createGateHandler(config: GateConfig) {
  const limit = config.rateLimit ?? DEFAULT_RATE_LIMIT
  const allow = createRateLimiter(limit)

  return async function handleGate(request: Request): Promise<Response> {
    const origin = request.headers.get("Origin") ?? ""
    if (!config.allowedOrigins.includes(origin)) {
      return json(403, { error: "origin not allowed" })
    }
    const cors = corsHeaders(origin)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== "POST") {
      return json(405, { error: "method not allowed" }, cors)
    }

    const auth = request.headers.get("Authorization") ?? ""
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
    if (token === "") {
      return json(401, { error: "missing bearer token" }, cors)
    }

    // JWKS-backed signature + lifetime verification via @clerk/backend.
    const claims = (await verifyToken(token, {
      jwtKey: config.jwtKey,
      secretKey: config.secretKey,
    }).catch(() => null)) as SessionClaims | null
    if (!claims || typeof claims.sub !== "string") {
      return json(401, { error: "invalid session" }, cors)
    }

    if (!allow(claims.sub, Date.now())) {
      return json(429, { error: "rate limit exceeded" }, cors)
    }

    let body: { feature?: unknown; payload?: unknown }
    try {
      body = (await request.json()) as { feature?: unknown; payload?: unknown }
    } catch {
      return json(400, { error: "invalid JSON body" }, cors)
    }
    const feature = typeof body.feature === "string" ? body.feature : ""
    if (feature === "") {
      return json(400, { error: "missing feature" }, cors)
    }

    if (!isEntitled(claims, feature)) {
      return json(403, { error: "not entitled", feature }, cors)
    }

    // Only reached by a verified, entitled, in-budget caller. The real
    // protected computation (the code that must not ship to the browser)
    // runs here.
    const result = runProtectedComputation(feature, body.payload)
    return json(200, { result }, cors)
  }
}

function runProtectedComputation(feature: string, _payload: unknown): unknown {
  // Placeholder: the protected analytics land here when a tool escalates
  // from the soft gate.
  return { feature, note: "protected computation runs server-side" }
}
