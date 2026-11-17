import type { ReactNode } from "react"
import { getProperty, type PropertyId } from "@typhed/brand"

import { AbstractBackground } from "./abstract-background"
import { ProductSidebar } from "./product-sidebar"
import { ScrollToTop } from "./scroll-to-top"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

/**
 * The page frame every property renders: the shared brand header, the page
 * content, and the shared footer. A property with sidebar groups in
 * properties.json also gets its product menu as a left-hand column; a
 * property without one renders its content full width.
 *
 * Auth stays a slot, exactly as on SiteHeader, so this package never imports
 * an auth provider. Providers (theme, auth) wrap the shell in the app layout.
 */
export function SiteShell({
  propertyId,
  authSlot,
  mobileAuthSlot,
  background = true,
  scrollToTop = false,
  children,
}: {
  propertyId: PropertyId
  /** Desktop auth control, forwarded to SiteHeader. */
  authSlot?: ReactNode
  /** Mobile auth control, forwarded to SiteHeader's MobileNav. */
  mobileAuthSlot?: ReactNode
  /** Render the animated AbstractBackground behind the page. */
  background?: boolean
  /** Render the floating ScrollToTop button. */
  scrollToTop?: boolean
  children: ReactNode
}) {
  const property = getProperty(propertyId)

  return (
    <>
      {background ? <AbstractBackground /> : null}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <SiteHeader authSlot={authSlot} mobileAuthSlot={mobileAuthSlot} />
        {property.sidebar.length > 0 ? (
          <div className="flex flex-1 flex-col md:flex-row">
            <ProductSidebar
              groups={property.sidebar}
              storageKey={`typhed:sidebar:${property.id}`}
              label={property.name}
            />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
        <SiteFooter />
      </div>
      {scrollToTop ? <ScrollToTop /> : null}
    </>
  )
}
