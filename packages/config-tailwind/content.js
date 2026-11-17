const path = require("node:path")

/**
 * Source globs of the shared packages that render Tailwind classes. Every app
 * spreads this list into its own `content`, so a class used only inside a
 * shared component is still generated. Add a directory here, not in each app.
 */
const glob = (...parts) => path.join(__dirname, "..", ...parts).split(path.sep).join("/")

module.exports = [glob("ui", "components", "**", "*.{ts,tsx}"), glob("auth", "src", "**", "*.{ts,tsx}")]
