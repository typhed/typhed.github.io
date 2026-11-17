import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { SITE, getProperty } from "@typhed/brand"
import { AuthControls, AuthProvider } from "@typhed/auth"
import { SiteShell } from "@typhed/ui/components/site-shell"
import { ThemeProvider } from "@typhed/ui/components/theme-provider"

import { ChatFab } from "@/components/chat-fab"
import { PrivacyGuard } from "@/components/privacy-guard"

import "./theme.css"
import "./globals.css"

const TRADING = getProperty("trading")

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

export const metadata: Metadata = {
  title: {
    default: `${TRADING.name} - ${SITE.tagline}`,
    template: `%s - ${TRADING.name}`,
  },
  description: TRADING.description,
  metadataBase: new URL(TRADING.url),
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#080c1c" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {/* AuthProvider sits inside ThemeProvider so the Clerk modal accent
            follows the active theme. */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <PrivacyGuard />
            <SiteShell
              propertyId="trading"
              authSlot={<AuthControls />}
              mobileAuthSlot={<AuthControls className="w-full" />}
              background={false}
            >
              {children}
            </SiteShell>
            <ChatFab />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
