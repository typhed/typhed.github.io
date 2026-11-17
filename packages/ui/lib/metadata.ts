import type { Metadata, Viewport } from "next"
import { SITE, type Property } from "@typhed/brand"

/**
 * The page metadata every property shares, built from its entry in
 * properties.json. The icons point at the brand artwork that typhed-brand-sync
 * copies into each app's public/brand, and the baked colours are the ones the
 * brand artwork uses (see docs/design/colors.yml). Pass `overrides` for
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

/** The browser chrome colours for both themes, shared by every property. */
export const BRAND_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
}
