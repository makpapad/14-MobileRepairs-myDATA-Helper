import { prisma } from "@/src/lib/db/prisma";
import { dbErrorMessage } from "@/src/lib/db/queries";
import { buildVatReport } from "@/src/lib/reports/vatReportBuilder";
import { Button, Money, PageHeader } from "@/components/ui";
import { DatabaseSetupNotice } from "@/components/DatabaseSetupNotice";
import { VatPeriodFilter } from "@/components/PeriodFilters";

export const dynamic = "force-dynamic";

export default async function VatReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const year = Number(params.year || new Date().getFullYear());
  const month = Number(params.month || 0);
  const quarter = Number(params.quarter || 0);
  const months = quarter ? [(quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2, (quarter - 1) * 3 + 3] : month ? [month] : [new Date().getMonth() + 1];
  const { invoices, dbError } = await getVatInvoicesSafely(months, year);
  const report = buildVatReport(invoices);

  return (
    <div>
      <PageHeader title="Έλεγχος ΦΠΑ" description="Προσυμπλήρωση ελέγχου ΦΠΑ με βάση εγκεκριμένα και μη αποκλεισμένα παραστατικά. Ο τελικός έλεγχος γίνεται από λογιστή/χρήστη πριν τη δήλωση ΦΠΑ." />
      {dbError ? <DatabaseSetupNotice message={dbError} /> : null}
      <VatPeriodFilter month={month || ""} quarter={quarter || ""} year={year} />
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Προειδοποίηση: ο τελικός έλεγχος γίνεται από λογιστή/χρήστη πριν τη δήλωση ΦΠΑ. Η εφαρμογή δεν κάνει οριστική υποβολή.
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <VatMetric label="364 ενδοκοινοτικές αποκτήσεις αγαθών" value={report.totalVat364} />
        <VatMetric label="365 ενδοκοινοτικές λήψεις υπηρεσιών" value={report.totalVat365} />
        <VatMetric label="Reverse charge VAT 24%" value={report.totalReverseChargeVat} />
        <VatMetric label="361 αγορές/δαπάνες εσωτερικού" value={report.totalVat361} />
        <VatMetric label="Μη συμμετοχή Φ2" value={report.totalNonParticipating} />
      </div>
      <div className="mt-5 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        Για reverse charge: 364 amount × 24% και 365 amount × 24%.
      </div>
    </div>
  );
}

async function getVatInvoicesSafely(months: number[], year: number) {
  try {
    const invoices = await prisma.invoice.findMany({ where: { periodYear: year, periodMonth: { in: months }, status: { not: "excluded" } } });
    return { invoices, dbError: null };
  } catch (error) {
    return { invoices: [], dbError: dbErrorMessage(error) };
  }
}

function VatMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="min-h-10 text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-950"><Money value={value} /></div>
    </div>
  );
}
