# Changelog

All notable changes to OncoTracker Next will be documented in this file.

## [Unreleased]

### Added - Phase 7: Authentication & RBAC (2024-11-30)

#### Database Schema

- Created Supabase migration for authentication and RBAC system
- Added `user_role` ENUM type (patient, doctor, supervisor)
- Created `profiles`, `doctors`, and `patients` tables with proper relationships
- Implemented Row Level Security (RLS) policies for data access control
- Added `handle_new_user` trigger for automatic profile creation

#### Authentication Flow

- **Landing Page** (`/`): Modern dual-portal design
  - Patient Portal with login/registration
  - Doctor Portal with login/registration
  - Supervisor access link
- **Login Page** (`/auth/login`): Role-specific authentication
  - Mock authentication for development
  - Hardcoded credentials for initial users
- **Register Page** (`/auth/register`): Role-specific registration forms
  - Patient: MRN, DOB, Gender fields
  - Doctor: Specialty, License Number fields

#### Dashboards

- **Patient Dashboard** (`/dashboard/patient`):
  - Profile information display
  - Assigned doctor information
  - Journey visualizer access
  - Upcoming appointments
  - Recent documents
- **Doctor Dashboard** (`/dashboard/doctor`):
  - Assigned patients list
  - Patient search functionality
  - Quick access to patient journeys
- **Supervisor Dashboard** (`/dashboard/supervisor`):
  - System statistics (patients, doctors, pending approvals)
  - User approval queue
  - Approve/reject functionality for new registrations

#### Initial User Setup

- Doctor "SciX" (<scix@oncotracker.com>)
- Patient "张莉" (<zhangli@oncotracker.com>) assigned to Dr. SciX
- Supervisor "Admin" (<admin@oncotracker.com>)
- SQL seed script for production deployment

### Added - Phase 6: Data Management (2024-11-29)

#### Data Management Features

- **Manage Data Page** (`/manage-data`):
  - Excel-like spreadsheet interface for data viewing/editing
  - File upload functionality
  - AI-powered column mapping
- **Data Spreadsheet Component**: Interactive grid with zebra striping
- **Upload Data Server Action**: Handles file processing and AI mapping
- **AI Column Mapper**: Intelligent mapping of uploaded data to formal dataset schema

### Added - Phase 5: Patient Journey & Generative UI (2024-11-28)

#### Core Features

- **Patient Journey Visualizer**: Pixel-perfect port from HTML version
  - D3.js-based interactive timeline
  - Rainbow phase backgrounds
  - Event markers and metric curves
  - Comprehensive controls (zoom, opacity, toggles)
- **Journey Explainer Agent**: AI-powered journey analysis
- **Chat Interface**: Generative UI for data interaction
- **Data Loader**: Excel dataset parsing and processing

### Added - Phase 4: AI Agent Foundation (2024-11-27)

#### AI Infrastructure

- Configured Qwen via Vercel AI SDK
- Implemented unified agent runtime (`/api/agent/run`)
- Created Ingestion Agent with Zod schema validation
- Set up directory structure for agents, tools, and prompts

## Initial Setup (2024-11-26)

### Project Initialization

- Created Next.js 16 project with TypeScript
- Configured Tailwind CSS and Shadcn UI
- Set up Supabase integration
- Established project structure and conventions
