import type { Metadata, MetadataRoute, Viewport } from "next"
import { SITE, type Property } from "@typhed/brand"

/**
 * The page metadata every property shares, built from its entry in
 * properties.json. The icons point at the brand artwork that typhed-brand-sync
 * copies into each app's public/brand, and the baked colours are the ones the
 * brand artwork uses (see docs/brand/design/colors.yml). Pass `overrides` for
 * anything that belongs to one property alone, such as authors or site
 * verification; they replace the matching keys.
 */
export function buildMetadata(property: Property, overrides: Metadata = {}): Metadata {
  const title = `${property.name} - ${SITE.tagline}`

  return {
    metadataBase: new URL(property.url),
    title: {
      default: title,
      template: `%s - ${property.name}`,
    },
    description: property.description,
    applicationName: property.name,
    keywords: [...property.keywords],
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [
        { url: "/brand/favicon/favicon.svg", type: "image/svg+xml" },
        { url: "/brand/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/brand/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      shortcut: ["/brand/favicon/favicon.ico"],
      apple: [{ url: "/brand/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      other: [
        {
          rel: "mask-icon",
          url: "/brand/favicon/safari-pinned-tab.svg",
          color: "#6366f1",
        },
      ],
    },
    other: {
      "msapplication-TileColor": "#0b1020",
      "msapplication-config": "/brand/favicon/browserconfig.xml",
    },
    openGraph: {
      type: "website",
      url: property.url,
      siteName: property.name,
      title,
      description: property.description,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: property.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
    ...overrides,
  }
}

/** A property's robots.txt: crawl everything, and find the sitemap at its root. */
export function buildRobots(property: Property): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${property.url}/sitemap.xml`,
    host: property.url,
  }
}

/** A property's web app manifest, with the brand favicon set and the baked brand navy. */
export function buildManifest(property: Property): MetadataRoute.Manifest {
  return {
    name: `${property.name} - ${SITE.tagline}`,
    short_name: property.name,
    description: property.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    icons: [
      {
        src: "/brand/favicon/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/favicon/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}

/** The browser chrome colours for both themes, shared by every property. */
export const BRAND_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
}
