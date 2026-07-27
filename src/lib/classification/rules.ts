import { InvoiceKind, InvoiceLineType, InvoiceStatus, SupplierType } from "@prisma/client";
import { roundMoney } from "@/src/lib/amountParser";
import type { ClassificationResult, ClassificationRule, ParsedInvoiceData } from "./types";

const EU_SERVICE_TYPE = "14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών";
const EU_SERVICE_EXPENSE = "2.3 Λήψη Υπηρεσιών";
const EU_SERVICE_E3 = "E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής";
const EU_SERVICE_VAT = "365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α";
const EU_GOODS_TYPE = "14.1 Τιμολόγιο / Ενδοκοινοτικές Αποκτήσεις";
const EU_GOODS_EXPENSE = "2.1 Αγορές Εμπορευμάτων";
const EU_GOODS_E3 = "E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές";
const EU_GOODS_VAT = "364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών";
const DOMESTIC_EXPENSE = "2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ";
const DOMESTIC_VAT = "361-Φ2 - Αγορές & δαπάνες στο εσωτερικό της χώρας";

function hasAll(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.every((term) => normalized.includes(term.toLowerCase()));
}

function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

function euService(
  id: string,
  supplierName: string,
  countryCode: string,
  vatNumber: string,
  parsed: ParsedInvoiceData,
): ClassificationResult {
  const amountCents = parsed.netAmountCents || parsed.grossAmountCents;
  return {
    matchedRuleId: id,
    confidence: 0.95,
    supplierName,
    countryCode,
    vatNumber,
    supplierType: SupplierType.eu_services,
    invoiceKind: InvoiceKind.services,
    myDataInvoiceType: EU_SERVICE_TYPE,
    expenseCategory: EU_SERVICE_EXPENSE,
    e3Code: EU_SERVICE_E3,
    vatClassification: EU_SERVICE_VAT,
    status: InvoiceStatus.parsed,
    isReverseCharge: true,
    isEu: true,
    isDomestic: false,
    isNonEu: false,
    viesCountryCode: countryCode,
    viesVatNumber: vatNumber,
    viesGoodsAmountCents: 0,
    viesServicesAmountCents: amountCents,
    lines: [
      {
        description: supplierName,
        netAmountCents: amountCents,
        vatRate: parsed.vatRate,
        vatAmountCents: parsed.vatAmountCents,
        grossAmountCents: parsed.grossAmountCents || amountCents,
        lineType: InvoiceLineType.services,
        expenseCategory: EU_SERVICE_EXPENSE,
        e3Code: EU_SERVICE_E3,
        vatClassification: EU_SERVICE_VAT,
      },
    ],
  };
}

