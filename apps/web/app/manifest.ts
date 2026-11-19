import { getProperty } from "@typhed/brand"
import { buildManifest } from "@typhed/ui/lib/metadata"

export const dynamic = "force-static"

export default function manifest() {
  return buildManifest(getProperty("web"))
}
