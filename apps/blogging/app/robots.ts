import { getProperty } from "@typhed/brand"
import { buildRobots } from "@typhed/ui/lib/metadata"

export const dynamic = "force-static"

export default function robots() {
  return buildRobots(getProperty("blogging"))
}
