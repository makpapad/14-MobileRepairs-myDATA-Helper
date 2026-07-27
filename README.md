# 🏛️ MobileRepairs myDATA Helper

> **Greek myDATA (AADE) & VIES Automation for Invoice Processing**
> 
> A Next.js 15 application that automates Greek tax compliance: PDF invoice extraction → AI classification → myDATA/VIES reporting.

---

## 🎯 What This Does

| Problem | Solution |
|---------|----------|
| **Manual invoice entry** | Upload PDFs → AI extracts structured data |
| **Greek tax complexity** | Rule engine applies myDATA/VIES categories automatically |
| **VIES Φ5 reporting** | Auto-groups by country/VAT → CSV/Excel export |
| **VAT audit (Φ2)** | Dashboard with 364, 365, 361, reverse charge totals |
| **Learning from corrections** | User fixes → Supplier Registry learns for next time |

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Upload    │────▶│  Gemini 2.5 Flash │────▶│  Classification  │────▶│   Database +     │
│   PDFs      │     │  (OCR + Extract)  │     │  Engine (Rules)  │     │  UI Dashboard    │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
                           │                        │                       │
                    Structured JSON          4 Categories:              SQLite/PostgreSQL
                    (validated by Zod)       EU Goods / EU Services /     + Prisma ORM
                                             OSS 24% / Domestic GR      + Next.js 15 UI
```

---

## 📊 Greek Tax Categories (4 Types)

| Category | myDATA Type | VAT | VIES Column | Examples |
|----------|-------------|-----|-------------|----------|
| **EU Goods** | `14.1` | 0% | **Col 5** (Goods) | Marseus Computer Kft. |
| **EU Services (Reverse Charge)** | `14.3` | 0% | **Col 7** (Services) | Google, Hetzner, OpenAI |
| **OSS (24% Greek VAT)** | `14.3`/`11.4` | **24%** | **EXCLUDED** | Google Commerce |
| **Domestic GR** | `1.1` | 24% | **EXCLUDED** | BOX NOW, ENTERSOFT |

> ⚠️ **Rules enforced**: Goods never in VIES Col 7, OSS excluded from VIES, VAT prefix = country code.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/makpapad/14-MobileRepairs-myDATA-Helper.git
cd 14-MobileRepairs-myDATA-Helper

# 2. Install
npm install

# 3. First time: create local DB + seed data
npx prisma migrate dev --name init
npx prisma db seed          # 7 suppliers, 5 invoices pre-loaded

# 4. Run dev server
npm run dev                 # http://localhost:3000
```

> **Note:** SQLite `dev.db` is created locally (not in git). Each developer gets their own via migrations.

---

## 🔑 Environment Variables

```env
# .env (create from .env.example)
DATABASE_URL="file:./dev.db"          # SQLite for dev
GEMINI_API_KEY="your-gemini-key"      # For AI PDF extraction

# Production (when ready)
# DATABASE_URL="postgresql://user:pass@host:5432/db?schema=accounting"
# MYDATA_API_URL="https://mydata-prod.azure-api.net"
# MYDATA_API_KEY="your-mydata-key"
```

---

## 📱 Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| **Dashboard** | `/` | Overview + recent invoices + VIES totals |
| **Invoices List** | `/invoices` | Filter by month, status, VIES, reverse charge |
| **Upload PDFs** | `/invoices/upload` | Drag & drop multiple PDFs |
| **Invoice Detail** | `/invoices/[id]` | Edit, approve, exclude, view myDATA proposal |
| **VIES Report (Φ5)** | `/reports/vies` | Grouped by country/VAT → CSV/Excel export |
| **VAT Report (Φ2)** | `/reports/vat` | 364, 365, 361, reverse charge, non-participating |

---

## 🤖 AI Integration (Gemini 2.5 Flash)

```bash
# Set your API key in .env
GEMINI_API_KEY="your-key-from-ai.google.dev"

# Endpoints
POST /api/gemini-extract      # Extract JSON from PDF
POST /api/invoices/upload     # Upload → Extract → Classify → Save
```

**Extraction Output** (validated by Zod):
```json
{
  "supplierName": "Marseus Computer Kft.",
  "supplierVat": "12648797",
  "supplierCountry": "HU",
  "invoiceNumber": "S26/02681",
  "invoiceDate": "2026-06-23",
  "netAmount": 555.00,
  "vatAmount": 0.00,
  "grossAmount": 555.00,
  "vatRate": 0,
  "isReverseCharge": false,
  "mydataInvoiceType": "14.1",
  "expenseCategory": "2.1 Αγορές Εμπορευμάτων",
  "e3Code": "E3_102_004",
  "vatClassification": "364-Φ2",
  "viesEligible": true,
  "viesColumn": "5_GOODS"
}
```

