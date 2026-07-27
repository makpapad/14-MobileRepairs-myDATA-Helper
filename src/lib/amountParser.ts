export function normalizeAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? roundMoney(value) : 0;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function extractFirstAmount(text: string, labels: string[]): number {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Look for label, then optional €/$/£, then amount with decimals
    const regex = new RegExp(`${escaped}[^\\d]*[€$£]?\\s*([\\d]+[.,]\\d{2})`, "i");
    const match = text.match(regex);
    if (match) return normalizeAmount(match[1]);
  }
  return 0;
}
