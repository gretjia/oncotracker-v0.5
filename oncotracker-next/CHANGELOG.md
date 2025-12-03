# Changelog

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
