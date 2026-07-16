/**
 * Static export for GitHub Pages: no Node server exists at request time, so
 * authentication and every analysis run entirely in the browser.
 *
 * `trailingSlash` emits `route/index.html` (GH Pages serves directories),
 * and images are unoptimised because the Next image optimiser needs a server.
 * No `basePath` is set: the site is served from the apex of the custom domain
 * `trading.typhed.com` via `public/CNAME`. If it is ever served from a
 * `user.github.io/repo` sub-path instead, add `basePath` and `assetPrefix`.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Internal TS packages are shipped as source and compiled by Next.
  transpilePackages: ["@typhed/chart-engine", "@typhed/risk-toolkit"],
};

export default nextConfig;
