import { notFound, redirect } from "next/navigation";
import { InvoiceStatus } from "@prisma/client";
import { Button, Money, PageHeader, StatusBadge } from "@/components/ui";
import { prisma } from "@/src/lib/db/prisma";
import { updateInvoiceFields, updateInvoiceStatus } from "@/src/lib/invoices/invoiceService";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { supplier: true, lines: true } });
  if (!invoice) notFound();

  async function saveChanges(formData: FormData) {
    "use server";
    await updateInvoiceFields(id, formData);
    redirect(`/invoices/${id}`);
  }

  async function setStatus(formData: FormData) {
    "use server";
    const status = String(formData.get("status")) as InvoiceStatus;
    await updateInvoiceStatus(id, status);
    redirect(`/invoices/${id}`);
  }

  return (
    <div>
      <PageHeader title={`Παραστατικό ${invoice.invoiceNumber ?? invoice.fileName}`} description="Έλεγχος στοιχείων PDF, επεξεργασία χαρακτηρισμού και τελική έγκριση από τον χρήστη." />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <form action={saveChanges} className="rounded-md border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">Στοιχεία παραστατικού</h3>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Προμηθευτής" value={invoice.supplier?.name ?? "Άγνωστος"} readOnly />
            <Field label="VAT" value={`${invoice.supplier?.countryCode ?? ""}${invoice.supplier?.vatNumber ?? ""}`} readOnly />
            <Field label="Αρχείο" value={invoice.fileName} readOnly />
            <Field label="Αριθμός τιμολογίου" name="invoiceNumber" defaultValue={invoice.invoiceNumber ?? ""} />
            <Field label="Καθαρή αξία" name="netAmount" defaultValue={String(invoice.netAmountCents / 100)} />
            <Field label="ΦΠΑ" name="vatAmount" defaultValue={String(invoice.vatAmountCents / 100)} />
            <Field label="Σύνολο" name="grossAmount" defaultValue={String(invoice.grossAmountCents / 100)} />
            <Field label="Τύπος παραστατικού" name="myDataInvoiceType" defaultValue={invoice.myDataInvoiceType ?? ""} wide />
            <Field label="Κατηγορία" name="expenseCategory" defaultValue={invoice.expenseCategory ?? ""} wide />
            <Field label="E3" name="e3Code" defaultValue={invoice.e3Code ?? ""} wide />
            <Field label="ΦΠΑ χαρακτηρισμός" name="vatClassification" defaultValue={invoice.vatClassification ?? ""} wide />
            <label className="md:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">Σημειώσεις</span>
              <textarea name="notes" defaultValue={invoice.notes ?? ""} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600" />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-950">myDATA πρόταση</h3>
            <div className="mt-4 space-y-3 text-sm">
              <Info label="Τύπος" value={invoice.myDataInvoiceType ?? "-"} />
              <Info label="Καθαρή αξία" value={<Money value={String(invoice.netAmountCents / 100)} currency={invoice.currency} />} />
              <Info label="Reverse charge ΦΠΑ 24%" value={invoice.isReverseCharge ? <Money value={String((invoice.netAmountCents / 100) * 0.24)} /> : "-"} />
              <Info label="Δικαίωμα έκπτωσης" value={invoice.status !== "excluded" ? "Προς έλεγχο/έγκριση" : "Όχι"} />
              <Info label="Κατηγορία" value={invoice.expenseCategory ?? "-"} />
              <Info label="E3" value={invoice.e3Code ?? "-"} />
              <Info label="ΦΠΑ χαρακτηρισμός" value={invoice.vatClassification ?? "-"} />
            </div>
          </div>
          <form action={setStatus} className="rounded-md border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-950">Ενέργειες</h3>
            <div className="mt-4 grid gap-2">
              <Button type="submit" name="status" value="approved">Approve</Button>
              <Button type="submit" name="status" value="excluded" variant="danger">Mark as Personal / Excluded</Button>
              <Button type="submit" name="status" value="needs_review" variant="secondary">Needs Review</Button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, wide, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return (
    <label className={wide ? "md:col-span-3" : ""}>
      <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</span>
      <input value={value} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 disabled:bg-slate-50" {...props} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-1 text-slate-900">{value}</div>
    </div>
  );
}