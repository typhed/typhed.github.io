import { config } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome"

// Every app imports Font Awesome's stylesheet into Tailwind's base layer (see
// @typhed/tailwind-config/base.css), so a utility such as `h-4 w-4` sizes an
// icon. Font Awesome would otherwise inject the same rules at runtime outside
// any layer, where they override every utility, so injection is switched off
// here, in the one module every icon renders through.
config.autoAddCss = false

/**
 * Every icon on the TyPhed sites: a Font Awesome icon definition rendered as an
 * inline SVG. Pass the definition (`icon={faSun}`) and size it with utilities.
 */
export function Icon(props: FontAwesomeIconProps) {
  return <FontAwesomeIcon {...props} />
}
