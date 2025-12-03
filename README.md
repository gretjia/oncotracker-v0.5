# OncoTracker

![Version](https://img.shields.io/badge/version-v0.7.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-Private-red)

**A professional oncology patient journey management system** for visualizing cancer treatment timelines, clinical metrics, and tumor marker trends.

<p align="center">
  <img src="https://img.shields.io/badge/D3.js-Visualization-orange" />
  <img src="https://img.shields.io/badge/Supabase-Backend-green" />
  <img src="https://img.shields.io/badge/AI-Qwen_72B-purple" />
</p>

---

## 🎯 Overview

OncoTracker transforms complex oncology data into intuitive visual timelines, enabling clinicians to:

- **Track Treatment Journeys** — Visualize chemotherapy cycles, surgeries, and clinical events
- **Monitor Tumor Markers** — CEA, CA19-9, CA125, MRD, and custom metrics with threshold alerts
- **AI-Powered Data Ingestion** — Upload any Excel format; AI automatically maps to standardized schema
- **Multi-Patient Management** — Role-based access for doctors, patients, and supervisors

---

## 🏗️ Architecture

```
oncotracker v0.5/
├── 📂 oncotracker-next/              # Full-stack Next.js 14 Application
│   ├── app/                          # App Router (Pages, API Routes, Server Actions)
│   │   ├── actions/                  # Server Actions (auth, patient, upload)
│   │   ├── api/                      # API Routes (agent, data)
│   │   ├── auth/                     # Login/Register pages
│   │   ├── dashboard/                # Role-based dashboards
│   │   │   ├── doctor/               # Doctor view + Add Patient
│   │   │   ├── patient/              # Patient self-view
│   │   │   └── supervisor/           # Admin overview
│   │   ├── journey/                  # Patient Journey Visualization
│   │   └── manage-data/              # Data Editor (Spreadsheet)
│   ├── components/                   # React Components
│   │   ├── PatientJourneyVisualizer.tsx  # D3.js Chart (Core)
│   │   ├── DataSpreadsheet.tsx      # Spreadsheet Editor
│   │   ├── ChatInterface.tsx         # AI Assistant
│   │   └── ui/                       # Shadcn/UI components
│   ├── lib/                          # Core Libraries
│   │   ├── ai/                       # AI Agents & Tools
│   │   │   ├── agents/               # Ingestion, Journey Explainer
│   │   │   ├── prompts/              # Centralized AI prompts
│   │   │   └── tools/                # AI tool definitions
│   │   ├── llm/                      # LLM Integration (Qwen)
│   │   ├── schema/                   # Data Standardization
│   │   │   ├── oncology-dataset.schema.ts  # Zod validation
│   │   │   ├── metric-dictionary.ts  # Bilingual metric definitions
│   │   │   └── data-transformer.ts   # Format conversion
│   │   └── supabase/                 # Database clients
│   ├── data/                         # Patient datasets (.xlsx)
│   └── scripts/                      # Migration & utility scripts
├── 📄 oncotracker v0.6.2.html        # Reference Implementation (Source of Truth)
├── 📊 dataset*.xlsx                  # Sample patient data
└── 🔧 update_data.py/sh              # Legacy data injection scripts
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (for auth & database)

### Installation

```bash
# Clone and navigate
cd "oncotracker v0.5/oncotracker-next"

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor | See `CREDENTIALS.local.md` | — |
| Patient | Auto-generated on creation | — |

---

## 🔑 Key Features

### 1. Patient Journey Visualization

The heart of OncoTracker — an interactive D3.js chart showing:

| Layer | Description |
|-------|-------------|
| **Phases** | Treatment cycles (C1, C2, AS0-AS48) with duration labels |
| **Events** | Surgeries, imaging, clinical milestones as vertical markers |
| **Metrics** | Tumor markers plotted as curves with threshold alerts |
| **Schemes** | Chemotherapy regimens displayed in phase headers |

**Controls:**
- 🔍 Zoom/Pan with mouse drag
- 📊 Toggle metrics on/off
- 🎨 Customize colors, scales, opacity
- 🖨️ Print-optimized A4 landscape output

### 2. AI-Powered Data Ingestion

Upload any Excel file — the AI handles the rest:

```
Raw Excel → AI Analysis → Canonical Format → Visualization
```

**Capabilities:**
- Automatic column detection (dates, phases, metrics)
- Chinese/English header translation
- Custom metric preservation (e.g., CYFRA21-1)
- Excel serial date conversion
- Validation against Zod schema

### 3. Canonical Data Schema

All patient data standardizes to the `张莉.xlsx` format:

| Column | Header | Description |
|--------|--------|-------------|
| A | 子类 | Date (Excel serial or ISO) |
| B | 项目 | Phase name (C1D1, AS17, etc.) |
| C | 周期 | Current cycle |
| D | — | Previous cycle |
| E | 方案 | Treatment scheme |
| F | 处置 | Clinical event |
| G | 方案 | Scheme detail |
| H+ | Metrics | Weight, CEA, MRD, etc. |

### 4. Metric Dictionary

Bilingual support with 25+ predefined metrics:

| Category | Metrics |
|----------|---------|
| **体能负荷** | Weight, Handgrip, ECOG |
| **分子负荷** | CEA, CA19-9, CA125, AFP, MRD, CYFRA21-1 |
| **影像负荷** | 肺, 肝脏, 淋巴, 盆腔 |
| **副作用** | 白细胞, 血小板, 中性粒细胞, AST, ALT |
| **其他指标** | Custom/unknown metrics preserved |

### 5. Data Management & Editing

Interactive spreadsheet editor for direct data manipulation:

**Features:**
- ✏️ **Inline Editing**: Edit any cell directly in the spreadsheet
- ➕ **Add Rows**: Insert new data rows with one click
- 📊 **Add Metrics**: Create new metric columns (automatically updates header row)
- 📤 **Import/Export**: Upload Excel files or export edited data
- 🎨 **Modern UI**: Clean, spreadsheet-like interface matching Patient Journey design

**Access:**
- Navigate to `/manage-data?patientId=<id>` from the doctor dashboard
- Or click "Edit Data" button on any patient card

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Shadcn/UI |
| **Visualization** | D3.js v7 |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **AI** | Alibaba Qwen-72B via Vercel AI SDK |
| **Validation** | Zod |

---

## 📁 Data Files

| File | Purpose |
|------|---------|
| `张莉.xlsx` | **Canonical reference** — defines standard schema |
| `高玉修.xlsx` | Patient data (after AI transformation) |
| `dataset*.xlsx` | Legacy sample datasets |

---

## 🔒 Security

- **Row-Level Security (RLS)** — Patients see only their own data
- **Role-Based Access Control** — Doctor, Patient, Supervisor roles
- **Server Actions** — Secure data mutations
- **Environment Variables** — Secrets never exposed to client

---

## 📝 Documentation

| Document | Description |
|----------|-------------|
| `CHANGELOG.md` | Version history with detailed release notes |
| `MASTERPLAN.md` | Product roadmap and architecture decisions |
| `debuglog.md` | Technical debugging log with solutions |
| `library.md` | Medical term abbreviation mappings |

---

## 🚀 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation
```

### Key Commands

```bash
# Run migration script
npx tsx scripts/migrate-to-canonical.ts

# Seed test data
npx tsx scripts/seed_data.ts

# Reset password
npx tsx scripts/reset_password.ts <email>
```

---

## 📊 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data/current` | GET | Fetch current patient dataset |
| `/api/agent/run` | POST | Execute AI agent tasks |

---

## 🎨 The Golden Rule

> **`oncotracker v0.6.2.html` is the ABSOLUTE SOURCE OF TRUTH** for:
> 1. Visual Design — Colors, layout, typography
> 2. D3.js Algorithms — Scaling, rendering, interactions
> 3. Data Processing — Parsing, cleaning, mapping
>
> **Any React development MUST be a pixel-perfect port.**

---

## 📈 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **v0.7.1** | 2025-12-03 | Canonical schema, custom metrics, AI redesign |
| **v0.7.0** | 2025-12-03 | Mobile optimization, LLM integration, print enhancements |
| **v0.6.3** | 2025-12-01 | Auth migration, patient CRUD, delete functionality |
| **v0.6.2** | 2025-11-30 | Print optimization, data automation |

See `CHANGELOG.md` for full history.

---

## 🤝 Contributing

This is a private medical application. Contact the project owner for contribution guidelines.

---

## 📜 License

Private — All rights reserved.

---

<p align="center">
  <strong>Built for Oncology. Designed for Clarity.</strong>
</p>
