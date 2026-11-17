/**
 * The PostCSS setup every TyPhed app builds with: Tailwind CSS 4, which also
 * adds the vendor prefixes. Each app's postcss.config.mjs re-exports this file.
 *
 * @type {import("postcss-load-config").Config}
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
