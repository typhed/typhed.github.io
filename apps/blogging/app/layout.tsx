import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { getProperty } from "@typhed/brand"
import { AuthControls, AuthProvider } from "@typhed/auth"
import { BRAND_VIEWPORT, buildMetadata } from "@typhed/ui/lib/metadata"
import { SiteShell } from "@typhed/ui/components/site-shell"
import { ThemeProvider } from "@typhed/ui/components/theme-provider"

import { GoogleAdSense } from "@/components/analytics/google-adsense"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity"
import { SITE } from "@/lib/constants"

import "./theme.css"
import "./globals.css"
import "katex/dist/katex.min.css"

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

const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = buildMetadata(getProperty("blogging"), {
  authors: [{ name: SITE.author, url: SITE.mainSiteUrl }],
  creator: SITE.brand,
  publisher: SITE.brand,
  verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
})

export const viewport: Viewport = BRAND_VIEWPORT

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.mainSiteUrl}/#organization`,
      name: SITE.brand,
      alternateName: ["Debmalya Pramanik"],
      url: SITE.mainSiteUrl,
      logo: `${SITE.mainSiteUrl}/brand/mark/typhed-mark-1024.png`,
      slogan: SITE.tagline,
    },
    {
      "@type": "Blog",
      "@id": `${SITE.url}/#blog`,
      name: `${SITE.name} - ${SITE.tagline}`,
      url: SITE.url,
      description: SITE.description,
      inLanguage: "en",
      publisher: { "@id": `${SITE.mainSiteUrl}/#organization` },
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
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {/* AuthProvider sits inside ThemeProvider so the Clerk modal accent
            follows the active theme. */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SiteShell
              propertyId="blogging"
              authSlot={<AuthControls />}
              mobileAuthSlot={<AuthControls className="w-full" />}
            >
              {children}
            </SiteShell>
          </AuthProvider>
        </ThemeProvider>
        {/* Analytics + monetization. Each no-ops until its NEXT_PUBLIC_* id is set. */}
        <GoogleAnalytics />
        <GoogleAdSense />
        <MicrosoftClarity />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
