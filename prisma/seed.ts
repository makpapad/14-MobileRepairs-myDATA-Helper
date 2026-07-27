import { PrismaClient, InvoiceKind, InvoiceStatus, SupplierType } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to convert EUR to cents
const eurToCents = (eur: number) => Math.round(eur * 100);

const EU_SERVICE_TYPE = "14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών";
const EU_SERVICE_EXPENSE = "2.3 Λήψη Υπηρεσιών";
const EU_SERVICE_E3 = "E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής";
const EU_SERVICE_VAT = "365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α";

const EU_GOODS_TYPE = "14.1 Τιμολόγιο / Ενδοκοινοτικές Αποκτήσεις";
const EU_GOODS_EXPENSE = "2.1 Αγορές Εμπορευμάτων";
const EU_GOODS_E3 = "E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές";
const EU_GOODS_VAT = "364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών";

async function main() {
  const suppliers = [
    ["Google Ireland Limited", "IE", "6388047V", SupplierType.eu_services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT],
    ["Google Cloud EMEA Limited", "IE", "3668997OH", SupplierType.eu_services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT],
    ["OpenAI Ireland Limited", "IE", "4143435AH", SupplierType.eu_services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT],
    ["Hetzner Online GmbH", "DE", "812871812", SupplierType.eu_services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT],
    ["Marseus Computer Kft.", "HU", "12648797", SupplierType.eu_goods, EU_GOODS_TYPE, EU_GOODS_EXPENSE, EU_GOODS_E3, EU_GOODS_VAT],
    ["Google Commerce Limited", "IE", "9825613N", SupplierType.unknown, null, "2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ", "E3_585_010 ή E3_585_016", "366-Φ2 - Λοιπές πράξεις λήπτη"],
    ["BOX NOW AE", "GR", null, SupplierType.domestic_services, null, "2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ", "E3_585_016 - Λοιπά έξοδα", "361-Φ2 - Αγορές & δαπάνες στο εσωτερικό της χώρας"],
  ] as const;

  for (const [name, countryCode, vatNumber, supplierType, invoiceType, expenseCategory, e3Code, vatClassification] of suppliers) {
    await prisma.supplier.upsert({
      where: { countryCode_vatNumber: { countryCode, vatNumber: vatNumber ?? "" } },
      update: { name, supplierType, defaultInvoiceType: invoiceType, defaultExpenseCategory: expenseCategory, defaultE3Code: e3Code, defaultVatClassification: vatClassification },
      create: { name, countryCode, vatNumber: vatNumber ?? "", supplierType, defaultInvoiceType: invoiceType, defaultExpenseCategory: expenseCategory, defaultE3Code: e3Code, defaultVatClassification: vatClassification },
    });
  }

  const may2026 = [
    ["Marseus Computer Kft.", "HU", "12648797", "MRS-2026-05", 745, 0, 745, InvoiceKind.goods, EU_GOODS_TYPE, EU_GOODS_EXPENSE, EU_GOODS_E3, EU_GOODS_VAT, 745, 0],
    ["Google Ireland Limited", "IE", "6388047V", "ADS-2026-05", 51.77, 0, 51.77, InvoiceKind.services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT, 0, 51.77],
    ["Google Cloud EMEA Limited", "IE", "3668997OH", "WRK-2026-05", 16.2, 0, 16.2, InvoiceKind.services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT, 0, 16.2],
    ["OpenAI Ireland Limited", "IE", "4143435AH", "OAI-2026-05", 184.68, 0, 184.68, InvoiceKind.services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT, 0, 184.68],
    ["Hetzner Online GmbH", "DE", "812871812", "HTZ-2026-05", 68.35, 0, 68.35, InvoiceKind.services, EU_SERVICE_TYPE, EU_SERVICE_EXPENSE, EU_SERVICE_E3, EU_SERVICE_VAT, 0, 68.35],
  ] as const;

  for (const row of may2026) {
    const [supplierName, countryCode, vatNumber, invoiceNumber, net, vat, gross, invoiceKind, invoiceType, expenseCategory, e3Code, vatClassification, goods, services] = row;
    const supplier = await prisma.supplier.findFirstOrThrow({ where: { countryCode, vatNumber } });
    await prisma.invoice.upsert({
      where: { id: `seed-${invoiceNumber}` },
      update: {},
      create: {
        id: `seed-${invoiceNumber}`,
        fileName: `${invoiceNumber}.pdf`,
        supplier: { connect: { id: supplier.id } },
        invoiceNumber,
        invoiceDate: new Date("2026-05-15T00:00:00Z"),
        periodMonth: 5,
        periodYear: 2026,
        netAmountCents: eurToCents(net),
        vatAmountCents: eurToCents(vat),
        grossAmountCents: eurToCents(gross),
        vatRate: 0,
        currency: "EUR",
        isReverseCharge: invoiceKind === InvoiceKind.services,
        isEu: true,
        invoiceKind,
        myDataInvoiceType: invoiceType,
        expenseCategory,
        e3Code,
        vatClassification,
        viesCountryCode: countryCode,
        viesVatNumber: vatNumber,
        viesGoodsAmountCents: eurToCents(goods),
        viesServicesAmountCents: eurToCents(services),
        status: InvoiceStatus.approved,
        lines: {
          create: {
            description: supplierName,
            netAmountCents: eurToCents(net),
            vatRate: 0,
            vatAmountCents: eurToCents(vat),
            grossAmountCents: eurToCents(gross),
            lineType: invoiceKind,
            expenseCategory,
            e3Code,
            vatClassification,
          },
        },
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });