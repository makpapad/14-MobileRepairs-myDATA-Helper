import { GoogleGenAI } from "@google/genai";
import type { InvoiceExtraction } from "@/src/lib/validation/invoiceSchema";

/**
 * Gemini 2.5 Flash integration for invoice PDF extraction
 * Returns structured JSON matching InvoiceExtractionSchema
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const EXTRACTION_PROMPT = `
Είσαι εξειδικευμένο μοντέλο OCR για ελληνικά τιμολόγια.
Ανάγνωσε το PDF και εξάγωσε τα παρακάτω πεδία σε JSON.

ΚΑΝΟΝΕΣ:
1. supplierVat: ΜΟΝΟ ο αριθμός (π.χ. "12648797"), ΧΩΡΙΣ πρόθεμα χώρας (HU, IE, DE, GR)
2. supplierCountry: 2-γραμματικός κωδικός ISO (π.χ. "HU", "IE", "DE", "GR")
3. vatRate: Ποσοστό ΦΠΑ (0, 6, 13, 24)
4. isReverseCharge: true αν γράφει "reverse charge" ή "αντίστροφη χρέωση" ή "Tax to be paid on reverse charge basis"
5. mydataInvoiceType: Κωδικός myDATA (π.χ. "14.1", "14.3", "1.1", "11.4")
6. expenseCategory: Περιγραφή κατηγορίας (π.χ. "2.1 Αγορές Εμπορευμάτων")
7. e3Code: Κωδικός Ε3 (π.χ. "E3_102_004", "E3_585_010")
8. vatClassification: Κατανομή Φ2 (π.χ. "364-Φ2", "365-Φ2", "361-Φ2", "366-Φ2")
9. viesEligible: true ΜΟΝΟ για ενδοκοινοτικές B2B (αγαθά/υπηρεσίες με 0% ΦΠΑ)
10. viesColumn: "5_GOODS" για αγαθά, "7_SERVICES" για υπηρεσίες, "NONE" για λοιπά
11. lines: Πίνακας γραμμών τιμολογίου

ΕΠΙΣΤΡΟΦΗ: ΜΟΝΟ valid JSON, καμία επεξήγηση.
`;

export interface GeminiExtractionResult {
  success: boolean;
  data?: InvoiceExtraction;
  error?: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export async function extractInvoiceFromPdf(
  pdfBuffer: Buffer,
  fileName: string
): Promise<GeminiExtractionResult> {
  try {
    // Convert PDF to base64
    const base64Pdf = pdfBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { success: false, error: "Empty response from Gemini" };
    }

    // Parse JSON
    let parsed: InvoiceExtraction;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { success: false, error: `Invalid JSON from Gemini: ${text.substring(0, 200)}` };
    }

    // Validate with Zod schema
    const { validateInvoiceExtraction } = await import("@/src/lib/validation/invoiceSchema");
    const validation = validateInvoiceExtraction(parsed);
    
    if (!validation.success) {
      return { 
        success: false, 
        error: `Validation failed: ${validation.errors.join("; ")}`,
        data: parsed // return raw for debugging
      };
    }

    return {
      success: true,
      data: validation.data,
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0,
      } : undefined,
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Extract from multiple PDFs in parallel
 */
export async function extractInvoicesFromPdfs(
  files: Array<{ buffer: Buffer; fileName: string }>
): Promise<GeminiExtractionResult[]> {
  const results = await Promise.allSettled(
    files.map(f => extractInvoiceFromPdf(f.buffer, f.fileName))
  );

  return results.map((r, i) => 
    r.status === "fulfilled" 
      ? r.value 
      : { success: false, error: r.reason?.message || "Promise rejected", fileName: files[i].fileName }
  );
}