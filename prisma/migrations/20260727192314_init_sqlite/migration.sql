-- CreateTable
CREATE TABLE "supplier_registry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vatNumber" TEXT,
    "countryCode" TEXT NOT NULL,
    "supplierType" TEXT NOT NULL,
    "invoiceKind" TEXT NOT NULL,
    "myDataInvoiceType" TEXT,
    "expenseCategory" TEXT,
    "e3Code" TEXT,
    "vatClassification" TEXT,
    "viesCountryCode" TEXT,
    "viesVatNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "learnedFromInvoiceId" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "vatNumber" TEXT,
    "defaultInvoiceType" TEXT,
    "defaultExpenseCategory" TEXT,
    "defaultE3Code" TEXT,
    "defaultVatClassification" TEXT,
    "supplierType" TEXT NOT NULL DEFAULT 'unknown',
    "externalRef" TEXT,
    "sourceApp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "originalFilePath" TEXT,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" DATETIME,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "netAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatAmountCents" INTEGER NOT NULL DEFAULT 0,
    "grossAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "isEu" BOOLEAN NOT NULL DEFAULT false,
    "isDomestic" BOOLEAN NOT NULL DEFAULT false,
    "isNonEu" BOOLEAN NOT NULL DEFAULT false,
    "invoiceKind" TEXT NOT NULL DEFAULT 'unknown',
    "myDataInvoiceType" TEXT,
    "expenseCategory" TEXT,
    "e3Code" TEXT,
    "vatClassification" TEXT,
    "viesCountryCode" TEXT,
    "viesVatNumber" TEXT,
    "viesGoodsAmountCents" INTEGER NOT NULL DEFAULT 0,
    "viesServicesAmountCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "notes" TEXT,
    "relatedRepairOrderId" TEXT,
    "relatedCustomerId" TEXT,
    "relatedPaymentId" TEXT,
    "sourceApp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "netAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "vatAmountCents" INTEGER NOT NULL DEFAULT 0,
    "grossAmountCents" INTEGER NOT NULL DEFAULT 0,
    "lineType" TEXT NOT NULL DEFAULT 'unknown',
    "expenseCategory" TEXT,
    "e3Code" TEXT,
    "vatClassification" TEXT,
    "relatedProductId" TEXT,
    "relatedPartId" TEXT,
    "relatedStockMovementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mydata_classifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceType" TEXT NOT NULL,
    "expenseCategory" TEXT NOT NULL,
    "e3Code" TEXT NOT NULL,
    "vatClassification" TEXT NOT NULL,
    "invoiceKind" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vies_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "countryCode" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "goodsAmountCents" INTEGER NOT NULL DEFAULT 0,
    "servicesAmountCents" INTEGER NOT NULL DEFAULT 0,
    "generatedFromStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "vat_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" INTEGER,
    "quarter" INTEGER,
    "year" INTEGER NOT NULL,
    "totalVat364Cents" INTEGER NOT NULL DEFAULT 0,
    "totalVat365Cents" INTEGER NOT NULL DEFAULT 0,
    "totalReverseChargeVatCents" INTEGER NOT NULL DEFAULT 0,
    "totalVat361Cents" INTEGER NOT NULL DEFAULT 0,
    "totalNonParticipatingCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalViesGoodsCents" INTEGER NOT NULL DEFAULT 0,
    "totalViesServicesCents" INTEGER NOT NULL DEFAULT 0,
    "totalVat364Cents" INTEGER NOT NULL DEFAULT 0,
    "totalVat365Cents" INTEGER NOT NULL DEFAULT 0,
    "totalReverseChargeVatCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "accounting_document_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "lineNumber" TEXT,
    "description" TEXT,
    "netAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "vatAmountCents" INTEGER NOT NULL DEFAULT 0,
    "grossAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatCategory" TEXT,
    "vatExemptionCategory" TEXT,
    "incomeClassificationCategory" TEXT,
    "incomeClassificationType" TEXT,
    "expenseCategory" TEXT,
    "expenseClassificationType" TEXT,
    "e3Code" TEXT,
    "vatClassification" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounting_document_lines_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "accounting_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounting_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "direction" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mydata',
    "mydataMark" TEXT,
    "mydataUid" TEXT,
    "authenticationCode" TEXT,
    "issuerVat" TEXT,
    "issuerName" TEXT,
    "counterpartVat" TEXT,
    "counterpartName" TEXT,
    "issueDate" DATETIME,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "invoiceType" TEXT,
    "series" TEXT,
    "aa" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "netAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatAmountCents" INTEGER NOT NULL DEFAULT 0,
    "grossAmountCents" INTEGER NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 0,
    "incomeClassificationCategory" TEXT,
    "incomeClassificationType" TEXT,
    "expenseCategory" TEXT,
    "expenseClassificationType" TEXT,
    "e3Code" TEXT,
    "vatCategory" TEXT,
    "vatClassification" TEXT,
    "vatExemptionCategory" TEXT,
    "countryCode" TEXT,
    "vatNumber" TEXT,
    "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "isVies" BOOLEAN NOT NULL DEFAULT false,
    "viesGoodsAmountCents" INTEGER NOT NULL DEFAULT 0,
    "viesServicesAmountCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'synced',
    "rawPayload" JSONB,
    "notes" TEXT,
    "relatedRepairOrderId" TEXT,
    "relatedCustomerId" TEXT,
    "relatedPaymentId" TEXT,
    "relatedProductId" TEXT,
    "relatedPartId" TEXT,
    "relatedStockMovementId" TEXT,
    "externalRef" TEXT,
    "sourceApp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mydata_sync_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateFrom" DATETIME NOT NULL,
    "dateTo" DATETIME NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "needsReview" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "reconciliation_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pdfDocumentId" TEXT,
    "mydataDocumentId" TEXT,
    "status" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "differences" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reconciliation_matches_mydataDocumentId_fkey" FOREIGN KEY ("mydataDocumentId") REFERENCES "accounting_documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reconciliation_matches_pdfDocumentId_fkey" FOREIGN KEY ("pdfDocumentId") REFERENCES "accounting_documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_registry_vatNumber_key" ON "supplier_registry"("vatNumber");

