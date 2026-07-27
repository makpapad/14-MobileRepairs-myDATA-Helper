import Link from "next/link";
import { FileUp, ReceiptText } from "lucide-react";
import { getDashboardData } from "@/src/lib/db/queries";
import { buildViesReport, viesTotals } from "@/src/lib/reports/viesReportBuilder";
import { Button, Money, PageHeader, StatusBadge } from "@/components/ui";
import { DatabaseSetupNotice } from "@/components/DatabaseSetupNotice";
import { MonthYearFilter } from "@/components/PeriodFilters";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const selectedMonth = Number(params.month || new Date().getMonth() + 1);
  const selectedYear = Number(params.year || new Date().getFullYear());
  const data = await getDashboardData({ month: selectedMonth, year: selectedYear });
  const vies = buildViesReport(data.invoices);
  const totals = viesTotals(vies);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Σύνοψη παραστατικών, εκκρεμοτήτων και ποσών VIES για τον τρέχοντα μήνα."
        actions={
          <>
            <Link href="/invoices/upload">
              <Button>
                <FileUp className="h-4 w-4" />
                Upload PDF
              </Button>
            </Link>
            <Link href="/invoices">
              <Button variant="secondary">
                <ReceiptText className="h-4 w-4" />
                Παραστατικά
              </Button>
            </Link>
          </>
        }
      />
      <MonthYearFilter month={selectedMonth} year={selectedYear} submitLabel="Αλλαγή μήνα" />
      {data.dbError ? <DatabaseSetupNotice message={data.dbError} /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Παραστατικά μήνα" value={data.currentMonth} />
        <Metric label="Θέλουν έλεγχο" value={data.needsReview} tone="amber" />
        <Metric label="Εγκρίθηκαν" value={data.approved} tone="teal" />
        <Metric label="VIES αγαθά" value={<Money value={totals.goodsAmount} />} />
        <Metric label="VIES υπηρεσίες" value={<Money value={totals.servicesAmount} />} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-950">Πρόσφατα παραστατικά</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ημερομηνία</th>
                  <th className="px-4 py-3">Προμηθευτής</th>
                  <th className="px-4 py-3">Αριθμός</th>
                  <th className="px-4 py-3">Σύνολο</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.invoices.slice(0, 8).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{invoice.invoiceDate?.toLocaleDateString("el-GR")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{invoice.supplier?.name ?? "Άγνωστος"}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.invoiceNumber ?? "-"}</td>
                    <td className="px-4 py-3"><Money value={String(invoice.grossAmountCents / 100)} currency={invoice.currency} /></td>
                    <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">myDATA πρόταση</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Κάθε παραστατικό παίρνει προτεινόμενο τύπο παραστατικού, κατηγορία, E3 και ΦΠΑ χαρακτηρισμό από το rule engine.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <Info label="Reverse charge" value="Υπολογισμός 24% για έλεγχο ΦΠΑ" />
            <Info label="VIES" value="Grouping ανά χώρα και VAT number" />
            <Info label="Υποβολή" value="Δεν γίνεται αυτόματη οριστική υποβολή" />
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: React.ReactNode; tone?: "slate" | "amber" | "teal" }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className={tone === "amber" ? "mt-2 text-2xl font-semibold text-amber-700" : tone === "teal" ? "mt-2 text-2xl font-semibold text-teal-700" : "mt-2 text-2xl font-semibold text-slate-950"}>{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-1 text-slate-800">{value}</div>
    </div>
  );
}
