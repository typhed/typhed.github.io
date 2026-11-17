/**
 * Source globs of the shared packages that render Tailwind classes, relative to
 * an app folder (`apps/<name>`), where every app's build runs. Every app spreads
 * this list into its own `content`, so a class used only inside a shared
 * component is still generated; add a directory here, not in each app.
 *
 * The globs stay relative on purpose. An absolute path would carry the checkout
 * folder into the pattern, and a folder name containing brackets is read as a
 * character class that silently matches nothing, leaving shared components
 * unstyled while the build still succeeds.
 */
module.exports = ["../../packages/ui/components/**/*.{ts,tsx}", "../../packages/auth/src/**/*.{ts,tsx}"]
