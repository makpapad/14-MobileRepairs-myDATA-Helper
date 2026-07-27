import { InvoiceKind, InvoiceLineType, InvoiceStatus, SupplierType } from "@prisma/client";
import { roundMoney } from "@/src/lib/amountParser";
import type { ClassificationResult, ParsedInvoiceData } from "./types";

// EU country codes
const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"
]);

// Greek domestic VAT rates
const GR_VAT_RATES = new Set([6, 13, 24]);

function isEuCountry(countryCode: string): boolean {
  return EU_COUNTRIES.has(countryCode.toUpperCase());
}

function isGreekVat(vatNumber: string): boolean {
  const clean = vatNumber.replace(/\s/g, '').toUpperCase();
  return clean.startsWith('EL') || clean.startsWith('GR');
}

function extractCountryFromVat(vatNumber: string): string {
  const clean = vatNumber.replace(/\s/g, '').toUpperCase();
  if (clean.length >= 2) return clean.slice(0, 2);
  return '';
}

function hasGoodsKeywords(parsed: ParsedInvoiceData): boolean {
  const goodsKeywords = [
    'laptop', 'computer', 'server', 'monitor', 'hardware', 'equipment',
    'lenovo', 'dell', 'hp', 'fujitsu', 'thinkpad', 'latitude', 'lifebook', 'probook',
    'mouse', 'keyboard', 'printer', 'scanner', 'router', 'switch', 'cable',
    'υπολογιστής', 'εξοπλισμός', 'μηχάνημα', 'οθόνη', 'πληκτρολόγιο', 'ποντίκι',
    'τρόφιμα', 'ποτά', 'εμφιαλώσεις', 'ρούχα', 'παπούτσια',
    'goods', 'merchandise', 'products', 'αγαθά', 'εμπορεύματα'
  ];
  const text = `${parsed.fileName || ''} ${JSON.stringify(parsed)}`.toLowerCase();
  return goodsKeywords.some(kw => text.includes(kw.toLowerCase()));
}

/**
 * Generic pattern-based classification.
 * Returns a base classification that can be enriched from SupplierRegistry.
 */
