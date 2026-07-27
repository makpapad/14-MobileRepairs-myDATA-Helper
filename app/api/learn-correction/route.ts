import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { learnFromClassification } from "@/src/lib/invoices/invoiceService";
import type { ClassificationResult } from "@/src/lib/classification/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, corrections } = body;

    if (!invoiceId || !corrections) {
      return NextResponse.json({ error: "invoiceId and corrections are required" }, { status: 400 });
    }

    // Fetch the invoice with supplier and lines
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { supplier: true, lines: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Build parsed data from invoice
    const parsedData = {
      fileName: invoice.fileName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      supplierName: invoice.supplier?.name,
      supplierVat: invoice.supplier?.vatNumber ? `${invoice.supplier.countryCode}${invoice.supplier.vatNumber}` : null,
      buyerVat: null,
      netAmountCents: invoice.netAmountCents,
      vatAmountCents: invoice.vatAmountCents,
      grossAmountCents: invoice.grossAmountCents,
      vatRate: Number(invoice.vatRate),
      currency: invoice.currency,
      isReverseCharge: invoice.isReverseCharge,
    };

    // Build classification result from corrections
    const classification: ClassificationResult = {
      matchedRuleId: "user-correction",
      confidence: 1.0,
      supplierName: corrections.supplierName || invoice.supplier?.name || "Άγνωστος",
      countryCode: corrections.countryCode || invoice.supplier?.countryCode || "UN",
      vatNumber: corrections.vatNumber || invoice.supplier?.vatNumber || "",
      supplierType: corrections.supplierType,
      invoiceKind: corrections.invoiceKind,
      myDataInvoiceType: corrections.myDataInvoiceType,
      expenseCategory: corrections.expenseCategory,
      e3Code: corrections.e3Code,
      vatClassification: corrections.vatClassification,
      status: corrections.status,
      isReverseCharge: corrections.isReverseCharge ?? invoice.isReverseCharge,
      isEu: corrections.isEu ?? invoice.isEu,
      isDomestic: corrections.isDomestic ?? invoice.isDomestic,
      isNonEu: corrections.isNonEu ?? invoice.isNonEu,
      viesCountryCode: corrections.viesCountryCode,
      viesVatNumber: corrections.viesVatNumber,
      viesGoodsAmountCents: Math.round((corrections.viesGoodsAmount ?? Number(invoice.viesGoodsAmountCents || 0) / 100) * 100),
      viesServicesAmountCents: Math.round((corrections.viesServicesAmount ?? Number(invoice.viesServicesAmountCents || 0) / 100) * 100),
      notes: corrections.notes,
      lines: corrections.lines?.map((l: any) => ({
        description: l.description,
        netAmountCents: Math.round(l.netAmount * 100),
        vatRate: l.vatRate,
        vatAmountCents: Math.round(l.vatAmount * 100),
        grossAmountCents: Math.round(l.grossAmount * 100),
        lineType: l.lineType,
        expenseCategory: l.expenseCategory,
        e3Code: l.e3Code,
        vatClassification: l.vatClassification,
      })) ?? [],
    };

    // Learn from classification
    await learnFromClassification(parsedData, classification, invoiceId);

    return NextResponse.json({ success: true, message: "Classification learned and saved to registry" });
  } catch (error) {
    console.error("Learn from correction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to learn from correction" },
      { status: 500 }
    );
  }
}