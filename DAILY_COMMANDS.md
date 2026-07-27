# 📋 Daily Usage Commands - MobileRepairs myDATA Helper

## 🚀 Quick Start

```bash
# Clone & Setup
git clone https://github.com/makpapad/14-MobileRepairs-myDATA-Helper.git
cd 14-MobileRepairs-myDATA-Helper
npm install
npm run dev          # → http://localhost:3000
```

---

## 🗄️ Database Commands

### Development (SQLite)
```bash
# Start dev server
npm run dev

# Database management
npx prisma studio          # Visual DB editor at http://localhost:5555
npx prisma db seed         # Load sample data (7 suppliers, 5 invoices)
npx prisma migrate dev --name <migration_name>  # Create new migration
npx prisma validate        # Validate schema
npx prisma generate        # Regenerate Prisma Client
```

### Switch to PostgreSQL (Production)
```bash
# Linux/Mac
./scripts/switch-db.sh postgres

# Windows
scripts\switch-db.bat postgres

# Then run migrations
npx prisma migrate deploy
```

### Switch Back to SQLite (Development)
```bash
./scripts/switch-db.sh sqlite
# or
scripts\switch-db.bat sqlite
```

---

## 🧪 Quality Assurance

```bash
# Run tests (7 classification engine tests)
npm test

# Lint check
npm run lint

# Production build
npm run build

# Full CI pipeline
npm test && npm run lint && npm run build
```

---

## 📁 Project Structure

```
14-MobileRepairs-myDATA-Helper/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   │   ├── invoices/      # CRUD + upload
│   │   ├── classify/      # Test classification
│   │   ├── gemini-extract/# AI PDF extraction
│   │   ├── learn-correction/  # Single correction learning
│   │   ├── batch-learn/   # Batch correction learning
│   │   ├── mydata-submit/ # myDATA API submission
│   │   └── reports/       # VIES/VAT exports
│   ├── invoices/          # Invoice pages
│   └── reports/           # Dashboard pages
├── prisma/
│   ├── schema.prisma      # Active schema (SQLite)
│   ├── schema.sqlite.prisma
│   ├── seed.ts            # Sample data
│   └── migrations/        # Migration history
├── src/
│   ├── lib/
│   │   ├── classification/  # Rule engine (4 categories)
│   │   ├── validation/      # Zod schemas
│   │   ├── gemini/          # AI extraction
│   │   ├── invoices/        # Business logic
│   │   ├── pdf/             # PDF parsing
│   │   ├── reports/         # VIES/VAT builders
│   │   └── db/              # Prisma + queries
│   └── test/                # Vitest tests
└── scripts/
    ├── switch-db.sh         # Linux/Mac DB switcher
    └── switch-db.bat        # Windows DB switcher
```

---

## 🌐 Key URLs

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Overview + recent invoices |
| Invoices List | `/invoices` | Filterable table (VIES, status, etc.) |
| Upload PDFs | `/invoices/upload` | Drag & drop multiple PDFs |
| Invoice Detail | `/invoices/[id]` | Edit, approve, classify |
| VIES Report | `/reports/vies` | Φ5 export (CSV/Excel) |
| VAT Report | `/reports/vat` | VAT audit dashboard |

---

## 📊 Classification Rules (4 Categories)

| Category | myDATA Type | VAT | VIES Column | Example Suppliers |
|----------|-------------|-----|-------------|-------------------|
| **EU Goods** | `14.1` | 0% | Col 5 (Goods) | Marseus Computer Kft. |
| **EU Services** | `14.3` | 0% (Reverse) | Col 7 (Services) | Google, Hetzner, OpenAI |
| **OSS (24% VAT)** | `14.3`/`11.4` | 24% | **Excluded** | Google Commerce |
| **Domestic GR** | `1.1` | 24% | **Excluded** | BOX NOW, ENTERSOFT |

---

## 🤖 AI Integration (Gemini 2.5 Flash)

```bash
# Set API key in .env
GEMINI_API_KEY="your-key-here"

# Endpoints
POST /api/gemini-extract    # Extract structured data from PDFs
POST /api/invoices/upload   # Upload + AI extract + classify + save
```

---

## 📥 Import/Export

```bash
# VIES Report (Φ5)
GET /api/reports/vies?month=6&year=2026&format=csv
GET /api/reports/vies?month=6&year=2026&format=xlsx

# VAT Report data
GET /reports/vat?month=6&year=2026
```

---

## 🔧 Environment Variables (.env)

```env
# Database (auto-switched by scripts)
DATABASE_URL="file:./dev.db"

# AI Extraction
GEMINI_API_KEY="your-gemini-api-key"

# myDATA Production (when ready)
MYDATA_API_URL="https://mydata-prod.azure-api.net"
MYDATA_API_KEY="your-mydata-key"
MYDATA_USER_ID="your-user-id"
```

---

## 🐛 Troubleshooting

```bash
# Reset database completely
rm -rf prisma/migrations dev.db
npx prisma migrate dev --name init

# Regenerate Prisma Client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run build

# Check Prisma schema
npx prisma validate
```

---

## 📝 Git Workflow

```bash
# Feature branch
git checkout -b feature/amazing-feature

# Commit with conventional messages
git commit -m "feat: add new classification rule for supplier X"

# Push & PR
git push origin feature/amazing-feature
# Create PR on GitHub
```

---

## 📚 Documentation Links

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma SQLite](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [myDATA Developer Portal](https://www.aade.gr/mydata/developers)
- [Gemini API](https://ai.google.dev/docs)

---

*Last updated: 2025-07-27*
*Project: MobileRepairs myDATA Helper*
*Repository: https://github.com/makpapad/14-MobileRepairs-myDATA-Helper*