export function classifyByPattern(parsed: ParsedInvoiceData): ClassificationResult {
  const vat = parsed.supplierVat?.replace(/\s/g, '').toUpperCase() ?? '';
  const countryCode = vat.slice(0, 2) || '';
  const isEU = isEuCountry(countryCode);
  const isGR = countryCode === 'GR' || countryCode === 'EL';
  const hasReverseCharge = parsed.isReverseCharge;
  const vatRate = parsed.vatRate ?? 0;

  const netAmount = parsed.netAmountCents || parsed.grossAmountCents || 0;
  const vatAmount = parsed.vatAmountCents || 0;
  const grossAmount = parsed.grossAmountCents || netAmount + vatAmount;

  // EU Services: reverse charge, 0% VAT, EU supplier (not GR)
  if (isEU && !isGR && hasReverseCharge && vatRate === 0) {
    return {
      matchedRuleId: "pattern-eu-service",
      confidence: 0.9,
      supplierName: parsed.supplierName || "Άγνωστος προμηθευτής",
      countryCode,
      vatNumber: vat.slice(2),
      supplierType: SupplierType.eu_services,
      invoiceKind: InvoiceKind.services,
      myDataInvoiceType: "14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών",
      expenseCategory: "2.3 Λήψη Υπηρεσιών",
      e3Code: "E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής",
      vatClassification: "365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α",
      status: InvoiceStatus.parsed,
      isReverseCharge: true,
      isEu: true,
      isDomestic: false,
      isNonEu: false,
      viesCountryCode: countryCode,
      viesVatNumber: vat.slice(2),
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: roundMoney(netAmount / 100) * 100,
      lines: [{
        description: parsed.supplierName || "EU Services",
        netAmountCents: netAmount,
        vatRate: 0,
        vatAmountCents: 0,
        grossAmountCents: grossAmount,
        lineType: InvoiceLineType.services,
        expenseCategory: "2.3 Λήψη Υπηρεσιών",
        e3Code: "E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής",
        vatClassification: "365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α",
      }],
    };
  }

  // EU Goods: reverse charge, 0% VAT, EU supplier, goods keywords
  if (isEU && !isGR && hasReverseCharge && vatRate === 0 && hasGoodsKeywords(parsed)) {
    return {
      matchedRuleId: "pattern-eu-goods",
      confidence: 0.85,
      supplierName: parsed.supplierName || "Άγνωστος προμηθευτής",
      countryCode,
      vatNumber: vat.slice(2),
      supplierType: SupplierType.eu_goods,
      invoiceKind: InvoiceKind.goods,
      myDataInvoiceType: "14.1 Τιμολόγιο / Ενδοκοινοτικές Αποκτήσεις",
      expenseCategory: "2.1 Αγορές Εμπορευμάτων",
      e3Code: "E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές",
      vatClassification: "364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών",
      status: InvoiceStatus.parsed,
      isReverseCharge: false, // EU goods is not reverse charge in same way
      isEu: true,
      isDomestic: false,
      isNonEu: false,
      viesCountryCode: countryCode,
      viesVatNumber: vat.slice(2),
      viesGoodsAmountCents: roundMoney(netAmount / 100) * 100,
      viesServicesAmountCents: 0,
      lines: [{
        description: parsed.supplierName || "EU Goods",
        netAmountCents: netAmount,
        vatRate: 0,
        vatAmountCents: 0,
        grossAmountCents: grossAmount,
        lineType: InvoiceLineType.goods,
        expenseCategory: "2.1 Αγορές Εμπορευμάτων",
        e3Code: "E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές",
        vatClassification: "364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών",
      }],
    };
  }

  // Domestic (Greek VAT): GR VAT number, VAT rate 6/13/24%
  if ((isGR || GR_VAT_RATES.has(vatRate)) && vatRate > 0) {
    return {
      matchedRuleId: "pattern-domestic",
      confidence: 0.85,
      supplierName: parsed.supplierName || "Άγνωστος προμηθευτής",
      countryCode: "GR",
      vatNumber: vat.replace(/^(GR|EL)/, ''),
      supplierType: SupplierType.domestic_services,
      invoiceKind: InvoiceKind.services,
      myDataInvoiceType: "1.1 Τιμολόγιο Πώλησης Αγαθών/Υπηρεσιών",
      expenseCategory: "2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ",
      e3Code: "E3_585_016 - Λοιπά έξοδα",
      vatClassification: "361-Φ2 - Αγορές & δαπάνες στο εσωτερικό της χώρας",
      status: InvoiceStatus.parsed,
      isReverseCharge: false,
      isEu: false,
      isDomestic: true,
      isNonEu: false,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      lines: [{
        description: parsed.supplierName || "Domestic Services",
        netAmountCents: netAmount,
        vatRate,
        vatAmountCents: vatAmount,
        grossAmountCents: grossAmount,
        lineType: InvoiceLineType.services,
        expenseCategory: "2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ",
        e3Code: "E3_585_016 - Λοιπά έξοδα",
        vatClassification: "361-Φ2 - Αγορές & δαπάνες στο εσωτερικό της χώρας",
      }],
    };
  }

  // Non-EU: has VAT number but not EU, or no VAT but clearly foreign
  if (vat && !isEU) {
    return {
      matchedRuleId: "pattern-non-eu",
      confidence: 0.7,
      supplierName: parsed.supplierName || "Άγνωστος προμηθευτής",
      countryCode,
      vatNumber: vat.slice(2),
      supplierType: SupplierType.non_eu_services,
      invoiceKind: InvoiceKind.services,
      myDataInvoiceType: "14.4 Τιμολόγιο / Εισαγωγές Υπηρεσιών από τρίτες χώρες",
      expenseCategory: "2.3 Λήψη Υπηρεσιών",
      e3Code: "E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής",
      vatClassification: "366-Φ2 - Λοιπές πράξεις λήπτη",
      status: InvoiceStatus.needs_review,
      isReverseCharge: false,
      isEu: false,
      isDomestic: false,
      isNonEu: true,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      notes: "Μη ΕΕ προμηθευτής - απαιτείται επιβεβαίωση",
      lines: [{
        description: parsed.supplierName || "Non-EU Services",
        netAmountCents: netAmount,
        vatRate: 0,
        vatAmountCents: 0,
        grossAmountCents: grossAmount,
        lineType: InvoiceLineType.services,
        expenseCategory: "2.3 Λήψη Υπηρεσιών",
        e3Code: "E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής",
        vatClassification: "366-Φ2 - Λοιπές πράξεις λήπτη",
      }],
    };
  }

  // Fallback - unknown
  return unknownClassification(parsed);
}

