<div align = "center">

# Product Requirements Document (PRD)

</div>

<div align = "justify">

🚀 **`TyPhed - Engineering Tomorrow`** is a technology-driven brand built around privacy and data security. What sets us
apart is one core principle: we never track or share user data. As an end user of our products, you bring your own data,
or plug in a data connector, then analyse, build, fine-tune, and disconnect.

<div align = "center">

| Property | Document Version | Status |
| :---: | :---: | :---: |
| **`typhed.com`** - the brand and acquisition layer | v1.0.0-dev.0 | WIP |

</div>

## Scope Of This Document

This PRD governs **`typhed.com` alone**, the property this repository builds. Every TyPhed property keeps its own
requirements document in its own repository, because each answers a different question about what it should contain:
this one shapes the brand layer, `blog.typhed.com` shapes the blog, and each product shapes its own product. Nothing
written here constrains a subdomain, and a decision made on a subdomain does not reach back into this document.

What the properties share is the brand, not the requirements. The shared layer carries the brand contract, the design
tokens, and the [domain and subdomain model](../shared/documents/docs/brand/subdomain-model.md), which records how the
ecosystem is laid out across domains, repositories, and hosts.

## Product Overview

The platform serves as the **central brand, marketing, SEO, and informational website** for the product ecosystem. Its
primary responsibility is to establish and communicate the parent brand identity, not to host the products themselves.

Each product is deployed and operated under its own subdomain, allowing it to maintain its own technical architecture,
UX, and design requirements while remaining part of the same brand ecosystem. This website is the authoritative
destination for:

  * Overall brand positioning, messaging, and visual identity,
  * Product ecosystem overview and discovery,
  * SEO-focused content and organic search visibility,
  * Marketing campaigns, landing pages, and conversion-oriented content,
  * Company/about information and brand communications,
  * Product documentation or high-level product information where appropriate,
  * Legal notices, terms, privacy policies, cookie policies, disclaimers, and related compliance content,
  * Cross-product navigation and links to the relevant product subdomains, and
  * Other trust, credibility, and informational content associated with the parent brand.

## Domain Architecture

The architecture follows a domain and subdomain model. Shared brand elements, such as the main layout and the primary
navigation links, stay consistent across every property. Everything else lives on its own subdomain, which keeps control
and maintenance simpler.

```text
  https://typhed.com/          → Brand, Marketing, SEO, Legal, and Informational Hub
  https://blog.typhed.com/     → Blog, Product Notes, and Example Documentation
  https://trading.typhed.com/  → The Trading Product
```

The parent domain, which this repository builds, is therefore the **brand and acquisition layer**, while each subdomain
hosts an independent product experience. The subdomains are maintained in separate repositories and may not be visible
from this one at all. The DNS records, the one-repository-per-property rule, and the single sign-on that spans them are
covered in the [domain and subdomain model](../shared/documents/docs/brand/subdomain-model.md).

### Core Principle

This website should not replicate or constrain the individual product interfaces. Instead, it should provide a
consistent brand foundation and a clear path from **discovery → trust → product selection → product experience**, while
allowing each product subdomain to evolve independently according to its own design and functional requirements.

The resulting ecosystem should feel like a **single, coherent brand with multiple purpose-built products**, rather than a
monolithic application containing every product experience.

## Deciding Where Something Belongs

Two questions settle almost every case, and they are asked in this order:

| Question | Answer | Where It Goes |
| :---: | :---: | --- |
| Does it describe the brand, or sell a product a visitor has not chosen yet? | Yes | Here, on `typhed.com` |
| Is it part of using a product a visitor has already chosen? | Yes | That product's subdomain and repository |
| Is it a brand string, a colour, a footer link, or a shared component? | Yes | The shared layer, where every property reads it |

A feature that belongs to one product does not belong on the brand layer, and brand-level content does not belong inside
a product. When the answer is genuinely unclear, the tie-breaker is the visitor's position on the path above: before
product selection is this site, after it is the product.

</div>
