import type { Category } from "@prisma/client";

// Suggested spec keys per category, purely a UI convenience — the underlying ItemSpec model
// stays generic key/value (docs/00-OVERVIEW.md decision #3), these are just chip labels to
// speed up manual entry, not a schema or a fixed set of allowed keys.
const SPEC_TEMPLATES: Partial<Record<Category, string[]>> = {
  GPU: ["VRAM", "Core Clock", "Boost Clock", "Interface"],
  CPU: ["Socket", "Cores", "Threads", "Base Clock", "TDP"],
  RAM: ["Capacity", "Speed", "Type", "Timings"],
  STORAGE: ["Capacity", "Interface", "Form Factor", "Read/Write Speed"],
  MOTHERBOARD: ["Socket", "Chipset", "Form Factor", "RAM Slots"],
  PSU: ["Wattage", "Efficiency Rating", "Modular"],
  CASE: ["Form Factor Support", "Included Fans"],
  COOLING: ["Type", "Socket Compatibility", "TDP Rating"],
};

const DEFAULT_SPEC_TEMPLATE = ["Condition", "Included Accessories"];

export function getSpecTemplateKeysForCategory(category: Category): string[] {
  return SPEC_TEMPLATES[category] ?? DEFAULT_SPEC_TEMPLATE;
}