export function unknownClassification(parsed: ParsedInvoiceData): ClassificationResult {
  const vat = parsed.supplierVat?.replace(/\s/g, '').toUpperCase() ?? '';
  const countryCode = vat.slice(0, 2) ?? '';
  const vatNumber = vat.slice(2) ?? '';
  return {
    matchedRuleId: "unknown",
    confidence: 0,
    supplierName: parsed.supplierName || "Άγνωστος προμηθευτής",
    countryCode,
    vatNumber,
    supplierType: SupplierType.unknown,
    invoiceKind: InvoiceKind.unknown,
    status: InvoiceStatus.needs_review,
    isReverseCharge: parsed.isReverseCharge,
    isEu: false,
    isDomestic: false,
    isNonEu: false,
    viesCountryCode: null,
    viesVatNumber: null,
    viesGoodsAmountCents: 0,
    viesServicesAmountCents: 0,
    notes: "Δεν βρέθηκε ασφαλής κανόνας ταξινόμησης. Απαιτείται έλεγχος.",
  };
}

/**
 * Supplier Registry entry type (matches Prisma model)
 */
export type SupplierRegistryEntry = {
  id: string;
  name: string;
  vatNumber: string | null;
  countryCode: string;
  supplierType: SupplierType;
  invoiceKind: InvoiceKind;
  myDataInvoiceType: string | null;
  expenseCategory: string | null;
  e3Code: string | null;
  vatClassification: string | null;
  viesCountryCode: string | null;
  viesVatNumber: string | null;
  isActive: boolean;
  learnedFromInvoiceId: string | null;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Enrich pattern classification with SupplierRegistry data
 */
export function enrichFromRegistry(
  patternResult: ClassificationResult,
  registryEntry: SupplierRegistryEntry | null
): ClassificationResult {
  if (!registryEntry || !registryEntry.isActive) {
    return patternResult;
  }

  // TypeScript now knows registryEntry is non-null and isActive is true
  const entry = registryEntry;

  // Use registry data for fields that are more reliable
  return {
    ...patternResult,
    matchedRuleId: patternResult.matchedRuleId + "+registry",
    confidence: Math.max(patternResult.confidence, entry.confidence),
    supplierName: entry.name,
    supplierType: entry.supplierType,
    invoiceKind: entry.invoiceKind,
    myDataInvoiceType: entry.myDataInvoiceType ?? patternResult.myDataInvoiceType,
    expenseCategory: entry.expenseCategory ?? patternResult.expenseCategory,
    e3Code: entry.e3Code ?? patternResult.e3Code,
    vatClassification: entry.vatClassification ?? patternResult.vatClassification,
    viesCountryCode: entry.viesCountryCode ?? patternResult.viesCountryCode,
    viesVatNumber: entry.viesVatNumber ?? patternResult.viesVatNumber,
    lines: patternResult.lines?.map(line => ({
      ...line,
      expenseCategory: entry.expenseCategory ?? line.expenseCategory,
      e3Code: entry.e3Code ?? line.e3Code,
      vatClassification: entry.vatClassification ?? line.vatClassification,
    })),
  };
}