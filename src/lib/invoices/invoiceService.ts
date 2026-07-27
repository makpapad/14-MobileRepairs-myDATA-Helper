import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/src/lib/db/prisma";
import { classifyInvoiceText } from "@/src/lib/classification/classificationEngine";
import type { ParsedInvoiceData, ClassificationResult } from "@/src/lib/classification/types";
import { extractPdfText, parseInvoiceText, saveUploadedPdf } from "@/src/lib/pdf/pdfParser";
import type { SupplierRegistryEntry } from "@/src/lib/classification/patternClassifier";

export async function findRegistryEntry(parsed: ParsedInvoiceData): Promise<SupplierRegistryEntry | null> {
  if (!parsed.supplierVat) return null;
  const vat = parsed.supplierVat.replace(/\s/g, '').toUpperCase();
  return prisma.supplierRegistry.findUnique({
    where: { vatNumber: vat },
  }) as Promise<SupplierRegistryEntry | null>;
}

export async function processUploadedInvoice(file: File) {
  const saved = await saveUploadedPdf(file);
  const text = await extractPdfText(saved.buffer);
  const parsed = parseInvoiceText(text, saved.fileName);
  
  // Look up supplier in registry
  const registryEntry = await findRegistryEntry(parsed);
  
  return createInvoiceFromText(text, parsed, saved.filePath, registryEntry);
}

export async function createInvoiceFromText(
  text: string,
  parsed: ParsedInvoiceData,
  originalFilePath?: string,
  registryEntry: SupplierRegistryEntry | null = null
) {
  const classification = await classifyInvoiceText(text, parsed, registryEntry);
  const invoiceDate = parsed.invoiceDate ?? new Date();
  const supplier = await prisma.supplier.upsert({
    where: {
      countryCode_vatNumber: {
        countryCode: classification.countryCode || "UN",
        vatNumber: classification.vatNumber || "",
      },
    },
    update: {
      name: classification.supplierName,
      supplierType: classification.supplierType,
      defaultInvoiceType: classification.myDataInvoiceType,
      defaultExpenseCategory: classification.expenseCategory,
      defaultE3Code: classification.e3Code,
      defaultVatClassification: classification.vatClassification,
    },
    create: {
      name: classification.supplierName,
      countryCode: classification.countryCode || "UN",
      vatNumber: classification.vatNumber || "",
      supplierType: classification.supplierType,
      defaultInvoiceType: classification.myDataInvoiceType,
      defaultExpenseCategory: classification.expenseCategory,
      defaultE3Code: classification.e3Code,
      defaultVatClassification: classification.vatClassification,
    },
  });

  if (parsed.invoiceNumber) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        supplierId: supplier.id,
        invoiceNumber: parsed.invoiceNumber,
        invoiceDate,
        currency: parsed.currency,
        netAmountCents: parsed.netAmountCents,
        vatAmountCents: parsed.vatAmountCents,
        grossAmountCents: parsed.grossAmountCents,
      },
      include: { supplier: true, lines: true },
    });

    if (existingInvoice) return existingInvoice;
  }

  return prisma.invoice.create({
    data: {
      fileName: parsed.fileName ?? "uploaded.pdf",
      originalFilePath,
      supplierId: supplier.id,
      invoiceNumber: parsed.invoiceNumber,
      invoiceDate,
      periodMonth: invoiceDate.getUTCMonth() + 1,
      periodYear: invoiceDate.getUTCFullYear(),
      currency: parsed.currency,
      netAmountCents: parsed.netAmountCents,
      vatAmountCents: parsed.vatAmountCents,
      grossAmountCents: parsed.grossAmountCents,
      vatRate: parsed.vatRate,
      isReverseCharge: classification.isReverseCharge,
      isEu: classification.isEu,
      isDomestic: classification.isDomestic,
      isNonEu: classification.isNonEu,
      invoiceKind: classification.invoiceKind,
      myDataInvoiceType: classification.myDataInvoiceType,
      expenseCategory: classification.expenseCategory,
      e3Code: classification.e3Code,
      vatClassification: classification.vatClassification,
      viesCountryCode: classification.viesCountryCode,
      viesVatNumber: classification.viesVatNumber,
      viesGoodsAmountCents: classification.viesGoodsAmountCents,
      viesServicesAmountCents: classification.viesServicesAmountCents,
      status: classification.status,
      notes: classification.notes,
      lines: classification.lines?.length
        ? {
            create: classification.lines.map((line) => ({
              description: line.description,
              netAmountCents: line.netAmountCents,
              vatRate: line.vatRate,
              vatAmountCents: line.vatAmountCents,
              grossAmountCents: line.grossAmountCents,
              lineType: line.lineType,
              expenseCategory: line.expenseCategory,
              e3Code: line.e3Code,
              vatClassification: line.vatClassification,
            })),
          }
        : undefined,
    },
    include: { supplier: true, lines: true },
  });
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  return prisma.invoice.update({ where: { id }, data: { status }, include: { supplier: true, lines: true } });
}

