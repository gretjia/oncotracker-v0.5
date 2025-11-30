-- supabase/migrations/20251130_init_mcode.sql

-- Enable necessary extensions if not already enabled (e.g., for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- -------------------------------------------------
-- Table: patients (mCODE: Patient)
-- Represents demographic and identifying information.
-- -------------------------------------------------
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Identifiers
    mrn TEXT UNIQUE NOT NULL, -- Medical Record Number

    -- Demographics
    family_name TEXT NOT NULL,
    given_name TEXT NOT NULL,
    date_of_birth DATE,
    biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'other', 'unknown')),
    address_city TEXT,
    address_province TEXT,
    country TEXT DEFAULT 'China',
    active BOOLEAN DEFAULT TRUE
);

-- -------------------------------------------------
-- Table: observations (mCODE: Observation)
-- Represents measurements such as lab results, vital signs, or tumor markers.
-- -------------------------------------------------
CREATE TABLE public.observations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timing
    effective_datetime TIMESTAMPTZ NOT NULL,

    -- Type of observation
    category TEXT CHECK (category IN ('laboratory', 'vital-signs', 'imaging', 'tumor-marker', 'procedure', 'event')),
    code TEXT NOT NULL, -- e.g., LOINC code for the specific test (e.g., CEA level)
    code_display TEXT NOT NULL, -- Human readable name
    status TEXT CHECK (status IN ('preliminary', 'final', 'amended', 'cancelled')),

    -- Result (Stored flexibly)
    value_quantity NUMERIC,
    value_unit TEXT,
    value_string TEXT, -- For non-numeric results or ranges
    interpretation TEXT CHECK (interpretation IN ('High', 'Low', 'Normal', 'Abnormal'))
);

-- -------------------------------------------------
-- Table: conditions (mCODE: PrimaryCancerCondition)
-- Represents the cancer diagnosis and staging.
-- -------------------------------------------------
CREATE TABLE public.conditions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    clinical_status TEXT CHECK (clinical_status IN ('active', 'recurrence', 'relapse', 'remission', 'resolved')),
    condition_type TEXT NOT NULL CHECK (condition_type IN ('primary', 'secondary')),
    date_of_diagnosis DATE,
    
    diagnosis_code TEXT NOT NULL, -- e.g., ICD-10
    diagnosis_display TEXT NOT NULL,
    body_site TEXT,
    histology_morphology_behavior TEXT, -- ICD-O-3 or description
    stage_tnm_clinical TEXT -- Clinical Staging (e.g., cT2N1M0)
);


-- -------------------------------------------------
-- Security: Enable Row Level Security (RLS)
-- -------------------------------------------------
-- Note: Specific RLS policies must be defined based on user roles before production use.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------
-- Indexes for performance
-- -------------------------------------------------
CREATE INDEX idx_observations_patient_id ON public.observations(patient_id);
CREATE INDEX idx_conditions_patient_id ON public.conditions(patient_id);
CREATE INDEX idx_observations_category_date ON public.observations(category, effective_datetime DESC);
