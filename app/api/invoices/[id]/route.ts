import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { updateInvoiceStatus } from "@/src/lib/invoices/invoiceService";
import { InvoiceStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { supplier: true, lines: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber: body.invoiceNumber,
      myDataInvoiceType: body.myDataInvoiceType,
      expenseCategory: body.expenseCategory,
      e3Code: body.e3Code,
      vatClassification: body.vatClassification,
      notes: body.notes,
      netAmountCents: body.netAmount ? Math.round(body.netAmount * 100) : undefined,
      vatAmountCents: body.vatAmount ? Math.round(body.vatAmount * 100) : undefined,
      grossAmountCents: body.grossAmount ? Math.round(body.grossAmount * 100) : undefined,
      status: body.status,
      supplier: body.supplierId
        ? { connect: { id: body.supplierId } }
        : undefined,
    },
    include: { supplier: true, lines: true },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}