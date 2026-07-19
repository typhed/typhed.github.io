/**
 * The local tool registry: one entry per tool this site ships. The header
 * dropdowns, the mobile-menu groups, and the /tools and /budgeting index
 * pages all render from this list, so adding a tool is a data edit here -
 * never a nav or page edit.
 */

export type ToolCategory = "tools" | "budgeting";

export type ToolStatus = "live" | "beta" | "planned";

export type Tool = {
  id: string;
  /** Short name used in nav dropdowns and as the card title. */
  name: string;
  /** One-line description shown on the category index cards. */
  blurb: string;
  route: string;
  category: ToolCategory;
  status: ToolStatus;
};

export const TOOL_CATEGORIES: ReadonlyArray<{
  id: ToolCategory;
  label: string;
  route: string;
}> = [
  { id: "tools", label: "Tools", route: "/tools" },
  { id: "budgeting", label: "Budgeting", route: "/budgeting" },
];

export const TOOLS: readonly Tool[] = [
  {
    id: "ipo",
    name: "IPO Dashboard",
    blurb:
      "An editable IPO dashboard - price band, lot size, timeline, financials and GMP - that renders entirely in your browser and exports to a reusable JSON file.",
    route: "/tools/ipo",
    category: "tools",
    status: "live",
  },
  {
    id: "mnws",
    name: "Modified 50-30-20 Rule",
    blurb:
      "The classic 50-30-20 budget split on your first salary, every raise reversed into savings, and windfalls deployed by an editable split - projected month by month.",
    route: "/budgeting/mnws",
    category: "budgeting",
    status: "live",
  },
];

/** Tools in one category, in registry order. */
export const toolsInCategory = (category: ToolCategory) =>
  TOOLS.filter((tool) => tool.category === category);
