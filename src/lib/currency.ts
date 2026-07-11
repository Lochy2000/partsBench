// Money is always stored/validated as integer pence (docs/00-OVERVIEW.md decision #1) —
// these only convert for display and form input, never change how it's persisted.

export function formatPence(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

export function penceToPoundsInput(pence: number): string {
  return (pence / 100).toFixed(2);
}

// Returns a string so it can go straight into a hidden pence input's value — empty/invalid
// input becomes "", which the existing Zod coercion already treats as 0 (cost/fees) or
// null (soldPricePence via its z.literal("") branch), so no schema changes were needed.
export function poundsInputToPenceValue(pounds: string): string {
  if (pounds.trim() === "") return "";
  const parsed = Number(pounds);
  if (!Number.isFinite(parsed)) return "";
  return String(Math.round(parsed * 100));
}
