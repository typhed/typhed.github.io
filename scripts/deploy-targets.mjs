/**
 * Print, as a JSON array, the apps the deploy workflow should publish.
 *
 * An app is deployable when apps/<name>/wrangler.jsonc exists, so a new
 * subdomain needs no workflow change. DEPLOY_APPS selects them:
 *
 *   all               every deployable app
 *   web,trading       a comma-separated list (unknown names are dropped)
 *   affected (or "")  apps Turborepo marks as affected since TURBO_SCM_BASE,
 *                     including those whose shared packages changed
 *
 * When the base commit is unknown (a new branch pushes an all-zero SHA) or
 * Turborepo cannot answer, every deployable app is returned: deploying too
 * much is safe, deploying nothing is not.
 */

import { execFileSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"

const deployable = readdirSync("apps", { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(`apps/${entry.name}/wrangler.jsonc`))
  .map((entry) => entry.name)
  .sort()

function affected() {
  const base = process.env.TURBO_SCM_BASE ?? ""
  if (!base || /^0+$/.test(base)) return deployable

  try {
    const output = execFileSync("pnpm", ["exec", "turbo", "ls", "--affected", "--output=json"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "inherit"],
    })
    const names = new Set(JSON.parse(output).packages.items.map((item) => item.name))
    return deployable.filter((app) => names.has(app))
  } catch {
    return deployable
  }
}

const request = (process.env.DEPLOY_APPS ?? "").trim()
const targets =
  request === "all"
    ? deployable
    : request === "" || request === "affected"
      ? affected()
      : request
          .split(",")
          .map((name) => name.trim())
          .filter((name) => deployable.includes(name))

console.log(JSON.stringify(targets))