-- CreateIndex
CREATE INDEX "supplier_registry_countryCode_idx" ON "supplier_registry"("countryCode");

-- CreateIndex
CREATE INDEX "supplier_registry_supplierType_idx" ON "supplier_registry"("supplierType");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_countryCode_vatNumber_key" ON "suppliers"("countryCode", "vatNumber");

-- CreateIndex
CREATE INDEX "invoices_periodYear_periodMonth_idx" ON "invoices"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_supplierId_idx" ON "invoices"("supplierId");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "vies_reports_year_month_idx" ON "vies_reports"("year", "month");

-- CreateIndex
CREATE INDEX "vat_reports_year_month_idx" ON "vat_reports"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_year_month_key" ON "monthly_reports"("year", "month");

-- CreateIndex
CREATE INDEX "accounting_document_lines_documentId_idx" ON "accounting_document_lines"("documentId");

-- CreateIndex
CREATE INDEX "accounting_documents_direction_status_idx" ON "accounting_documents"("direction", "status");

-- CreateIndex
CREATE INDEX "accounting_documents_periodYear_periodMonth_idx" ON "accounting_documents"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "accounting_documents_source_idx" ON "accounting_documents"("source");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_documents_direction_mydataMark_key" ON "accounting_documents"("direction", "mydataMark");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_documents_direction_mydataUid_key" ON "accounting_documents"("direction", "mydataUid");

-- CreateIndex
CREATE INDEX "mydata_sync_runs_dateFrom_dateTo_idx" ON "mydata_sync_runs"("dateFrom", "dateTo");

-- CreateIndex
CREATE INDEX "reconciliation_matches_mydataDocumentId_idx" ON "reconciliation_matches"("mydataDocumentId");

-- CreateIndex
CREATE INDEX "reconciliation_matches_pdfDocumentId_idx" ON "reconciliation_matches"("pdfDocumentId");

-- CreateIndex
CREATE INDEX "reconciliation_matches_status_idx" ON "reconciliation_matches"("status");
