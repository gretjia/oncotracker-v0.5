# Changelog

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
