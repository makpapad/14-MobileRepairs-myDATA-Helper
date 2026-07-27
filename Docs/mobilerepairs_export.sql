--
-- PostgreSQL database dump
--

\restrict wBW5Mra4xAhA8uJ9uOdrZy01JhjFRNDoEI15XCn5ejknf7Ydn8Lfi0qnUcmrO2A

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: accounting; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA accounting;


--
-- Name: AccountingDirection; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."AccountingDirection" AS ENUM (
    'income',
    'expense'
);


--
-- Name: AccountingDocumentStatus; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."AccountingDocumentStatus" AS ENUM (
    'synced',
    'needs_review',
    'approved',
    'excluded',
    'ready_for_submission'
);


--
-- Name: AccountingSource; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."AccountingSource" AS ENUM (
    'mydata',
    'manual',
    'pdf'
);


--
-- Name: InvoiceKind; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."InvoiceKind" AS ENUM (
    'goods',
    'services',
    'mixed',
    'unknown'
);


--
-- Name: InvoiceLineType; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."InvoiceLineType" AS ENUM (
    'goods',
    'services',
    'shipping',
    'bank_fee',
    'personal',
    'unknown'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."InvoiceStatus" AS ENUM (
    'uploaded',
    'parsed',
    'needs_review',
    'approved',
    'excluded'
);


--
-- Name: MyDataSyncKind; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."MyDataSyncKind" AS ENUM (
    'income',
    'expense',
    'all'
);


--
-- Name: MyDataSyncStatus; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."MyDataSyncStatus" AS ENUM (
    'success',
    'partial',
    'failed'
);


--
-- Name: ReconciliationStatus; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."ReconciliationStatus" AS ENUM (
    'matched',
    'possible_match',
    'unmatched_pdf',
    'unmatched_mydata'
);


--
-- Name: SupplierType; Type: TYPE; Schema: accounting; Owner: -
--

CREATE TYPE accounting."SupplierType" AS ENUM (
    'eu_goods',
    'eu_services',
    'domestic_goods',
    'domestic_services',
    'non_eu_services',
    'personal',
    'unknown'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accounting_document_lines; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.accounting_document_lines (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "lineNumber" text,
    description text,
    "netAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "vatAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "grossAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatCategory" text,
    "vatExemptionCategory" text,
    "incomeClassificationCategory" text,
    "incomeClassificationType" text,
    "expenseCategory" text,
    "expenseClassificationType" text,
    "e3Code" text,
    "vatClassification" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: accounting_documents; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.accounting_documents (
    id text NOT NULL,
    direction accounting."AccountingDirection" NOT NULL,
    source accounting."AccountingSource" DEFAULT 'mydata'::accounting."AccountingSource" NOT NULL,
    "mydataMark" text,
    "mydataUid" text,
    "authenticationCode" text,
    "issuerVat" text,
    "issuerName" text,
    "counterpartVat" text,
    "counterpartName" text,
    "issueDate" timestamp(3) without time zone,
    "periodMonth" integer NOT NULL,
    "periodYear" integer NOT NULL,
    "invoiceType" text,
    series text,
    aa text,
    currency text DEFAULT 'EUR'::text NOT NULL,
    "netAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "grossAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "incomeClassificationCategory" text,
    "incomeClassificationType" text,
    "expenseCategory" text,
    "expenseClassificationType" text,
    "e3Code" text,
    "vatCategory" text,
    "vatClassification" text,
    "vatExemptionCategory" text,
    "countryCode" text,
    "vatNumber" text,
    "isReverseCharge" boolean DEFAULT false NOT NULL,
    "isVies" boolean DEFAULT false NOT NULL,
    "viesGoodsAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "viesServicesAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    status accounting."AccountingDocumentStatus" DEFAULT 'synced'::accounting."AccountingDocumentStatus" NOT NULL,
    "rawPayload" jsonb,
    notes text,
    "relatedRepairOrderId" text,
    "relatedCustomerId" text,
    "relatedPaymentId" text,
    "relatedProductId" text,
    "relatedPartId" text,
    "relatedStockMovementId" text,
    "externalRef" text,
    "sourceApp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: invoice_lines; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.invoice_lines (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    description text NOT NULL,
    "netAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "vatAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "grossAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "lineType" accounting."InvoiceLineType" DEFAULT 'unknown'::accounting."InvoiceLineType" NOT NULL,
    "expenseCategory" text,
    "e3Code" text,
    "vatClassification" text,
    "relatedProductId" text,
    "relatedPartId" text,
    "relatedStockMovementId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.invoices (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "originalFilePath" text,
    "supplierId" text,
    "invoiceNumber" text,
    "invoiceDate" timestamp(3) without time zone,
    "periodMonth" integer NOT NULL,
    "periodYear" integer NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    "netAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "grossAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "vatRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "isReverseCharge" boolean DEFAULT false NOT NULL,
    "isEu" boolean DEFAULT false NOT NULL,
    "isDomestic" boolean DEFAULT false NOT NULL,
    "isNonEu" boolean DEFAULT false NOT NULL,
    "invoiceKind" accounting."InvoiceKind" DEFAULT 'unknown'::accounting."InvoiceKind" NOT NULL,
    "myDataInvoiceType" text,
    "expenseCategory" text,
    "e3Code" text,
    "vatClassification" text,
    "viesCountryCode" text,
    "viesVatNumber" text,
    "viesGoodsAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "viesServicesAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    status accounting."InvoiceStatus" DEFAULT 'uploaded'::accounting."InvoiceStatus" NOT NULL,
    notes text,
    "relatedRepairOrderId" text,
    "relatedCustomerId" text,
    "relatedPaymentId" text,
    "sourceApp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: monthly_reports; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.monthly_reports (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "totalViesGoods" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalViesServices" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalVat364" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalVat365" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalReverseChargeVat" numeric(12,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: mydata_classifications; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.mydata_classifications (
    id text NOT NULL,
    "invoiceType" text NOT NULL,
    "expenseCategory" text NOT NULL,
    "e3Code" text NOT NULL,
    "vatClassification" text NOT NULL,
    "invoiceKind" text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: mydata_sync_runs; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.mydata_sync_runs (
    id text NOT NULL,
    "dateFrom" timestamp(3) without time zone NOT NULL,
    "dateTo" timestamp(3) without time zone NOT NULL,
    kind accounting."MyDataSyncKind" NOT NULL,
    status accounting."MyDataSyncStatus" NOT NULL,
    fetched integer DEFAULT 0 NOT NULL,
    created integer DEFAULT 0 NOT NULL,
    updated integer DEFAULT 0 NOT NULL,
    errors integer DEFAULT 0 NOT NULL,
    "needsReview" integer DEFAULT 0 NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reconciliation_matches; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.reconciliation_matches (
    id text NOT NULL,
    "pdfDocumentId" text,
    "mydataDocumentId" text,
    status accounting."ReconciliationStatus" NOT NULL,
    score numeric(5,2) DEFAULT 0 NOT NULL,
    differences jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: supplier_registry; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.supplier_registry (
    id text NOT NULL,
    name text NOT NULL,
    "vatNumber" text,
    "countryCode" text NOT NULL,
    "supplierType" accounting."SupplierType" NOT NULL,
    "invoiceKind" accounting."InvoiceKind" NOT NULL,
    "myDataInvoiceType" text,
    "expenseCategory" text,
    "e3Code" text,
    "vatClassification" text,
    "viesCountryCode" text,
    "viesVatNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "learnedFromInvoiceId" text,
    confidence numeric(3,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.suppliers (
    id text NOT NULL,
    name text NOT NULL,
    "countryCode" text NOT NULL,
    "vatNumber" text,
    "defaultInvoiceType" text,
    "defaultExpenseCategory" text,
    "defaultE3Code" text,
    "defaultVatClassification" text,
    "supplierType" accounting."SupplierType" DEFAULT 'unknown'::accounting."SupplierType" NOT NULL,
    "externalRef" text,
    "sourceApp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vat_reports; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.vat_reports (
    id text NOT NULL,
    month integer,
    quarter integer,
    year integer NOT NULL,
    "totalVat364" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalVat365" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalReverseChargeVat" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalVat361" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalNonParticipating" numeric(12,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vies_reports; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.vies_reports (
    id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "countryCode" text NOT NULL,
    "vatNumber" text NOT NULL,
    "supplierName" text NOT NULL,
    "goodsAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "servicesAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "generatedFromStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
760b4911-e48d-468e-aa57-f1ec6474adb0	286efc7dcc4a4c992d5a2412a629f62493e349b07a167f0eac443606c47a1408	2026-07-27 10:05:08.650385+03	20260626000000_init	\N	\N	2026-07-27 10:05:08.478976+03	1
a1900387-15d7-44f3-b62a-86e20248cd41	0308f433fea97f52ddeaa4423c411c058ad90fe94969c7c221a03c6bdcc4b53c	2026-07-27 10:05:43.602543+03	20260727070543_add_supplier_registry	\N	\N	2026-07-27 10:05:43.392419+03	1
\.


--
-- Data for Name: accounting_document_lines; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.accounting_document_lines (id, "documentId", "lineNumber", description, "netAmount", "vatRate", "vatAmount", "grossAmount", "vatCategory", "vatExemptionCategory", "incomeClassificationCategory", "incomeClassificationType", "expenseCategory", "expenseClassificationType", "e3Code", "vatClassification", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: accounting_documents; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.accounting_documents (id, direction, source, "mydataMark", "mydataUid", "authenticationCode", "issuerVat", "issuerName", "counterpartVat", "counterpartName", "issueDate", "periodMonth", "periodYear", "invoiceType", series, aa, currency, "netAmount", "vatAmount", "grossAmount", "vatRate", "incomeClassificationCategory", "incomeClassificationType", "expenseCategory", "expenseClassificationType", "e3Code", "vatCategory", "vatClassification", "vatExemptionCategory", "countryCode", "vatNumber", "isReverseCharge", "isVies", "viesGoodsAmount", "viesServicesAmount", status, "rawPayload", notes, "relatedRepairOrderId", "relatedCustomerId", "relatedPaymentId", "relatedProductId", "relatedPartId", "relatedStockMovementId", "externalRef", "sourceApp", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invoice_lines; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.invoice_lines (id, "invoiceId", description, "netAmount", "vatRate", "vatAmount", "grossAmount", "lineType", "expenseCategory", "e3Code", "vatClassification", "relatedProductId", "relatedPartId", "relatedStockMovementId", "createdAt", "updatedAt") FROM stdin;
cms2vtwmz0007uomcdfcgm9gk	seed-MRS-2026-05	Marseus Computer Kft.	745.00	0.00	0.00	745.00	goods	2.1 Αγορές Εμπορευμάτων	E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές	364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών	\N	\N	\N	2026-07-27 07:05:11.291	2026-07-27 07:05:11.291
cms2vtwnf0008uomcnyivo9x5	seed-ADS-2026-05	Google Ireland Limited	51.77	0.00	0.00	51.77	services	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	\N	\N	\N	2026-07-27 07:05:11.307	2026-07-27 07:05:11.307
cms2vtwnl0009uomcohrvptv1	seed-WRK-2026-05	Google Cloud EMEA Limited	16.20	0.00	0.00	16.20	services	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	\N	\N	\N	2026-07-27 07:05:11.313	2026-07-27 07:05:11.313
cms2vtwnt000auomc1fjltxjv	seed-OAI-2026-05	OpenAI Ireland Limited	184.68	0.00	0.00	184.68	services	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	\N	\N	\N	2026-07-27 07:05:11.321	2026-07-27 07:05:11.321
cms2vtwnz000buomcl5fpbmfe	seed-HTZ-2026-05	Hetzner Online GmbH	68.35	0.00	0.00	68.35	services	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	\N	\N	\N	2026-07-27 07:05:11.327	2026-07-27 07:05:11.327
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.invoices (id, "fileName", "originalFilePath", "supplierId", "invoiceNumber", "invoiceDate", "periodMonth", "periodYear", currency, "netAmount", "vatAmount", "grossAmount", "vatRate", "isReverseCharge", "isEu", "isDomestic", "isNonEu", "invoiceKind", "myDataInvoiceType", "expenseCategory", "e3Code", "vatClassification", "viesCountryCode", "viesVatNumber", "viesGoodsAmount", "viesServicesAmount", status, notes, "relatedRepairOrderId", "relatedCustomerId", "relatedPaymentId", "sourceApp", "createdAt", "updatedAt") FROM stdin;
seed-MRS-2026-05	MRS-2026-05.pdf	\N	cms2vtwmk0004uomciw3lpgjd	MRS-2026-05	2026-05-15 00:00:00	5	2026	EUR	745.00	0.00	745.00	0.00	f	t	f	f	goods	14.1 Τιμολόγιο / Ενδοκοινοτικές Αποκτήσεις	2.1 Αγορές Εμπορευμάτων	E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές	364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών	HU	12648797	745.00	0.00	approved	\N	\N	\N	\N	\N	2026-07-27 07:05:11.291	2026-07-27 07:05:11.291
seed-ADS-2026-05	ADS-2026-05.pdf	\N	cms2vtwm50000uomce480u2gx	ADS-2026-05	2026-05-15 00:00:00	5	2026	EUR	51.77	0.00	51.77	0.00	t	t	f	f	services	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	IE	6388047V	0.00	51.77	approved	\N	\N	\N	\N	\N	2026-07-27 07:05:11.307	2026-07-27 07:05:11.307
seed-WRK-2026-05	WRK-2026-05.pdf	\N	cms2vtwme0001uomcse0cy7jn	WRK-2026-05	2026-05-15 00:00:00	5	2026	EUR	16.20	0.00	16.20	0.00	t	t	f	f	services	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	IE	3668997OH	0.00	16.20	approved	\N	\N	\N	\N	\N	2026-07-27 07:05:11.313	2026-07-27 07:05:11.313
seed-OAI-2026-05	OAI-2026-05.pdf	\N	cms2vtwmh0002uomc707s9go8	OAI-2026-05	2026-05-15 00:00:00	5	2026	EUR	184.68	0.00	184.68	0.00	t	t	f	f	services	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	IE	4143435AH	0.00	184.68	approved	\N	\N	\N	\N	\N	2026-07-27 07:05:11.321	2026-07-27 07:05:11.321
seed-HTZ-2026-05	HTZ-2026-05.pdf	\N	cms2vtwmj0003uomc383l4hzl	HTZ-2026-05	2026-05-15 00:00:00	5	2026	EUR	68.35	0.00	68.35	0.00	t	t	f	f	services	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	DE	812871812	0.00	68.35	approved	\N	\N	\N	\N	\N	2026-07-27 07:05:11.327	2026-07-27 07:05:11.327
\.


--
-- Data for Name: monthly_reports; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.monthly_reports (id, month, year, "totalViesGoods", "totalViesServices", "totalVat364", "totalVat365", "totalReverseChargeVat", "createdAt") FROM stdin;
\.


--
-- Data for Name: mydata_classifications; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.mydata_classifications (id, "invoiceType", "expenseCategory", "e3Code", "vatClassification", "invoiceKind", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: mydata_sync_runs; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.mydata_sync_runs (id, "dateFrom", "dateTo", kind, status, fetched, created, updated, errors, "needsReview", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: reconciliation_matches; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.reconciliation_matches (id, "pdfDocumentId", "mydataDocumentId", status, score, differences, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: supplier_registry; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.supplier_registry (id, name, "vatNumber", "countryCode", "supplierType", "invoiceKind", "myDataInvoiceType", "expenseCategory", "e3Code", "vatClassification", "viesCountryCode", "viesVatNumber", "isActive", "learnedFromInvoiceId", confidence, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.suppliers (id, name, "countryCode", "vatNumber", "defaultInvoiceType", "defaultExpenseCategory", "defaultE3Code", "defaultVatClassification", "supplierType", "externalRef", "sourceApp", "createdAt", "updatedAt") FROM stdin;
cms2vtwm50000uomce480u2gx	Google Ireland Limited	IE	6388047V	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	eu_services	\N	\N	2026-07-27 07:05:11.261	2026-07-27 07:05:11.261
cms2vtwme0001uomcse0cy7jn	Google Cloud EMEA Limited	IE	3668997OH	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	eu_services	\N	\N	2026-07-27 07:05:11.27	2026-07-27 07:05:11.27
cms2vtwmh0002uomc707s9go8	OpenAI Ireland Limited	IE	4143435AH	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	eu_services	\N	\N	2026-07-27 07:05:11.273	2026-07-27 07:05:11.273
cms2vtwmj0003uomc383l4hzl	Hetzner Online GmbH	DE	812871812	14.3 Τιμολόγιο / Ενδοκοινοτική Λήψη Υπηρεσιών	2.3 Λήψη Υπηρεσιών	E3_585_010 - Λοιπές Αμοιβές για υπηρεσίες αλλοδαπής	365-Φ2 - Ενδοκοινοτικές λήψεις υπηρεσιών άρθρ. 14.2.α	eu_services	\N	\N	2026-07-27 07:05:11.275	2026-07-27 07:05:11.275
cms2vtwmk0004uomciw3lpgjd	Marseus Computer Kft.	HU	12648797	14.1 Τιμολόγιο / Ενδοκοινοτικές Αποκτήσεις	2.1 Αγορές Εμπορευμάτων	E3_102_004 - Αγορές εμπορευμάτων χρήσης Εξωτερικού Ενδοκοινοτικές	364-Φ2 - Ενδοκοινοτικές αποκτήσεις αγαθών	eu_goods	\N	\N	2026-07-27 07:05:11.277	2026-07-27 07:05:11.277
cms2vtwmm0005uomcwwoyu69p	Google Commerce Limited	IE	9825613N	\N	2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ	E3_585_010 ή E3_585_016	366-Φ2 - Λοιπές πράξεις λήπτη	unknown	\N	\N	2026-07-27 07:05:11.278	2026-07-27 07:05:11.278
cms2vtwmo0006uomcgxjk1rz2	BOX NOW AE	GR		\N	2.4 Γενικά Έξοδα με δικαίωμα έκπτωσης ΦΠΑ	E3_585_016 - Λοιπά έξοδα	361-Φ2 - Αγορές & δαπάνες στο εσωτερικό της χώρας	domestic_services	\N	\N	2026-07-27 07:05:11.281	2026-07-27 07:05:11.281
\.


--
-- Data for Name: vat_reports; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.vat_reports (id, month, quarter, year, "totalVat364", "totalVat365", "totalReverseChargeVat", "totalVat361", "totalNonParticipating", "createdAt") FROM stdin;
\.


--
-- Data for Name: vies_reports; Type: TABLE DATA; Schema: accounting; Owner: -
--

COPY accounting.vies_reports (id, month, year, "countryCode", "vatNumber", "supplierName", "goodsAmount", "servicesAmount", "generatedFromStatus", "createdAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounting_document_lines accounting_document_lines_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_document_lines
    ADD CONSTRAINT accounting_document_lines_pkey PRIMARY KEY (id);


--
-- Name: accounting_documents accounting_documents_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_documents
    ADD CONSTRAINT accounting_documents_pkey PRIMARY KEY (id);


--
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: monthly_reports monthly_reports_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.monthly_reports
    ADD CONSTRAINT monthly_reports_pkey PRIMARY KEY (id);


--
-- Name: mydata_classifications mydata_classifications_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.mydata_classifications
    ADD CONSTRAINT mydata_classifications_pkey PRIMARY KEY (id);


--
-- Name: mydata_sync_runs mydata_sync_runs_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.mydata_sync_runs
    ADD CONSTRAINT mydata_sync_runs_pkey PRIMARY KEY (id);


--
-- Name: reconciliation_matches reconciliation_matches_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_pkey PRIMARY KEY (id);


--
-- Name: supplier_registry supplier_registry_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.supplier_registry
    ADD CONSTRAINT supplier_registry_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: vat_reports vat_reports_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.vat_reports
    ADD CONSTRAINT vat_reports_pkey PRIMARY KEY (id);


--
-- Name: vies_reports vies_reports_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.vies_reports
    ADD CONSTRAINT vies_reports_pkey PRIMARY KEY (id);


--
-- Name: accounting_document_lines_documentId_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "accounting_document_lines_documentId_idx" ON accounting.accounting_document_lines USING btree ("documentId");


--
-- Name: accounting_documents_direction_mydataMark_key; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX "accounting_documents_direction_mydataMark_key" ON accounting.accounting_documents USING btree (direction, "mydataMark");


--
-- Name: accounting_documents_direction_mydataUid_key; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX "accounting_documents_direction_mydataUid_key" ON accounting.accounting_documents USING btree (direction, "mydataUid");


--
-- Name: accounting_documents_direction_status_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX accounting_documents_direction_status_idx ON accounting.accounting_documents USING btree (direction, status);


--
-- Name: accounting_documents_periodYear_periodMonth_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "accounting_documents_periodYear_periodMonth_idx" ON accounting.accounting_documents USING btree ("periodYear", "periodMonth");


--
-- Name: accounting_documents_source_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX accounting_documents_source_idx ON accounting.accounting_documents USING btree (source);


--
-- Name: invoice_lines_invoiceId_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "invoice_lines_invoiceId_idx" ON accounting.invoice_lines USING btree ("invoiceId");


--
-- Name: invoices_periodYear_periodMonth_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "invoices_periodYear_periodMonth_idx" ON accounting.invoices USING btree ("periodYear", "periodMonth");


--
-- Name: invoices_status_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX invoices_status_idx ON accounting.invoices USING btree (status);


--
-- Name: invoices_supplierId_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "invoices_supplierId_idx" ON accounting.invoices USING btree ("supplierId");


--
-- Name: monthly_reports_year_month_key; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX monthly_reports_year_month_key ON accounting.monthly_reports USING btree (year, month);


--
-- Name: mydata_sync_runs_dateFrom_dateTo_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "mydata_sync_runs_dateFrom_dateTo_idx" ON accounting.mydata_sync_runs USING btree ("dateFrom", "dateTo");


--
-- Name: reconciliation_matches_mydataDocumentId_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "reconciliation_matches_mydataDocumentId_idx" ON accounting.reconciliation_matches USING btree ("mydataDocumentId");


--
-- Name: reconciliation_matches_pdfDocumentId_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "reconciliation_matches_pdfDocumentId_idx" ON accounting.reconciliation_matches USING btree ("pdfDocumentId");


--
-- Name: reconciliation_matches_status_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX reconciliation_matches_status_idx ON accounting.reconciliation_matches USING btree (status);


--
-- Name: supplier_registry_countryCode_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "supplier_registry_countryCode_idx" ON accounting.supplier_registry USING btree ("countryCode");


--
-- Name: supplier_registry_supplierType_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX "supplier_registry_supplierType_idx" ON accounting.supplier_registry USING btree ("supplierType");


--
-- Name: supplier_registry_vatNumber_key; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX "supplier_registry_vatNumber_key" ON accounting.supplier_registry USING btree ("vatNumber");


--
-- Name: suppliers_countryCode_vatNumber_key; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX "suppliers_countryCode_vatNumber_key" ON accounting.suppliers USING btree ("countryCode", "vatNumber");


--
-- Name: vat_reports_year_month_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX vat_reports_year_month_idx ON accounting.vat_reports USING btree (year, month);


--
-- Name: vies_reports_year_month_idx; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX vies_reports_year_month_idx ON accounting.vies_reports USING btree (year, month);


--
-- Name: accounting_document_lines accounting_document_lines_documentId_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_document_lines
    ADD CONSTRAINT "accounting_document_lines_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES accounting.accounting_documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_lines invoice_lines_invoiceId_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.invoice_lines
    ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES accounting.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_supplierId_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.invoices
    ADD CONSTRAINT "invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES accounting.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reconciliation_matches reconciliation_matches_mydataDocumentId_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.reconciliation_matches
    ADD CONSTRAINT "reconciliation_matches_mydataDocumentId_fkey" FOREIGN KEY ("mydataDocumentId") REFERENCES accounting.accounting_documents(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reconciliation_matches reconciliation_matches_pdfDocumentId_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.reconciliation_matches
    ADD CONSTRAINT "reconciliation_matches_pdfDocumentId_fkey" FOREIGN KEY ("pdfDocumentId") REFERENCES accounting.accounting_documents(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict wBW5Mra4xAhA8uJ9uOdrZy01JhjFRNDoEI15XCn5ejknf7Ydn8Lfi0qnUcmrO2A

