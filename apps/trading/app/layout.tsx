import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { getProperty } from "@typhed/brand"
import { AuthControls, AuthProvider } from "@typhed/auth"
import { BRAND_VIEWPORT, buildMetadata } from "@typhed/ui/lib/metadata"
import { SiteShell } from "@typhed/ui/components/site-shell"
import { ThemeProvider } from "@typhed/ui/components/theme-provider"

import { ChatFab } from "@/components/chat-fab"
import { PrivacyGuard } from "@/components/privacy-guard"
import { SiteNotice } from "@/components/site-notice"

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

export const metadata: Metadata = buildMetadata(getProperty("trading"))

export const viewport: Viewport = BRAND_VIEWPORT

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {/* AuthProvider sits inside ThemeProvider so the Clerk modal accent
            follows the active theme. */}
        <ThemeProvider>
          <AuthProvider>
            <PrivacyGuard />
            <SiteShell
              propertyId="trading"
              authSlot={<AuthControls />}
              mobileAuthSlot={<AuthControls className="w-full" />}
              background={false}
            >
              {children}
              <SiteNotice />
            </SiteShell>
            <ChatFab />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
