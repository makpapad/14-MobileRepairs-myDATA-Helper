import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import { saveUploadedPdf, extractPdfText, parseInvoiceText } from "@/src/lib/pdf/pdfParser";
import { processUploadedInvoice } from "@/src/lib/invoices/invoiceService";

const prisma = new PrismaClient();

async function testPdf(filePath: string) {
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const file = new File([buffer], fileName, { type: "application/pdf" });

  console.log("=== Testing:", fileName, "===");
  const saved = await saveUploadedPdf(file);
  console.log("Saved to:", saved.filePath);

  const text = await extractPdfText(saved.buffer);
  console.log("--- Extracted text (first 2000 chars) ---");
  console.log(text.substring(0, 2000));
  console.log("--- End text ---");

  const parsed = parseInvoiceText(text, fileName);
  console.log("Parsed:", JSON.stringify(parsed, null, 2));

  const result = await processUploadedInvoice(file);
  console.log("Created invoice:", result.id);
  console.log("Status:", result.status);
  console.log("Supplier:", result.supplier?.name);
  console.log("VIES Goods:", result.viesGoodsAmountCents / 100, "Services:", result.viesServicesAmountCents / 100);
}

await testPdf("E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/Hetzner_2026-06-24_080000987305.pdf")
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });