import { afterEach, describe, expect, it, vi } from "vitest"

import navigation from "../navigation.json"
import propertiesFile from "../properties.json"
import site from "../site.json"

/** A link as navigation.json writes it; see `LinkEntry` in types.ts. */
type Entry = { label: string; href?: string; property?: string; social?: string }

const footerEntries = (): Entry[] =>
  Object.values(navigation.footer).flatMap((column) => column.links as Entry[])

const propertyUrl = (id: string) =>
  propertiesFile.properties[id as keyof typeof propertiesFile.properties].url.replace(/\/+$/, "")

afterEach(() => {
  vi.doUnmock("../navigation.json")
  vi.resetModules()
})

describe("navigation links", () => {
  it("gives every property reference that property's URL", async () => {
    const brand = await import("../index")
    const resolved = brand.FOOTER_COLUMN_GROUPS.flat().flatMap((column) => column.links)
    const references = footerEntries().filter((entry) => entry.property)
    expect(references.length).toBeGreaterThan(0)
    for (const entry of references) {
      const url = propertyUrl(entry.property as string)
      const link = resolved.find((item) => item.label === entry.label)
      expect(link?.href).toBe(`${url}/`)
      expect(link?.external).toBe(url === site.url.replace(/\/+$/, "") ? undefined : true)
    }
  })

  it("gives every social reference that account's URL", async () => {
    const brand = await import("../index")
    const resolved = brand.FOOTER_COLUMN_GROUPS.flat().flatMap((column) => column.links)
    for (const entry of footerEntries().filter((item) => item.social)) {
      const account = brand.SOCIAL_LINKS.find((item) => item.icon === entry.social)
      expect(account).toBeDefined()
      expect(resolved.find((item) => item.label === entry.label)?.href).toBe(account?.href)
    }
  })

  it("builds the mail link, the copyright line, and the brand-hub link from one source each", async () => {
    const brand = await import("../index")
    const mail = brand.SOCIAL_LINKS.find((item) => item.icon === "mail")
    expect(mail?.href).toBe(`mailto:${navigation.contactEmail}`)
    expect(brand.COPYRIGHT.line1).toBe(
      `Copyright © ${new Date().getFullYear()} ${site.name} - ${site.tagline}`,
    )
    expect(brand.NAV_LINKS[0]).toEqual({
      label: `${site.name} - ${site.tagline}`,
      href: `${site.url.replace(/\/+$/, "")}/`,
    })
  })

  it("writes no property or social URL a second time", () => {
    const propertyUrls = Object.keys(propertiesFile.properties).map(propertyUrl)
    const socialUrls = navigation.social.flatMap((account) => (account.href ? [account.href] : []))
    const entries: Entry[] = [
      ...navigation.nav,
      navigation.loginCta,
      navigation.privacy,
      ...footerEntries(),
    ]
    for (const entry of entries.filter((item) => item.href)) {
      expect(propertyUrls).not.toContain((entry.href as string).replace(/\/+$/, ""))
      expect(socialUrls).not.toContain(entry.href)
    }
  })

  it.each([
    ["an unknown property", { label: "Broken", property: "nowhere" }, /unknown property "nowhere"/],
    ["an unknown social account", { label: "Broken", social: "myspace" }, /unknown social account/],
    ["no destination", { label: "Broken" }, /exactly one of href, property, or social/],
    ["two destinations", { label: "Broken", href: "#", property: "trading" }, /exactly one/],
  ])("stops at module load on %s", async (_case, entry, message) => {
    vi.doMock("../navigation.json", () => ({
      default: { ...navigation, nav: [...navigation.nav, entry] },
    }))
    await expect(import("../index")).rejects.toThrow(message)
  })
})
