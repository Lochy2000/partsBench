import type { Category } from "@prisma/client";
import type { ChecklistRowData } from "@/lib/checklists";

export interface ListingDraftItem {
  name: string;
  category: Category;
  specs: { key: string; value: string }[];
}

export interface ListingDraft {
  title: string;
  description: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  CPU: "CPU",
  GPU: "GPU",
  RAM: "RAM",
  MOTHERBOARD: "Motherboard",
  STORAGE: "Storage",
  PSU: "PSU",
  CASE: "Case",
  COOLING: "Cooling",
  OTHER: "PC Part",
};

// Evidence-first (docs/00-OVERVIEW.md decision #8): specs are the user's own declared
// attributes, always safe to state. Test claims are different — only a PASS checklist row
// proves a claim, so PENDING/FAIL rows never appear here. Zero passed checks means the
// "Tested & confirmed" section is omitted entirely rather than shown empty or fabricated.
export function buildListingDraft(
  item: ListingDraftItem,
  checklistRows: ChecklistRowData[],
): ListingDraft {
  const categoryLabel = CATEGORY_LABELS[item.category];
  const title = `${item.name} — ${categoryLabel}`;

  const specLines = item.specs.map((spec) => `- ${spec.key}: ${spec.value}`);
  const passedLines = checklistRows
    .filter((row) => row.result === "PASS")
    .map((row) => `- ${row.checklistItem}`);

  const sections = [`${item.name} (${categoryLabel})`];
  if (specLines.length > 0) sections.push(["Specs:", ...specLines].join("\n"));
  if (passedLines.length > 0) sections.push(["Tested & confirmed:", ...passedLines].join("\n"));

  return { title, description: sections.join("\n\n") };
}
