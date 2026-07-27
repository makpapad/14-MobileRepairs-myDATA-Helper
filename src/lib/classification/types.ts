import { InvoiceKind, InvoiceStatus, InvoiceLineType, SupplierType } from "@prisma/client";

export type ParsedInvoiceData = {
  fileName?: string;
  invoiceNumber?: string | null;
  invoiceDate?: Date | null;
  supplierName?: string | null;
  supplierVat?: string | null;
  buyerVat?: string | null;
  netAmountCents: number;
  vatAmountCents: number;
  grossAmountCents: number;
  vatRate: number;
  currency: string;
  isReverseCharge: boolean;
};

export type ClassificationResult = {
  matchedRuleId: string;
  confidence: number;
  supplierName: string;
  countryCode: string;
  vatNumber: string;
  supplierType: SupplierType;
  invoiceKind: InvoiceKind;
  myDataInvoiceType?: string;
  expenseCategory?: string;
  e3Code?: string;
  vatClassification?: string;
  status: InvoiceStatus;
  isReverseCharge: boolean;
  isEu: boolean;
  isDomestic: boolean;
  isNonEu: boolean;
  viesCountryCode?: string | null;
  viesVatNumber?: string | null;
  viesGoodsAmountCents: number;
  viesServicesAmountCents: number;
  notes?: string;
  lines?: Array<{
    description: string;
    netAmountCents: number;
    vatRate: number;
    vatAmountCents: number;
    grossAmountCents: number;
    lineType: InvoiceLineType;
    expenseCategory?: string;
    e3Code?: string;
    vatClassification?: string;
  }>;
};

export type ClassificationRule = {
  id: string;
  label: string;
  match: (text: string) => boolean;
  classify: (text: string, parsed: ParsedInvoiceData) => ClassificationResult;
};
