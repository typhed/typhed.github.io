/** @type {import("next").NextConfig} */
const nextConfig = {
  // Static HTML export for GitHub Pages (no Node server at runtime).
  output: "export",
  reactStrictMode: true,
  // GitHub Pages serves directories, so emit `route/index.html` files.
  trailingSlash: true,
  // The export build has no Image Optimization server.
  images: {
    unoptimized: true,
  },
  // Compile the shared workspace UI package from source.
  transpilePackages: ["@typhed/ui"],
}

export default nextConfig
