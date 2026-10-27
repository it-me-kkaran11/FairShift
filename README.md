# FairShift

FairShift is a worker-first workplace fairness demo for organizations with frontline teams. It brings attendance, pay, scheduling, safety reports, and workplace concerns into one application so workers and employer-side teams can review evidence and follow up on potential issues.

The project is presented around **SDG 8: Decent Work and Economic Growth**. Its examples use two synthetic organizations—Apex Infrastructure Ltd (construction) and Metropolitan Technical University (higher education)—to show how one platform can work with different industry rules.

> **Demo notice:** This is a prototype populated with synthetic data and selectable demo personas. Persona switching is not authentication, and the demo should not be used to store real employee or payroll information or make legal/compliance decisions.

## What you can explore

### Worker experience

- Review a worker dashboard, attendance history, payslips, and skills.
- Report a workplace concern and follow case progress.
- Use the demo persona selector to explore different worker and organization views.
- Choose English or Tamil for the supported interface translations.

### Employer and admin experience

- Review workforce, attendance, payroll, and workload views.
- Inspect fairness alerts and audit-ledger events.
- Manage grievance workflows, skill verification, and organization settings.
- Use the shift simulator to check proposed schedules against configured limits.

### Fairness and audit features

- Compare recorded and approved hours and flag discrepancies for review.
- Calculate transparent pay breakdowns and identify recorded overtime that has not been approved.
- Analyze overtime distribution and workload concentration.
- Check proposed schedules for excessive hours and insufficient rest.
- Record relevant changes as chronological audit-ledger events.

These are deterministic demo rules, not a substitute for local labor-law advice or a production payroll/compliance system.

## Technology

- Next.js 15 App Router and React 19
- TypeScript
- Tailwind CSS
- SQLite through Node.js's built-in `node:sqlite` API
- Vitest for tests

## Requirements

- Node.js **22.5 or later** (the app uses the built-in `node:sqlite` module)
- npm

The SQLite API is experimental in Node.js 22, so Node may print an experimental-feature warning when running the app or tests.

## Getting started

From the project directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app starts on port 3000.

The application database is stored at `data/fairshift.db`. The database module creates the data directory and initializes the schema when it first opens the database. If you need to populate or restore the synthetic demo dataset, run:

```bash
npm run seed
```

**Seeding resets and recreates the demo database.** Do not run it if you need to preserve data in `data/fairshift.db`.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server on port 3000 |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build on port 3000 |
| `npm test` | Run the Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run the configured Next.js lint command |
| `npm run seed` | Reset and repopulate the local synthetic demo database |

## Project layout

```text
src/
  app/                 App Router pages and API route handlers
  components/          Shared navigation and client-side app context
  lib/
    auth/              Demo personas and server-side session helpers
    db/                SQLite access, schema, and demo data seeding
    engine/             Fairness, payroll, workload, audit, and schedule logic
    i18n/               English and Tamil translations
  types/               Shared TypeScript data models
data/
  fairshift.db         Local SQLite database
scripts/
  seed.mjs             Demo database seed entry point
supabase/
  migrations/           Initial SQL schema reference
tests/
  fairness-engine.test.ts
```

## Main routes

| Area | Route |
| --- | --- |
| Landing page | `/` |
| Worker dashboard | `/worker` |
| Worker attendance, payslips, reports, cases, skills, and profile | `/worker/...` |
| Employer dashboard | `/employer` |
| Employer workforce, attendance, payroll, fairness, grievances, workload, skills, simulator, ledger, and settings | `/employer/...` |
| API endpoints | `/api/...` |

## Development notes

- The SQLite database module is server-only. Browser components should import client-safe constants (for example, demo personas) from `src/lib/auth/personas.ts`, not from `src/lib/auth/session.ts`, which imports the database.
- The selected persona and language are stored in browser local storage for this demo.
- The included demo API and data model are intended for local exploration, not deployment with real employee data.
