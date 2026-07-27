# 🏛️ MobileRepairs myDATA Helper

> **Αυτοματοποίηση Ελληνικού myDATA (ΑΑΔΕ) & VIES για Επεξεργασία Τιμολογίων**
>
> Εφαρμογή Next.js 15 που αυτοματοποιεί την Ελληνική φορολογική συμμόρφωση: εξαγωγή δεδομένων από PDF → ταξινόμηση με AI → αναφορά myDATA/VIES.

---

## 🎯 Τι κάνει

| Πρόβλημα | Λύση |
|----------|------|
| **Χειροκίνητη καταχώριση** | Ανέβασμα PDF → AI εξάγει δομημένα δεδομένα |
| **Ελληνική φορολογική πολυπλοκότητα** | Rule engine εφαρμόζει κατηγορίες myDATA/VIES αυτόματα |
| **Αναφορά VIES Φ5** | Αυτόματη ομαδοποίηση ανά χώρα/ΑΦΜ → CSV/Excel export |
| **Έλεγχος ΦΠΑ (Φ2)** | Dashboard με αθροίσματα 364, 365, 361, reverse charge |
| **Μάθηση από διορθώσεις** | Διορθώσεις χρήστη → Supplier Registry μαθαίνει για επόμενη φορά |

---

## 🏗️ Αρχιτεκτονική

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

## 📊 Ελληνικές Φορολογικές Κατηγορίες (4 Τύποι)

| Κατηγορία | myDATA Τύπος | ΦΠΑ | VIES Στήλη | Παραδείγματα |
|-----------|-------------|-----|------------|--------------|
| **EU Goods** | `14.1` | 0% | **Στ 5** (Αγαθά) | Marseus Computer Kft. |
| **EU Services (Reverse Charge)** | `14.3` | 0% | **Στ 7** (Υπηρεσίες) | Google, Hetzner, OpenAI |
| **OSS (24% Ελλ. ΦΠΑ)** | `14.3`/`11.4` | **24%** | **ΕΞΑΙΡΕΤΑΙ** | Google Commerce |
| **Domestic GR** | `1.1` | 24% | **ΕΞΑΙΡΕΤΑΙ** | BOX NOW, ENTERSOFT |

> ⚠️ **Κανόνες που επιβάλλονται**: Τα αγαθά ποτέ στη VIES Στ 7, OSS εξαιρείται από VIES, πρόθεμα ΦΠΑ = κωδικός χώρας.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/makpapad/14-MobileRepairs-myDATA-Helper.git
cd 14-MobileRepairs-myDATA-Helper

# 2. Install
npm install

# 3. Πρώτη φορά: Δημιουργία τοπικής DB + sample data
npx prisma migrate dev --name init
npx prisma db seed          # 7 suppliers, 5 invoices pre-loaded

# 4. Run dev server
npm run dev                 # http://localhost:3000
```

> **Σημείωση:** Το SQLite `dev.db` δημιουργείται τοπικά (δεν είναι στο git). Κάθε developer δημιουργεί τη δική του μέσω migrations.

---

## 🔑 Environment Variables

```env
# .env (δημιουργήστε από .env.example)
DATABASE_URL="file:./dev.db"           # SQLite για dev
GEMINI_API_KEY="your-gemini-key"       # Για AI PDF extraction

# Production (όταν είστε έτοιμοι)
# DATABASE_URL="postgresql://user:***@host:5432/db?schema=accounting"
# MYDATA_API_URL="https://mydata-prod.azure-api.net"
# MYDATA_API_KEY="your-mydata-key"
```

---

## 📱 Κύριες Σελίδες

| Σελίδα | URL | Σκοπός |
|-------|-----|---------|
| **Dashboard** | `/` | Επισκόπηση + πρόσφατα τιμολόγια + VIES αθροίσματα |
| **Λίστα Τιμολογίων** | `/invoices` | Φιλτράρισμα ανά μήνα, status, VIES, reverse charge |
| **Ανέβασμα PDF** | `/invoices/upload` | Drag & drop πολλαπλών PDF |
| **Λεπτομέρειες** | `/invoices/[id]` | Επεξεργασία, έγκριση, αποκλεισμός, προβολή πρότασης myDATA |
| **VIES Report (Φ5)** | `/reports/vies` | Ομαδοποιημένο ανά χώρα/ΑΦΜ → CSV/Excel export |
| **VAT Report (Φ2)** | `/reports/vat` | 364, 365, 361, reverse charge, μη συμμετέχοντα |

---

## 🤖 AI Integration (Gemini 2.5 Flash)

```bash
# Set your API key in .env
GEMINI_API_KEY="your-key-from-ai.google.dev"

# Endpoints
POST /api/gemini-extract      # Extract JSON από PDF
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

## 🧠 Supplier Registry (Μάθηση)

Όταν διορθώνετε την ταξινόμηση ενός τιμολογίου:
1. **Μονό**: `POST /api/learn-correction` - μαθαίνει από ένα τιμολόγιο
2. **Batch**: `POST /api/batch-learn` - μαθαίνει από πολλά ταυτόχρονα

Επόμενη φορά που εμφανίζεται ο ίδιος προμηθευτής → αυτοσυμπλήρωση με τη διδαγμένη ταξινόμηση.

---

## 📦 API Endpoints

| Endpoint | Method | Περιγραφή |
|----------|--------|-----------|
| `/api/invoices/upload` | POST | Ανέβασμα PDFs → extract → classify → save |
| `/api/invoices/[id]` | GET/PATCH/DELETE | CRUD για ένα τιμολόγιο |
| `/api/classify` | POST | Test ταξινόμησης χωρίς upload |
| `/api/gemini-extract` | POST | Μόνο AI PDF extraction |
| `/api/learn-correction` | POST | Μάθηση από μία διόρθωση |
| `/api/batch-learn` | POST | Μάθηση από batch διορθώσεις |
| `/api/mydata-submit` | POST | Υποβολή εγκεκριμένων στο myDATA (stub) |
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
| **Validation** | Zod schemas με Ελληνικούς φορολογικούς κανόνες |
| **PDF Parsing** | `pdf-parse` + Gemini OCR |
| **Export** | `xlsx` για Excel, CSV για VIES |
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

- **AADE myDATA** - Ελληνικές προδιαγραφές API φορολογίας
- **Google Gemini** - Multimodal κατανόηση PDF
- **Prisma** - Type-safe database access
- **Next.js Team** - React framework

---

*Χτισμένο για Ελληνικές επιχειρήσεις κινητών που διαχειρίζονται διασυνόρια EU τιμολόγια. Αυτοματοποιήστε τη γραφειοκρατία, εστιάστε στις επισκευές.* 🔧📱