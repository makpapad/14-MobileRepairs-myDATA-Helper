import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';

async function test() {
  const filePath = 'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/Hetzner_2026-06-24_080000987305.pdf';
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();
  
  // Debug: print the relevant section
  const idx = data.text.indexOf('Total (excl');
  if (idx >= 0) {
    console.log('=== Context around "Total (excl" ===');
    console.log(data.text.substring(idx, idx + 200));
    console.log('=== End ===');
  }
  
  // Test the extractFirstAmount logic with simpler regex
  function normalizeAmount(raw) {
    if (!raw) return 0;
    const cleaned = raw
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');
    const value = Number.parseFloat(cleaned);
    return Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;
  }
  
  // Test with different regex approaches
  const text = data.text;
  
  // Approach 1: original
  console.log('\n--- Approach 1: Original regex ---');
  const regex1 = /Total \(excl[^\d-]*([\d.,]+)/i;
  const match1 = text.match(regex1);
  console.log('Match:', match1);
  
  // Approach 2: look for € sign
  console.log('\n--- Approach 2: With € sign ---');
  const regex2 = /Total \(excl[^\d]*€\s*([\d.,]+)/i;
  const match2 = text.match(regex2);
  console.log('Match:', match2);
  
  // Approach 3: just find first number after label
  console.log('\n--- Approach 3: Flexible ---');
  const regex3 = /Total \(excl.*?([\d]+[.,]\d{2})/i;
  const match3 = text.match(regex3);
  console.log('Match:', match3);
  
  // Test VAT amount
  console.log('\n--- VAT Amount ---');
  const vatRegex = /VAT amount[^\d]*([\d]+[.,]\d{2})/i;
  const vatMatch = text.match(vatRegex);
  console.log('Match:', vatMatch);
  
  // Test with "Tax Total" 
  console.log('\n--- Tax Total ---');
  const taxRegex = /Tax Total[^\d]*([\d]+[.,]\d{2})/i;
  const taxMatch = text.match(taxRegex);
  console.log('Match:', taxMatch);
  
  // Test gross amount
  console.log('\n--- Gross Amount (Total) ---');
  const grossRegex = /^Total[^\d]*([\d]+[.,]\d{2})/im;
  const grossMatch = text.match(grossRegex);
  console.log('Match:', grossMatch);
  
  // All "Total" occurrences
  console.log('\n--- All "Total" lines ---');
  const lines = text.split('\n').filter(l => l.toLowerCase().includes('total'));
  lines.forEach(l => console.log(l.trim()));
}

test().catch(console.error);