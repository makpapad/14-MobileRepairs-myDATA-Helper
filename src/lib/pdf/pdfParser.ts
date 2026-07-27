import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { extractFirstAmount } from "@/src/lib/amountParser";
import type { ParsedInvoiceData } from "@/src/lib/classification/types";

export async function saveUploadedPdf(file: File): Promise<{ fileName: string; filePath: string; buffer: Buffer }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, safeName);
  await writeFile(filePath, buffer);
  return { fileName: file.name, filePath, buffer };
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return data.text;
  } finally {
    await parser.destroy();
  }
}

export function parseInvoiceText(text: string, fileName = "uploaded.pdf"): ParsedInvoiceData {
  const invoiceNumber =
    firstMatch(text, /(?:Invoice no\.|Αρ\.?\s*Παραστατικού|Αριθμός)\s*:?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i) ??
    firstMatch(text, /(?:invoice|τιμολόγιο|number|no\.?)\s*(?:number|no\.?|#|:)?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i) ??
    firstMatch(text, /(?:Αρ\.?\s*Παραστατικού|Αριθμός)\s*:?\s*([A-Z0-9/_-]+)/i);
  const dateRaw =
    firstMatch(text, /(?:Invoice date|date|ημερομηνία)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i) ??
    firstMatch(text, /\b(\d{4}-\d{2}-\d{2})\b/);
  const invoiceDate = dateRaw ? parseDate(dateRaw) : null;
  const vatNumber = firstMatch(text, /\b([A-Z]{2}[A-Z0-9]{8,12})\b/)?.replace(/\s/g, "") ?? null;
  const netAmount = extractFirstAmount(text, ["Total (excl", "Total excl", "Subtotal (excl", "Net amount", "Subtotal", "Καθαρή αξία", "Amount before VAT"]);
  const vatAmount = extractFirstAmount(text, ["VAT amount", "ΦΠΑ", "Tax", "Tax Total"]);
  const grossAmount = extractFirstAmount(text, ["Total", "Σύνολο", "Amount due", "Grand total"]) || netAmount + vatAmount;
  const vatRate = /24\s*%/.test(text) ? 24 : /0\s*%/.test(text) ? 0 : vatAmount > 0 && netAmount > 0 ? (vatAmount / netAmount) * 100 : 0;

  return {
    fileName,
    invoiceNumber,
    invoiceDate,
    supplierName: null,
    supplierVat: vatNumber,
    buyerVat: null,
    netAmountCents: Math.round(netAmount * 100),
    vatAmountCents: Math.round(vatAmount * 100),
    grossAmountCents: Math.round(grossAmount * 100),
    vatRate,
    currency: /\bUSD\b/i.test(text) ? "USD" : "EUR",
    isReverseCharge: /reverse charge|tax to be paid on reverse charge basis|αντίστροφη χρέωση/i.test(text),
  };
}

function firstMatch(text: string, regex: RegExp): string | null {
  return text.match(regex)?.[1]?.trim() ?? null;
}

function parseDate(raw: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00Z`);
  const parts = raw.split(/[./-]/).map(Number);
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(Date.UTC(fullYear, month - 1, day));
}
