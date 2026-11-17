import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";

import { SITE } from "@/lib/constants";
import { ClerkAuthProvider } from "@/components/clerk-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivacyGuard } from "@/components/privacy-guard";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatFab } from "@/components/chat-fab";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s - ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#080c1c" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {/* ThemeProvider wraps Clerk so the auth modal accent can follow the
            active theme (see ClerkAuthProvider). */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkAuthProvider>
            <PrivacyGuard />
            <div className="relative flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <ChatFab />
          </ClerkAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
