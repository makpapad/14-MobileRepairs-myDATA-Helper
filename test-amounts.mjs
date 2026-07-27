import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';

async function test() {
  const filePath = 'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/Hetzner_2026-06-24_080000987305.pdf';
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();
  
  // Test the extractFirstAmount logic
  function normalizeAmount(raw) {
    if (!raw) return 0;
    const cleaned = raw
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');
    const value = Number.parseFloat(cleaned);
    return Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;
  }
  
  function extractFirstAmount(text, labels) {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`${escaped}[^\d-]*([\d.,]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        console.log('Label:', label, '-> Match:', match[1], '-> Normalized:', normalizeAmount(match[1]));
        return normalizeAmount(match[1]);
      }
    }
    return 0;
  }
  
  console.log('=== Net Amount ===');
  extractFirstAmount(data.text, ['Total (excl', 'Total excl', 'Subtotal (excl', 'Net amount', 'Subtotal', 'Καθαρή αξία', 'Amount before VAT']);
  
  console.log('\n=== VAT Amount ===');
  extractFirstAmount(data.text, ['VAT amount', 'ΦΠΑ', 'Tax', 'Tax Total']);
  
  console.log('\n=== Gross Amount ===');
  extractFirstAmount(data.text, ['Total', 'Σύνολο', 'Amount due', 'Grand total']);
}

test().catch(console.error);