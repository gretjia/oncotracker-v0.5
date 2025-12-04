# Remediation Plan (OncoTracker v0.5)

## Critical (lock down data + secrets)
- Gate `/api/data/current` and `/api/agent/run` with Supabase auth + role checks; return 401/403 when not doctor/supervisor. Add middleware guard or server actions wrapper. (Files: `app/api/data/current/route.ts`, `app/api/agent/run/route.ts`, `lib/supabase/server.ts` usage.)
- Stop using the Supabase service-role client in unauthenticated flows. For dataset lookup, switch to user-scoped clients or move the lookup to a server action that runs only after auth+role validation. (File: `lib/data-loader.ts`.)
- Remove secret metadata logging from Qwen model init; never log API key presence/length. (File: `lib/ai/model.ts`.)
- Add PHI guardrails before any LLM call: redact patient identifiers, require an explicit feature flag/consent, and short-circuit if missing. Apply to chat assistant and ingestion mapping. (Files: `components/ChatInterface.tsx`, `app/actions/upload-data.ts`, `lib/ai/agents/*`.)

## Security hygiene (accounts + storage)
- Replace deterministic patient passwords (`Patient${MRN}!`) with generated strong random passwords or magic-link flow; never show MRN-based credentials. (File: `app/actions/patient-actions.ts`.)
- Avoid writing patient files to `process.cwd()/data` in production; store in Supabase Storage or a secure bucket keyed by patientId with RLS/ACL. Ensure reads/writes are authenticated and audited. (Files: `lib/data-loader.ts`, `app/actions/patient-actions.ts` save path.)
- Add rate limiting to API routes that invoke LLMs or data fetches to prevent cost/DoS.

## Stability & UX
- Guard against short/empty datasets before accessing `rows[2]` in chat context building; show a friendly “no data” state instead of throwing. (File: `components/ChatInterface.tsx`.)
- Improve error handling for uploads/mapping: surface mapping/validation errors to the UI and block saving when schema validation fails. (Files: `app/actions/upload-data.ts`, `app/actions/patient-actions.ts`.)
- Add lightweight observability: structured logs without secrets, and analytics for LLM call volume/failures.

## Canonical schema rigor
- Enforce canonical schema validation on load as well as ingest; refuse to render journey when headers/rows are malformed, and display actionable errors. (Files: `lib/schema/oncology-dataset.schema.ts`, `lib/data-loader.ts`, `components/PatientJourneyVisualizer.tsx`.)
- Expand unit/threshold handling so alerts match schema definitions; include unit display in chart legend and chat responses.

## Testing & hardening
- Add integration tests for secured routes (authz), dataset loading, and chat handler with/without data. (Testing harness in `oncotracker-next`; add vitest/playwright as needed.)
- Add smoke tests for ingestion mapping (happy path + malformed input) to prevent regressions in LLM prompt glue.
- Set up env config validation (zod) to ensure required secrets/URLs are present before boot.
