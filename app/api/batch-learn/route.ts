import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { learnFromClassification } from "@/src/lib/invoices/invoiceService";
import type { ClassificationResult } from "@/src/lib/classification/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { corrections } = body;

    if (!corrections || !Array.isArray(corrections) || corrections.length === 0) {
      return NextResponse.json({ error: "corrections array is required" }, { status: 400 });
    }

    const results = [];
    
    for (const correction of corrections) {
      const { invoiceId, ...correctionData } = correction;
      
      if (!invoiceId) {
        results.push({ invoiceId: null, success: false, error: "invoiceId is required" });
        continue;
      }

      try {
        // Fetch the invoice
        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { supplier: true, lines: true },
        });

        if (!invoice) {
          results.push({ invoiceId, success: false, error: "Invoice not found" });
          continue;
        }

        // Build parsed data
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

        // Build classification from corrections
        const classification: ClassificationResult = {
          matchedRuleId: "batch-user-correction",
          confidence: 1.0,
          supplierName: correctionData.supplierName || invoice.supplier?.name || "Άγνωστος",
          countryCode: correctionData.countryCode || invoice.supplier?.countryCode || "UN",
          vatNumber: correctionData.vatNumber || invoice.supplier?.vatNumber || "",
          supplierType: correctionData.supplierType,
          invoiceKind: correctionData.invoiceKind,
          myDataInvoiceType: correctionData.myDataInvoiceType,
          expenseCategory: correctionData.expenseCategory,
          e3Code: correctionData.e3Code,
          vatClassification: correctionData.vatClassification,
          status: correctionData.status,
          isReverseCharge: correctionData.isReverseCharge ?? invoice.isReverseCharge,
          isEu: correctionData.isEu ?? invoice.isEu,
          isDomestic: correctionData.isDomestic ?? invoice.isDomestic,
          isNonEu: correctionData.isNonEu ?? invoice.isNonEu,
          viesCountryCode: correctionData.viesCountryCode,
          viesVatNumber: correctionData.viesVatNumber,
          viesGoodsAmountCents: Math.round((correctionData.viesGoodsAmount ?? Number(invoice.viesGoodsAmountCents || 0) / 100) * 100),
          viesServicesAmountCents: Math.round((correctionData.viesServicesAmount ?? Number(invoice.viesServicesAmountCents || 0) / 100) * 100),
          notes: correctionData.notes,
          lines: correctionData.lines?.map((l: any) => ({
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

        await learnFromClassification(parsedData, classification, invoiceId);
        results.push({ invoiceId, success: true });
      } catch (error) {
        results.push({ 
          invoiceId, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({ 
      total: corrections.length,
      succeeded: successCount,
      failed: corrections.length - successCount,
      results 
    });
  } catch (error) {
    console.error("Batch learn error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch learn failed" },
      { status: 500 }
    );
  }
}