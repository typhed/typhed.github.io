import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { SITE, getProperty } from "@typhed/brand"
import { AuthControls, AuthProvider } from "@typhed/auth"
import { BRAND_VIEWPORT, buildMetadata } from "@typhed/ui/lib/metadata"
import { SiteShell } from "@typhed/ui/components/site-shell"
import { ThemeProvider } from "@typhed/ui/components/theme-provider"

import "./theme.css"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = buildMetadata(getProperty("web"), {
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
})

export const viewport: Viewport = BRAND_VIEWPORT

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/mark/typhed-mark-1024.png`,
      slogan: SITE.tagline,
      description: SITE.description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: `${SITE.name} - ${SITE.tagline}`,
      url: SITE.url,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en",
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="bg-background text-foreground min-h-dvh font-sans antialiased">
        {/* The site is a static export, so Clerk runs entirely in the browser.
            AuthProvider sits inside ThemeProvider so the Clerk modal accent
            follows the active theme. */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SiteShell
              propertyId="web"
              authSlot={<AuthControls />}
              mobileAuthSlot={<AuthControls className="w-full" />}
              scrollToTop
            >
              {children}
            </SiteShell>
          </AuthProvider>
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
