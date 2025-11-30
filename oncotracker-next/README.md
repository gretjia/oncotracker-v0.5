# OncoTracker Next

Advanced patient journey visualization and management platform for modern oncology care.

## Features

- **Patient Journey Visualizer**: Interactive timeline of treatments, events, and metrics.
- **Generative UI Assistant**: Chat with your data using AI to uncover insights.
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
- `components/`: Reusable UI components (Visualizer, Chat, Spreadsheet).
- `lib/`: Utilities, types, and AI agents.
- `supabase/`: Database migrations and types.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Visualization**: D3.js
- **AI**: Vercel AI SDK, Qwen-72B
- **Database**: Supabase (PostgreSQL)

## License

Private and Confidential.