export async function updateInvoiceFields(id: string, formData: FormData) {
  return prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber: String(formData.get("invoiceNumber") || ""),
      myDataInvoiceType: String(formData.get("myDataInvoiceType") || ""),
      expenseCategory: String(formData.get("expenseCategory") || ""),
      e3Code: String(formData.get("e3Code") || ""),
      vatClassification: String(formData.get("vatClassification") || ""),
      notes: String(formData.get("notes") || ""),
      netAmountCents: Math.round((Number(formData.get("netAmount") || 0)) * 100),
      vatAmountCents: Math.round((Number(formData.get("vatAmount") || 0)) * 100),
      grossAmountCents: Math.round((Number(formData.get("grossAmount") || 0)) * 100),
    },
    include: { supplier: true, lines: true },
  });
}

/**
 * Learn from a corrected classification - save/update supplier registry
 */
/**
 * Process invoice using Gemini AI extraction + classification
 * This replaces the local PDF parsing with AI-powered extraction
 */
export async function processInvoiceWithGemini(file: File) {
  const saved = await saveUploadedPdf(file);
  
  // Extract using Gemini
  const { extractInvoiceFromPdf } = await import("@/src/lib/gemini/geminiExtractor");
  const geminiResult = await extractInvoiceFromPdf(saved.buffer, saved.fileName);
  
  if (!geminiResult.success || !geminiResult.data) {
    // Fallback to local parsing
    console.warn("Gemini extraction failed, falling back to local parser:", geminiResult.error);
    const text = await extractPdfText(saved.buffer);
    const parsed = parseInvoiceText(text, saved.fileName);
    const registryEntry = await findRegistryEntry(parsed);
    return createInvoiceFromText(text, parsed, saved.filePath, registryEntry);
  }
  
  // Use Gemini data directly
  const parsed: ParsedInvoiceData = {
    fileName: saved.fileName,
    invoiceNumber: geminiResult.data.invoiceNumber ?? null,
    invoiceDate: geminiResult.data.invoiceDate ?? null,
    supplierName: geminiResult.data.supplierName ?? null,
    supplierVat: geminiResult.data.supplierVat ?? null,
    buyerVat: null,
    netAmountCents: Math.round(geminiResult.data.netAmount * 100),
    vatAmountCents: Math.round(geminiResult.data.vatAmount * 100),
    grossAmountCents: Math.round(geminiResult.data.grossAmount * 100),
    vatRate: geminiResult.data.vatRate,
    currency: geminiResult.data.currency,
    isReverseCharge: geminiResult.data.isReverseCharge,
  };
  
  // Look up supplier in registry
  const registryEntry = await findRegistryEntry(parsed);
  
  // Create a text representation for classification engine
  const textForClassification = `
    Supplier: ${parsed.supplierName}
    VAT: ${parsed.supplierVat}
    Country: ${geminiResult.data.supplierCountry}
    Invoice: ${parsed.invoiceNumber}
    Date: ${parsed.invoiceDate?.toISOString()}
    Net: ${parsed.netAmountCents / 100}
    VAT: ${parsed.vatAmountCents / 100}
    Gross: ${parsed.grossAmountCents / 100}
    VAT Rate: ${parsed.vatRate}%
    Reverse Charge: ${parsed.isReverseCharge}
    MyData Type: ${geminiResult.data.mydataInvoiceType}
    Expense Category: ${geminiResult.data.expenseCategory}
    E3 Code: ${geminiResult.data.e3Code}
    VAT Classification: ${geminiResult.data.vatClassification}
    VIES Eligible: ${geminiResult.data.viesEligible}
    VIES Column: ${geminiResult.data.viesColumn}
  `;
  
  return createInvoiceFromText(textForClassification, parsed, saved.filePath, registryEntry);
}


export async function learnFromClassification(
  parsed: ParsedInvoiceData,
  classification: ClassificationResult,
  invoiceId: string
) {
  if (!parsed.supplierVat) return null;
  
  const vat = parsed.supplierVat.replace(/\s/g, '').toUpperCase();
  
  return prisma.supplierRegistry.upsert({
    where: { vatNumber: vat },
    update: {
      name: classification.supplierName,
      countryCode: classification.countryCode || 'UN',
      supplierType: classification.supplierType,
      invoiceKind: classification.invoiceKind,
      myDataInvoiceType: classification.myDataInvoiceType,
      expenseCategory: classification.expenseCategory,
      e3Code: classification.e3Code,
      vatClassification: classification.vatClassification,
      viesCountryCode: classification.viesCountryCode,
      viesVatNumber: classification.viesVatNumber,
      isActive: true,
      learnedFromInvoiceId: invoiceId,
      confidence: classification.confidence,
    },
    create: {
      name: classification.supplierName,
      vatNumber: vat,
      countryCode: classification.countryCode || 'UN',
      supplierType: classification.supplierType,
      invoiceKind: classification.invoiceKind,
      myDataInvoiceType: classification.myDataInvoiceType,
      expenseCategory: classification.expenseCategory,
      e3Code: classification.e3Code,
      vatClassification: classification.vatClassification,
      viesCountryCode: classification.viesCountryCode,
      viesVatNumber: classification.viesVatNumber,
      isActive: true,
      learnedFromInvoiceId: invoiceId,
      confidence: classification.confidence,
    },
  });
}
