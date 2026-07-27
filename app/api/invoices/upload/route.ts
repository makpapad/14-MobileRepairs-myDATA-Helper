import { NextResponse } from "next/server";
import { processInvoiceWithGemini } from "@/src/lib/invoices/invoiceService";

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);
  if (!files.length) return NextResponse.json({ error: "Δεν βρέθηκαν PDF αρχεία." }, { status: 400 });

  const created = [];
  for (const file of files) {
    created.push(await processInvoiceWithGemini(file));
  }

  return NextResponse.json({ count: created.length, invoices: created.map((invoice) => invoice.id) });
}
