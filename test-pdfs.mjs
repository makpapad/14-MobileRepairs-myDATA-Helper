import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';

async function testPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();
  console.log('===', filePath, '===');
  console.log(data.text.substring(0, 3000));
  console.log('...\n');
}

const files = [
  'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/Hetzner_2026-06-24_080000987305.pdf',
  'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/inv64BD1423252A1F9C8C2CD9420856D8A889FE12CF.pdf',
  'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/5612684122.pdf',
  'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/5619969614.pdf',
  'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/8075813118188017-61.pdf',
  'E:/Το Drive μου/1-Mobile Repairs/ΛΟΓΙΣΤΙΚΑ/2026/6-ΙΟΥΝΙΟΣ/ΑΓΟΡΕΣ/099759170_021ECΘ1745362026ΠΡΩΤΟΤΥΠΟ.PDF',
];

for (const f of files) {
  try {
    await testPdf(f);
  } catch (e) {
    console.log('Error:', f, e.message);
  }
}