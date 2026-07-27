import { prisma } from "@/src/lib/db/prisma";
import { dbErrorMessage } from "@/src/lib/db/queries";
import { buildViesReport, viesTotals } from "@/src/lib/reports/viesReportBuilder";
import { Button, Money, PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { DatabaseSetupNotice } from "@/components/DatabaseSetupNotice";
import { MonthYearFilter } from "@/components/PeriodFilters";

export const dynamic = "force-dynamic";

export default async function ViesReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const month = Number(params.month || new Date().getMonth() + 1);
  const year = Number(params.year || new Date().getFullYear());
  const { invoices, dbError } = await getViesInvoicesSafely(month, year);
  const rows = buildViesReport(invoices);
  const totals = viesTotals(rows);
  const query = `month=${month}&year=${year}`;

  return (
    <div>
      <PageHeader title="Φ5 / VIES report" description="Grouping ανά χώρα και VAT number. Τα ποσά προορίζονται για έλεγχο πριν από οποιαδήποτε υποβολή." />
      {dbError ? <DatabaseSetupNotice message={dbError} /> : null}
      <MonthYearFilter month={month} year={year} />
      <div className="mb-4 flex flex-wrap gap-2">
        <a href={`/api/reports/vies?${query}&format=csv`}><Button variant="secondary">Export CSV</Button></a>
        <a href={`/api/reports/vies?${query}&format=xlsx`}><Button variant="secondary">Export Excel</Button></a>
        <PrintButton />
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-4 py-3">Χώρα</th>
              <th className="px-4 py-3">VAT number</th>
              <th className="px-4 py-3">Προμηθευτής</th>
              <th className="px-4 py-3">Στήλη 5 αγαθά</th>
              <th className="px-4 py-3">Στήλη 7 υπηρεσίες</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.countryCode}-${row.vatNumber}`}>
                <td className="px-4 py-3">{row.countryCode}</td>
                <td className="px-4 py-3">{row.vatNumber}</td>
                <td className="px-4 py-3 font-medium">{row.supplierName}</td>
                <td className="px-4 py-3"><Money value={row.goodsAmount} /></td>
                <td className="px-4 py-3"><Money value={row.servicesAmount} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold">
            <tr>
              <td className="px-4 py-3" colSpan={3}>Σύνολα</td>
              <td className="px-4 py-3"><Money value={totals.goodsAmount} /></td>
              <td className="px-4 py-3"><Money value={totals.servicesAmount} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

async function getViesInvoicesSafely(month: number, year: number) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { periodMonth: month, periodYear: year, status: { not: "excluded" } },
      include: { supplier: true },
    });
    return { invoices, dbError: null };
  } catch (error) {
    return { invoices: [], dbError: dbErrorMessage(error) };
  }
}
