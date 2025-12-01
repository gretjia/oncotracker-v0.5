# OncoTracker Next

Advanced patient journey visualization and management platform for modern oncology care.

## Features

- **Patient Journey Visualizer**: Interactive timeline of treatments, events, and metrics.
- **Generative UI Assistant**: Data-aware chatbot that analyzes patient metrics and controls the visualization.
- **Data Management**:
  - Excel-like spreadsheet interface for editing data.
  - Intelligent file ingestion with AI column mapping.
- **Role-Based Access Control (RBAC)**:
  - **Patient Portal**: View personal journey and records.
  - **Provider Portal**: Manage assigned patients and treatment plans.
  - **Supervisor Dashboard**: Approve users and oversee system operations.

## Getting Started

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Set Up Environment Variables**:
    Create a `.env.local` file with the following:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    QWEN_API_KEY=your_qwen_api_key
    ```

3. **Run Development Server**:

    ```bash
    npm run dev
    ```

4. **Open Application**:
    Navigate to [http://localhost:3000](http://localhost:3000).

## Initial User Accounts

For development and testing, the following accounts are available via mock authentication:

### Doctor Account

- **Email**: `scix@oncotracker.com`
- **Password**: `Zx987@`
- **Access**: Doctor Dashboard with patient "张莉 (Zhang Li)"

### Patient Account

- **Email**: `zhangli@oncotracker.com`
- **Password**: *(any password works in demo mode)*
- **Access**: Patient Dashboard showing Dr. SciX as assigned doctor

### Supervisor Account

- **Email**: `admin@oncotracker.com`
- **Password**: `OncoSciX@`
- **Access**: Supervisor Dashboard for user management

> **Note**: For production deployment, use `scripts/seed_users.sql` to create these users in Supabase with proper authentication.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
  - `journey/`: Patient Journey Visualizer.
  - `manage-data/`: Data management tools.
  - `dashboard/`: Role-specific dashboards (Patient, Doctor, Supervisor).
  - `auth/`: Login and Register pages.
  - `api/`: Backend API routes (Agents, Ingestion).
- `components/`: Reusable UI components (Visualizer, Chat, Spreadsheet).
- `lib/`: Utilities, types, and AI agents.
- `scripts/`: Utility scripts (Database seeding, testing).
- `supabase/`: Database migrations and types.
- `MASTERPLAN.md`: Comprehensive project vision and roadmap.
- `CHANGELOG.md`: Detailed version history.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Visualization**: D3.js
- **AI**: Vercel AI SDK, Qwen-72B
- **Database**: Supabase (PostgreSQL)

## License

Private and Confidential.

---

## Legacy Prototype (HTML Version)

The project originated as a single-file HTML prototype (`oncotracker v0.6.2.html`). This version is still available in the root directory for reference.

### Legacy Features (Ported to Next.js)

- **Timeline Visualization**: Interactive D3.js chart showing treatment cycles over time.
- **Metric Tracking**: Visualizes key tumor markers (CEA, CA19-9, etc.) with dual-axis support.
- **Event Logging**: Markers for surgeries, imaging, and other clinical events.
- **Scheme Details**: Detailed breakdown of chemotherapy regimens.
- **Responsive Design**: Tailwind CSS for a clean, modern UI.

### Legacy Usage

```bash
# Update the HTML with a new dataset
./update_data.sh

# Open the application
open "oncotracker v0.6.2.html"
```
