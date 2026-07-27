import { NextRequest, NextResponse } from "next/server";
import { classifyInvoiceText } from "@/src/lib/classification/classificationEngine";
import { parseInvoiceText } from "@/src/lib/pdf/pdfParser";
import type { ParsedInvoiceData } from "@/src/lib/classification/types";
import { findRegistryEntry } from "@/src/lib/invoices/invoiceService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, parsedData } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Parse text if not already provided
    const parsed: ParsedInvoiceData = parsedData ?? parseInvoiceText(text, "test.pdf");

    // Look up registry entry if VAT number available
    const registryEntry = await findRegistryEntry(parsed);

    // Classify
    const classification = await classifyInvoiceText(text, parsed, registryEntry);

    return NextResponse.json({
      parsed,
      classification,
      registryEntry: registryEntry
        ? {
            id: registryEntry.id,
            name: registryEntry.name,
            vatNumber: registryEntry.vatNumber,
            countryCode: registryEntry.countryCode,
            supplierType: registryEntry.supplierType,
            myDataInvoiceType: registryEntry.myDataInvoiceType,
            expenseCategory: registryEntry.expenseCategory,
            e3Code: registryEntry.e3Code,
            vatClassification: registryEntry.vatClassification,
            viesCountryCode: registryEntry.viesCountryCode,
            viesVatNumber: registryEntry.viesVatNumber,
          }
        : null,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Classification failed" },
      { status: 500 }
    );
  }
}