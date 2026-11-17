<div align = "center">

# Known Gaps

</div>

<div align = "justify">

Open questions and missing values, recorded instead of guessed. Each one needs the owner's answer before anyone acts on
it. Remove an entry when it is resolved.

  * **Privacy principle versus blog analytics.** The brand promises no tracking, yet `apps/blogging` loads GA4, AdSense,
    and Microsoft Clarity whenever their `NEXT_PUBLIC_*` ids are set. Keep, gate behind consent, or remove?
  * **AdSense publisher id.** `apps/blogging/public/ads.txt` carries the placeholder `pub-0000000000000000`.
  * **Legal entity in blog copy.** The brand contract names no legal entity, but the blog's description and keywords in
    `packages/brand/properties.json` do.
  * **Trading and blog logos.** Neither site has its own artwork yet; the owner designs it and adds it under
    `packages/brand/assets`. Until then both sites show the TyPhed mark and favicon set, and no logo is drawn in code.

</div>