export const classificationRules: ClassificationRule[] = [
  {
    id: "google-ads-eu-services",
    label: "Google Ads EU services",
    match: (text) => hasAll(text, ["Google Ads", "Google Ireland Limited"]) && /IE\s?6388047V/i.test(text) && /reverse charge/i.test(text),
    classify: (_text, parsed) => euService("google-ads-eu-services", "Google Ireland Limited", "IE", "6388047V", parsed),
  },
  {
    id: "google-workspace-eu-services",
    label: "Google Workspace EU services",
    match: (text) => hasAll(text, ["Google Workspace", "Google Cloud EMEA Limited"]) && /IE\s?3668997OH/i.test(text) && /reverse charge/i.test(text),
    classify: (_text, parsed) => euService("google-workspace-eu-services", "Google Cloud EMEA Limited", "IE", "3668997OH", parsed),
  },
  {
    id: "openai-eu-services",
    label: "OpenAI EU services",
    match: (text) => hasAll(text, ["OpenAI Ireland Limited", "Tax to be paid on reverse charge basis"]) && /IE\s?4143435AH/i.test(text),
    classify: (_text, parsed) => euService("openai-eu-services", "OpenAI Ireland Limited", "IE", "4143435AH", parsed),
  },
  {
    id: "hetzner-eu-services",
    label: "Hetzner EU services",
    match: (text) => hasAll(text, ["Hetzner Online GmbH", "Dedicated Server"]) && /DE\s?812871812/i.test(text) && /reverse charge/i.test(text),
    classify: (_text, parsed) => euService("hetzner-eu-services", "Hetzner Online GmbH", "DE", "812871812", parsed),
  },
  {
    id: "marseus-eu-goods",
    label: "Marseus EU goods",
    match: (text) =>
      hasAll(text, ["Marseus Computer Kft."]) &&
      /HU\s?12648797/i.test(text) &&
      /(Lenovo|Dell|Fujitsu|HP|ThinkPad|Latitude|LifeBook|ProBook)/i.test(text) &&
      /(VAT\s*0\s*%|0\s*%\s*VAT|ενδοκοινοτική απαλλαγή|intra-community)/i.test(text),
    classify: (_text, parsed) => {
      const amountCents = parsed.netAmountCents || parsed.grossAmountCents;
      return {
        matchedRuleId: "marseus-eu-goods",
        confidence: 0.94,
        supplierName: "Marseus Computer Kft.",
        countryCode: "HU",
        vatNumber: "12648797",
        supplierType: SupplierType.eu_goods,
        invoiceKind: InvoiceKind.goods,
        myDataInvoiceType: EU_GOODS_TYPE,
        expenseCategory: EU_GOODS_EXPENSE,
        e3Code: EU_GOODS_E3,
        vatClassification: EU_GOODS_VAT,
        status: InvoiceStatus.parsed,
        isReverseCharge: false,
        isEu: true,
        isDomestic: false,
        isNonEu: false,
        viesCountryCode: "HU",
        viesVatNumber: "12648797",
        viesGoodsAmountCents: amountCents,
        viesServicesAmountCents: 0,
        notes: "Το Transport Cost, αν υπάρχει, περιλαμβάνεται στα αγαθά για την πρώτη φάση.",
        lines: [
          {
            description: "Marseus goods and transport",
            netAmountCents: amountCents,
            vatRate: 0,
            vatAmountCents: 0,
            grossAmountCents: amountCents,
            lineType: InvoiceLineType.goods,
            expenseCategory: EU_GOODS_EXPENSE,
            e3Code: EU_GOODS_E3,
            vatClassification: EU_GOODS_VAT,
          },
        ],
      };
    },
  },
  {
    id: "google-one-domestic-vat",
    label: "Google One with 24% VAT",
    match: (text) => /Google One/i.test(text) && /24\s*%/.test(text) && /(VAT|ΦΠΑ)/i.test(text),
    classify: (_text, parsed) => ({
      matchedRuleId: "google-one-domestic-vat",
      confidence: 0.78,
      supplierName: "Google Commerce Limited",
      countryCode: "IE",
      vatNumber: "9825613N",
      supplierType: SupplierType.unknown,
      invoiceKind: InvoiceKind.services,
      expenseCategory: DOMESTIC_EXPENSE,
      e3Code: "E3_585_010 ή E3_585_016",
      vatClassification: "366-Φ2 - Λοιπές πράξεις λήπτη",
      status: InvoiceStatus.needs_review,
      isReverseCharge: false,
      isEu: false,
      isDomestic: false,
      isNonEu: false,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      lines: [
        {
          description: "Google One",
          netAmountCents: parsed.netAmountCents,
          vatRate: 24,
          vatAmountCents: parsed.vatAmountCents,
          grossAmountCents: parsed.grossAmountCents,
          lineType: InvoiceLineType.services,
          expenseCategory: DOMESTIC_EXPENSE,
          e3Code: "E3_585_010 ή E3_585_016",
          vatClassification: "366-Φ2 - Λοιπές πράξεις λήπτη",
        },
      ],
    }),
  },
  {
    id: "box-now-domestic-services",
    label: "BOX NOW domestic courier",
    match: (text) => /BOX NOW/i.test(text) && /(Ελλάδα|Greece)/i.test(text) && /24\s*%/.test(text),
    classify: (_text, parsed) => ({
      matchedRuleId: "box-now-domestic-services",
      confidence: 0.86,
      supplierName: "BOX NOW AE",
      countryCode: "GR",
      vatNumber: "",
      supplierType: SupplierType.domestic_services,
      invoiceKind: InvoiceKind.services,
      expenseCategory: DOMESTIC_EXPENSE,
      e3Code: "E3_585_016 - Λοιπά έξοδα",
      vatClassification: DOMESTIC_VAT,
      status: InvoiceStatus.parsed,
      isReverseCharge: false,
      isEu: false,
      isDomestic: true,
      isNonEu: false,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      lines: [
        {
          description: "BOX NOW courier",
          netAmountCents: parsed.netAmountCents,
          vatRate: 24,
          vatAmountCents: parsed.vatAmountCents,
          grossAmountCents: parsed.grossAmountCents,
          lineType: InvoiceLineType.services,
          expenseCategory: DOMESTIC_EXPENSE,
          e3Code: "E3_585_016 - Λοιπά έξοδα",
          vatClassification: DOMESTIC_VAT,
        },
      ],
    }),
  },
  {
    id: "entersoft-domestic-services",
    label: "ENTERSOFT domestic services",
    match: (text) => /ENTERSOFT/i.test(text) && /(Ελλάς|Greece|GR)/i.test(text) && /24\s*%/.test(text),
    classify: (_text, parsed) => ({
      matchedRuleId: "entersoft-domestic-services",
      confidence: 0.85,
      supplierName: "ENTERSOFT AE",
      countryCode: "GR",
      vatNumber: "099759170",
      supplierType: SupplierType.domestic_services,
      invoiceKind: InvoiceKind.services,
      expenseCategory: DOMESTIC_EXPENSE,
      e3Code: "E3_585_016 - Λοιπά έξοδα",
      vatClassification: DOMESTIC_VAT,
      status: InvoiceStatus.parsed,
      isReverseCharge: false,
      isEu: false,
      isDomestic: true,
      isNonEu: false,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      lines: [
        {
          description: "ENTERSOFT services",
          netAmountCents: parsed.netAmountCents,
          vatRate: 24,
          vatAmountCents: parsed.vatAmountCents,
          grossAmountCents: parsed.grossAmountCents,
          lineType: InvoiceLineType.services,
          expenseCategory: DOMESTIC_EXPENSE,
          e3Code: "E3_585_016 - Λοιπά έξοδα",
          vatClassification: DOMESTIC_VAT,
        },
      ],
    }),
  },
  {
    id: "bkp-software-domestic-services",
    label: "B.K.P. Software domestic services",
    match: (text) => /B\.?K\.?P\.?\s*Software/i.test(text) && /(Ελλάς|Greece|GR)/i.test(text) && /24\s*%/.test(text),
    classify: (_text, parsed) => ({
      matchedRuleId: "bkp-software-domestic-services",
      confidence: 0.85,
      supplierName: "B.K.P. Software",
      countryCode: "GR",
      vatNumber: "037569970",
      supplierType: SupplierType.domestic_services,
      invoiceKind: InvoiceKind.services,
      expenseCategory: DOMESTIC_EXPENSE,
      e3Code: "E3_585_016 - Λοιπά έξοδα",
      vatClassification: DOMESTIC_VAT,
      status: InvoiceStatus.parsed,
      isReverseCharge: false,
      isEu: false,
      isDomestic: true,
      isNonEu: false,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      lines: [
        {
          description: "B.K.P. Software services",
          netAmountCents: parsed.netAmountCents,
          vatRate: 24,
          vatAmountCents: parsed.vatAmountCents,
          grossAmountCents: parsed.grossAmountCents,
          lineType: InvoiceLineType.services,
          expenseCategory: DOMESTIC_EXPENSE,
          e3Code: "E3_585_016 - Λοιπά έξοδα",
          vatClassification: DOMESTIC_VAT,
        },
      ],
    }),
  },
  {
    id: "google-commerce-domestic-vat",
    label: "Google Commerce Limited 24% VAT",
    match: (text) => /Google Commerce Limited/i.test(text) && /24\s*%/.test(text) && /(VAT|ΦΠΑ)/i.test(text),
    classify: (_text, parsed) => ({
      matchedRuleId: "google-commerce-domestic-vat",
      confidence: 0.8,
      supplierName: "Google Commerce Limited",
      countryCode: "IE",
      vatNumber: "9825613N",
      supplierType: SupplierType.domestic_services,
      invoiceKind: InvoiceKind.services,
      expenseCategory: DOMESTIC_EXPENSE,
      e3Code: "E3_585_010 ή E3_585_016",
      vatClassification: "366-Φ2 - Λοιπές πράξεις λήπτη",
      status: InvoiceStatus.parsed,
      isReverseCharge: false,
      isEu: false,
      isDomestic: true,
      isNonEu: false,
      viesCountryCode: null,
      viesVatNumber: null,
      viesGoodsAmountCents: 0,
      viesServicesAmountCents: 0,
      lines: [
        {
          description: "Google services",
          netAmountCents: parsed.netAmountCents,
          vatRate: 24,
          vatAmountCents: parsed.vatAmountCents,
          grossAmountCents: parsed.grossAmountCents,
          lineType: InvoiceLineType.services,
          expenseCategory: DOMESTIC_EXPENSE,
          e3Code: "E3_585_010 ή E3_585_016",
          vatClassification: "366-Φ2 - Λοιπές πράξεις λήπτη",
        },
      ],
    }),
  },
];

export function unknownClassification(parsed: ParsedInvoiceData): ClassificationResult {
  const countryCode = parsed.supplierVat?.slice(0, 2) ?? "";
  const vatNumber = parsed.supplierVat?.slice(2) ?? "";
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
    notes: "Δεν βρέθηκε ασφαλής κανόνας. Απαιτείται έλεγχος.",
  };
}