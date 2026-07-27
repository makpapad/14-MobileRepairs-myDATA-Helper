import type { Invoice, Supplier } from "@prisma/client";

export type ViesReportRow = {
  countryCode: string;
  vatNumber: string;
  supplierName: string;
  goodsAmount: number;
  servicesAmount: number;
};

export function buildViesReport(invoices: Array<Invoice & { supplier: Supplier | null }>): ViesReportRow[] {
  const grouped = new Map<string, ViesReportRow>();

  for (const invoice of invoices) {
    if (invoice.status === "excluded") continue;
    const goods = Number(invoice.viesGoodsAmountCents) / 100;
    const services = Number(invoice.viesServicesAmountCents) / 100;
    if (!goods && !services) continue;
    const countryCode = invoice.viesCountryCode || invoice.supplier?.countryCode || "";
    const vatNumber = invoice.viesVatNumber || invoice.supplier?.vatNumber || "";
    const key = `${countryCode}:${vatNumber}`;
    const current =
      grouped.get(key) ??
      ({
        countryCode,
        vatNumber,
        supplierName: invoice.supplier?.name || "Άγνωστος προμηθευτής",
        goodsAmount: 0,
        servicesAmount: 0,
      } satisfies ViesReportRow);
    current.goodsAmount += goods;
    current.servicesAmount += services;
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => `${a.countryCode}${a.vatNumber}`.localeCompare(`${b.countryCode}${b.vatNumber}`));
}

export function viesTotals(rows: ViesReportRow[]) {
  return rows.reduce(
    (total, row) => ({
      goodsAmount: total.goodsAmount + row.goodsAmount,
      servicesAmount: total.servicesAmount + row.servicesAmount,
    }),
    { goodsAmount: 0, servicesAmount: 0 },
  );
}

export function toCsv(rows: ViesReportRow[]) {
  const header = ["Χώρα", "VAT number", "Προμηθευτής", "Στήλη 5 αγαθά", "Στήλη 7 υπηρεσίες"];
  const lines = rows.map((row) => [row.countryCode, row.vatNumber, row.supplierName, row.goodsAmount.toFixed(2), row.servicesAmount.toFixed(2)]);
  return [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}
