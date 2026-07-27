import { z } from "zod";

/**
 * Zod schema for the JSON output from Gemini API invoice extraction.
 * Matches the specification in Docs/mobilerepairs_export.sql and classification rules.
 */
export const InvoiceExtractionSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierVat: z
    .string()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .refine(
      (v) => v === "" || /^[A-Z]{2}[A-Z0-9]+$/.test(v),
      "VAT number must be in format: CC12345678 (2-letter country code + number)"
    )
    .optional()
    .nullable(),
  supplierCountry: z
    .string()
    .length(2, "Supplier country must be 2-letter ISO code")
    .toUpperCase()
    .optional()
    .nullable(),
  invoiceNumber: z.string().optional().nullable(),
  invoiceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .transform((d) => new Date(d))
    .optional()
    .nullable(),
  netAmount: z.number().nonnegative("Net amount cannot be negative"),
  vatAmount: z.number().nonnegative("VAT amount cannot be negative"),
  grossAmount: z.number().nonnegative("Gross amount cannot be negative"),
  vatRate: z.number().min(0).max(100, "VAT rate must be 0-100"),
  currency: z.string().length(3, "Currency must be 3-letter ISO code").default("EUR"),
  isReverseCharge: z.boolean().default(false),
  mydataInvoiceType: z.string().optional().nullable(),
  expenseCategory: z.string().optional().nullable(),
  e3Code: z.string().optional().nullable(),
  vatClassification: z.string().optional().nullable(),
  viesEligible: z.boolean().default(false),
  viesColumn: z
    .enum(["5_GOODS", "7_SERVICES", "NONE"])
    .default("NONE"),
  lines: z
    .array(
      z.object({
        description: z.string().min(1),
        netAmount: z.number().nonnegative(),
        vatRate: z.number().min(0).max(100),
        vatAmount: z.number().nonnegative(),
        grossAmount: z.number().nonnegative(),
        lineType: z.enum([
          "goods",
          "services",
          "shipping",
          "bank_fee",
          "personal",
          "unknown",
        ]),
        expenseCategory: z.string().optional().nullable(),
        e3Code: z.string().optional().nullable(),
        vatClassification: z.string().optional().nullable(),
        relatedProductId: z.string().optional().nullable(),
        relatedPartId: z.string().optional().nullable(),
        relatedStockMovementId: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

/**
 * Validation rules from the Greek myDATA/VIES specification
 */
export const ValidationRules = {
  /**
   * Validate that VAT=0 + EU B2B Services → mydataInvoiceType=14.3, viesColumn=7_SERVICES
   */
  validateEuServices: (data: InvoiceExtraction): string[] => {
    const errors: string[] = [];
    if (
      data.vatRate === 0 &&
      data.supplierCountry &&
      data.supplierCountry !== "GR" &&
      data.supplierCountry !== "EL" &&
      !data.isReverseCharge
    ) {
      // This is a potential EU B2B service - should be reverse charge
      if (!data.isReverseCharge) {
        errors.push(
          "EU B2B service with 0% VAT must have isReverseCharge=true"
        );
      }
      if (data.mydataInvoiceType !== "14.3") {
        errors.push("EU B2B service should have mydataInvoiceType='14.3'");
      }
      if (data.viesColumn !== "7_SERVICES") {
        errors.push("EU B2B service should have viesColumn='7_SERVICES'");
      }
    }
    return errors;
  },

  /**
   * Validate that VAT=0 + EU B2B Goods → mydataInvoiceType=14.1, viesColumn=5_GOODS
   */
  validateEuGoods: (data: InvoiceExtraction): string[] => {
    const errors: string[] = [];
    if (
      data.vatRate === 0 &&
      data.supplierCountry &&
      data.supplierCountry !== "GR" &&
      data.supplierCountry !== "EL" &&
      !data.isReverseCharge
    ) {
      // Check if lines suggest goods
      const hasGoods = data.lines?.some(
        (l) => l.lineType === "goods" || l.lineType === "shipping"
      );
      if (hasGoods) {
        if (data.mydataInvoiceType !== "14.1") {
          errors.push("EU B2B goods should have mydataInvoiceType='14.1'");
        }
        if (data.viesColumn !== "5_GOODS") {
          errors.push("EU B2B goods should have viesColumn='5_GOODS'");
        }
      }
    }
    return errors;
  },

  /**
   * Validate that invoice with 24% VAT (OSS) → viesEligible=false, viesColumn=NONE
   */
  validateOssVat: (data: InvoiceExtraction): string[] => {
    const errors: string[] = [];
    if (data.vatRate === 24) {
      if (data.viesEligible !== false) {
        errors.push("Invoice with 24% VAT (OSS) must have viesEligible=false");
      }
      if (data.viesColumn !== "NONE") {
        errors.push("Invoice with 24% VAT (OSS) must have viesColumn='NONE'");
      }
    }
    return errors;
  },

  /**
   * Validate that goods are never placed in VIES Column 7
   */
  validateNoGoodsInViesColumn7: (data: InvoiceExtraction): string[] => {
    const errors: string[] = [];
    const hasGoods = data.lines?.some(
      (l) => l.lineType === "goods" || l.lineType === "shipping"
    );
    if (hasGoods && data.viesColumn === "7_SERVICES") {
      errors.push("Goods cannot be placed in VIES Column 7 (Services)");
    }
    return errors;
  },

  /**
   * Validate country prefix is stripped from supplierVat but kept in supplierCountry
   */
  validateVatFormat: (data: InvoiceExtraction): string[] => {
    const errors: string[] = [];
    if (data.supplierVat && data.supplierCountry) {
      const vatPrefix = data.supplierVat.slice(0, 2);
      if (vatPrefix !== data.supplierCountry) {
        errors.push(
          `VAT prefix (${vatPrefix}) must match supplierCountry (${data.supplierCountry})`
        );
      }
    }
    return errors;
  },

  /**
   * Run all validation rules
   */
  validateAll: (data: InvoiceExtraction): string[] => {
    return [
      ...ValidationRules.validateEuServices(data),
      ...ValidationRules.validateEuGoods(data),
      ...ValidationRules.validateOssVat(data),
      ...ValidationRules.validateNoGoodsInViesColumn7(data),
      ...ValidationRules.validateVatFormat(data),
    ];
  },
};

/**
 * Validate and return errors if any
 */
export function validateInvoiceExtraction(
  data: unknown
): { success: true; data: InvoiceExtraction } | { success: false; errors: string[] } {
  const parseResult = InvoiceExtractionSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      success: false,
      errors: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const businessErrors = ValidationRules.validateAll(parseResult.data);
  if (businessErrors.length > 0) {
    return { success: false, errors: businessErrors };
  }
  return { success: true, data: parseResult.data };
}