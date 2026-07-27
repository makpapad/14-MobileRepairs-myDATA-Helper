import Link from "next/link";
import { prisma } from "@/src/lib/db/prisma";
import { dbErrorMessage, getInvoiceFilters } from "@/src/lib/db/queries";
import { Button, Money, PageHeader, StatusBadge } from "@/components/ui";
import { DatabaseSetupNotice } from "@/components/DatabaseSetupNotice";
import { monthOptions, YearSelect } from "@/components/PeriodFilters";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = await getInvoiceFilters(params);
  const { invoices, dbError } = await getInvoicesSafely(filters.where);

  return (
    <div>
      <PageHeader title="Παραστατικά" description="Πίνακας ελέγχου παραστατικών με φίλτρα myDATA, VIES και reverse charge." actions={<Link href="/invoices/upload"><Button>Upload PDF</Button></Link>} />
      {dbError ? <DatabaseSetupNotice message={dbError} /> : null}
      <form className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-6">
        <MonthSelect defaultValue={String(params.month ?? "")} />
        <YearSelect year={String(params.year ?? "") || undefined} />
        <Input name="supplier" placeholder="Supplier" defaultValue={String(params.supplier ?? "")} />
        <Select name="status" defaultValue={String(params.status ?? "")} options={["", "uploaded", "parsed", "needs_review", "approved", "excluded"]} />
        <Select name="vies" defaultValue={String(params.vies ?? "")} options={["", "yes", "no"]} labels={{ yes: "VIES yes", no: "VIES no" }} />
        <Select name="reverseCharge" defaultValue={String(params.reverseCharge ?? "")} options={["", "yes", "no"]} labels={{ yes: "Reverse yes", no: "Reverse no" }} />
        <div className="md:col-span-6">
          <Button type="submit" variant="secondary">Φίλτρο</Button>
        </div>
      </form>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1150px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                <th className="px-3 py-3">Ημερομηνία</th>
                <th className="px-3 py-3">Προμηθευτής</th>
                <th className="px-3 py-3">Αριθμός</th>
                <th className="px-3 py-3">Καθαρή αξία</th>
                <th className="px-3 py-3">ΦΠΑ</th>
                <th className="px-3 py-3">Σύνολο</th>
                <th className="px-3 py-3">Τύπος myDATA</th>
                <th className="px-3 py-3">ΦΠΑ χαρακτηρισμός</th>
                <th className="px-3 py-3">VIES</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-600">{invoice.invoiceDate?.toLocaleDateString("el-GR")}</td>
                  <td className="px-3 py-3 font-medium text-slate-950"><Link href={`/invoices/${invoice.id}`}>{invoice.supplier?.name ?? "Άγνωστος"}</Link></td>
                  <td className="px-3 py-3 text-slate-600">{invoice.invoiceNumber ?? "-"}</td>
                  <td className="px-3 py-3"><Money value={String(invoice.netAmountCents / 100)} currency={invoice.currency} /></td>
                  <td className="px-3 py-3"><Money value={String(invoice.vatAmountCents / 100)} currency={invoice.currency} /></td>
                  <td className="px-3 py-3"><Money value={String(invoice.grossAmountCents / 100)} currency={invoice.currency} /></td>
                  <td className="max-w-64 px-3 py-3 text-slate-600">{invoice.myDataInvoiceType ?? "-"}</td>
                  <td className="max-w-72 px-3 py-3 text-slate-600">{invoice.vatClassification ?? "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{Number(invoice.viesGoodsAmountCents) > 0 ? "Στήλη 5" : Number(invoice.viesServicesAmountCents) > 0 ? "Στήλη 7" : "-"}</td>
                  <td className="px-3 py-3"><StatusBadge status={invoice.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MonthSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">Μήνας</span>
      <select name="month" defaultValue={defaultValue} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600">
        <option value="">Όλοι οι μήνες</option>
        {monthOptions.map((month) => (
          <option key={month.value} value={month.value}>{month.label}</option>
        ))}
      </select>
    </label>
  );
}

async function getInvoicesSafely(where: Awaited<ReturnType<typeof getInvoiceFilters>>["where"]) {
  try {
    const invoices = await prisma.invoice.findMany({
      where,
      include: { supplier: true },
      orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return { invoices, dbError: null };
  } catch (error) {
    return { invoices: [], dbError: dbErrorMessage(error) };
  }
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600" {...props} />;
}

function Select({ options, labels = {}, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; labels?: Record<string, string> }) {
  return (
    <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600" {...props}>
      {options.map((option) => <option key={option} value={option}>{(labels[option] ?? option) || "Όλα"}</option>)}
    </select>
  );
}
