# Changelog

## [v0.7.1] - 2025-12-03

### Added

- **Data Standardization**:
  - **Canonical Schema**: Established `张莉.xlsx` as the canonical data structure for all patient uploads.
  - **Metric Dictionary**: Created `lib/schema/metric-dictionary.ts` with bilingual (Chinese/English) metric definitions.
  - **Schema Validation**: Added Zod-based validation in `lib/schema/oncology-dataset.schema.ts`.
  - **Data Transformer**: New `lib/schema/data-transformer.ts` to convert any uploaded data to canonical format.
  - **Migration Script**: Added `scripts/migrate-to-canonical.ts` for batch migration of existing files.

- **Custom Metrics Support**:
  - AI now preserves **unknown/custom metrics** (e.g., "细胞角蛋白19片段") with `category: "CUSTOM"`.
  - Added CYFRA21-1, NSE, SCC to the predefined metric dictionary.
  - Chart displays custom metrics under "其他指标" (Other Metrics) category.

- **AI Prompt Redesign**:
  - New centralized prompts in `lib/ai/prompts/data-mapping.ts`.
  - Enforces canonical schema immutability - AI transforms TO the schema, never changes it.
  - Intelligent date column detection (looks for Excel serial dates 40000-50000).
  - Explicit column index mapping for precision.

### Fixed

- **Patient Data Loading**: Fixed issue where wrong patient's data was displayed. Now correctly loads by `patientId` from URL.
- **MRD Data Not Visible**: X-axis domain now includes metric data point dates (not just phases/events).
- **Format Detection**: Fixed canonical format detection to check Chinese headers ("子类", "项目", "处置").
- **Duplicate Column Handling**: Fixed "方案" column mapping (two columns with same name).
- **Date Parsing Crash**: Added error handling for invalid date values during upload.

### Changed

- **Visualizer Columns**: Fixed column mappings to match canonical 7-column structure (Date, Phase, Cycle, PrevCycle, Scheme, Event, SchemeDetail).
- **AI Integration**: `tryQuickMapping` now requires "子类" header to detect canonical format.

## [v0.7.0] - 2025-12-03

### Added

- **Mobile Optimization**:
  - **Responsive Design**: Complete overhaul of the UI to support mobile devices (iOS/Android).
  - **Collapsible Controls**: "Controls" sidebar on mobile is now collapsible with a compact bottom toolbar.
  - **Compact Metrics**: Metric buttons on mobile and desktop now use a flexible, auto-sizing layout.
  - **Touch Support**: Enabled touch interactions (pinch-to-zoom, pan) for the Patient Journey Chart.
  - **Landscape Mode**: Added PWA manifest to suggest landscape orientation for optimal viewing.
- **Unstructured Data Handling**:
  - **LLM Integration**: Integrated Qwen-72B (via Vercel AI SDK) to analyze uploaded files (Excel/CSV/JSON).
  - **Smart Mapping**: Automatically detects date columns, metrics, and events from unstructured data.
  - **Preview UI**: Added a "Data Preview" step in the "Add Patient" flow to verify AI analysis results.
- **Print Enhancements**:
  - **WYSIWYG Printing**: Chart now prints exactly as seen on screen (preserving zoom/pan).
  - **Layout Control**: Hides controls and maximizes chart area for A4 landscape printing.

### Changed

- **UI/UX**:
  - **Chat Assistant**: Now opens as a full-screen overlay on mobile for better focus.
  - **Default View**: Chat is closed by default on mobile to prioritize the chart.
  - **Floating Action Button**: Enhanced "Journey Assistant" button with label and animation.
- **Performance**: Optimized chart re-rendering logic for resize events.

## [v0.6.3] - 2025-12-01

### Added

- **Authentication**: Migrated login flow to Server Actions (`loginAction`) for secure session management.
- **Patient Management**:
  - Auto-generated Medical Record Number (MRN) during patient creation.
  - Intelligent Chinese name parsing (Pinyin transliteration) for `family_name` and `given_name`.
  - Dataset upload support (Excel/JSON/CSV) directly within the "Add Patient" form.
  - "Delete Patient" functionality with confirmation dialog.
- **Doctor Dashboard**:
  - Enhanced "Edit Data" button with text label.
  - Added verbose logging for debugging data fetching issues.

### Fixed

- **Security**: Resolved "Infinite Recursion" error in Row Level Security (RLS) policies by implementing a `SECURITY DEFINER` helper function.
- **Database**: Fixed "Foreign Key Constraint" error by ensuring doctor records exist for authenticated users.
- **UI/UX**: Fixed React "controlled input" warning in `PatientJourneyVisualizer`.
- **Bugs**: Fixed "deletePatientAction is not a function" error by correctly exporting the server action.

### Changed

- **Documentation**: Updated `MASTERPLAN.md` to reflect completed Phase 2 tasks.