---

## 🧠 Supplier Registry (Learning)

When you correct an invoice classification:
1. **Single**: `POST /api/learn-correction` - learns from one invoice
2. **Batch**: `POST /api/batch-learn` - learns from multiple at once

Next time same supplier appears → auto-filled with learned classification.

---

## 📦 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices/upload` | POST | Upload PDFs → extract → classify → save |
| `/api/invoices/[id]` | GET/PATCH/DELETE | CRUD for single invoice |
| `/api/classify` | POST | Test classification without upload |
| `/api/gemini-extract` | POST | AI PDF extraction only |
| `/api/learn-correction` | POST | Learn from single correction |
| `/api/batch-learn` | POST | Learn from batch corrections |
| `/api/mydata-submit` | POST | Submit approved to myDATA (stub) |
| `/api/reports/vies` | GET | VIES Φ5 export (CSV/Excel) |

---

## 🧪 Testing & Quality

```bash
npm test              # 7 classification tests (all pass)
npm run lint          # ESLint clean
npm run build         # Production build (11 routes)
```

**Test Coverage**: Google Ads, Workspace, OpenAI, Hetzner, Marseus, Google One, BOX NOW

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | SQLite (dev) / PostgreSQL (prod) + Prisma ORM |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Validation** | Zod schemas with Greek tax business rules |
| **PDF Parsing** | `pdf-parse` + Gemini OCR |
| **Export** | `xlsx` for Excel, CSV for VIES |
| **UI** | Tailwind CSS 4 + custom components |
| **Testing** | Vitest |

---

## 📁 Project Structure

```
├── app/
│   ├── api/                    # API Routes
│   │   ├── invoices/           # CRUD + upload
│   │   ├── classify/           # Test classification
│   │   ├── gemini-extract/     # AI PDF extraction
│   │   ├── learn-correction/   # Single learning
│   │   ├── batch-learn/        # Batch learning
│   │   ├── mydata-submit/      # myDATA submission
│   │   └── reports/            # VIES/VAT exports
│   ├── invoices/               # Invoice pages
│   └── reports/                # Report pages
├── prisma/
│   ├── schema.prisma           # Active schema (SQLite)
│   ├── schema.sqlite.prisma    # SQLite template
│   ├── seed.ts                 # Sample data
│   └── migrations/             # Migration history
├── src/lib/
│   ├── classification/         # Rule engine (4 categories)
│   ├── validation/             # Zod schemas
│   ├── gemini/                 # AI extraction
│   ├── invoices/               # Business logic
│   ├── pdf/                    # PDF parsing
│   ├── reports/                # VIES/VAT builders
│   └── db/                     # Prisma + queries
├── scripts/
│   ├── switch-db.sh            # Linux/Mac DB switcher
│   └── switch-db.bat           # Windows DB switcher
└── DAILY_COMMANDS.md           # Developer cheatsheet
```

---

## 🔄 Switching Databases

```bash
# Development (SQLite - default)
./scripts/switch-db.sh sqlite

# Production (PostgreSQL)
./scripts/switch-db.sh postgres
# Then: npx prisma migrate deploy
```

---

## 📚 Documentation

- **[DAILY_COMMANDS.md](DAILY_COMMANDS.md)** - Developer cheatsheet
- **[Docs/gemini-code-...md](Docs/gemini-code-1785152333367.md)** - AI classification rules
- **[Docs/mobilerepairs_export.sql](Docs/mobilerepairs_export.sql)** - Full SQL schema export

---

## 🤝 Contributing

```bash
git checkout -b feature/amazing-feature
# Make changes
npm test && npm run lint && npm run build
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
# Open PR
```

---

## 📄 License

ISC License - Feel free to use for Greek tax compliance automation.

---

## 🙏 Acknowledgments

- **AADE myDATA** - Greek tax authority API specifications
- **Google Gemini** - Multimodal PDF understanding
- **Prisma** - Type-safe database access
- **Next.js Team** - React framework

---

*Built for Greek mobile repair businesses handling cross-border EU invoices. Automate the bureaucracy, focus on the repairs.* 🔧📱