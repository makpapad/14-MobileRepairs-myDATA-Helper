import type { Invoice } from "@prisma/client";

export type VatReport = {
  totalVat364: number;
  totalVat365: number;
  totalReverseChargeVat: number;
  totalVat361: number;
  totalNonParticipating: number;
};

export function buildVatReport(invoices: Invoice[]): VatReport {
  const totals: VatReport = {
    totalVat364: 0,
    totalVat365: 0,
    totalReverseChargeVat: 0,
    totalVat361: 0,
    totalNonParticipating: 0,
  };

  for (const invoice of invoices) {
    if (invoice.status === "excluded") continue;
    const net = Number(invoice.netAmountCents) / 100;
    const vat = Number(invoice.vatAmountCents) / 100;
    const classification = invoice.vatClassification || "";

    if (classification.includes("364-Φ2")) totals.totalVat364 += net;
    if (classification.includes("365-Φ2")) totals.totalVat365 += net;
    if (classification.includes("361-Φ2")) totals.totalVat361 += net;
    if (classification.includes("μη συμμετοχή")) totals.totalNonParticipating += net;
    if (invoice.isReverseCharge) totals.totalReverseChargeVat += net * 0.24;
    if (!invoice.isReverseCharge && vat > 0 && classification.includes("361-Φ2")) totals.totalReverseChargeVat += 0;
  }

  return {
    totalVat364: round(totals.totalVat364),
    totalVat365: round(totals.totalVat365),
    totalReverseChargeVat: round(totals.totalReverseChargeVat),
    totalVat361: round(totals.totalVat361),
    totalNonParticipating: round(totals.totalNonParticipating),
  };
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
