# AdaptLab AI

AdaptLab AI is a developer testing and resilience platform foundation for teams that depend on external systems. Phase 1 focuses on creating an explicit project map, keeping workspace configuration clear, and establishing the signal surfaces that future resilience tests will populate.

## Current implementation

- Public entry page, sign-in and workspace creation screens
- Preview-safe session persistence and protected workspace routes
- Dashboard summary with honest empty states
- Project CRUD: create, search, inspect, edit, pause, and delete
- Application type and external SUT URL validation
- API gateway health status surface
- Typed project and dashboard contracts generated from OpenAPI
- Structured server API foundation for `/api/health`, `/api/healthz`, `/api/projects`, and `/api/dashboard/summary`
- Adaptive contract builder with Low, Medium, and High profiles
- Queued test configuration with method selection and optional JSON configuration
- Phase 2 API regression coverage for CRUD, contract validation, and queued runs

Testing execution, Playwright orchestration, Groq analysis, regression comparisons, and production deployment are intentionally out of scope for Phase 2.

## Architecture

This pnpm workspace maps the requested product boundaries to the repository's shared structure:

```text
artifacts/adaptlab-ai/     React + Vite web application
artifacts/api-server/      Express API boundary (worker-compatible route surface)
lib/api-spec/              OpenAPI source of truth
lib/api-client-react/      Generated React Query client
lib/api-zod/               Generated request/response validation
lib/db/                    Drizzle/PostgreSQL package for the persistence phase
supabase/migrations/       Supabase Auth/RLS migration notes
docs/                      Product and rollout notes
```

The server currently keeps project records in memory so the foundation is usable without requiring database credentials in the preview. The persistence and Supabase Auth migration can be enabled in the next phase.

## Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` when configuring live Supabase or future AI capabilities.
3. Start the API server with `pnpm --filter @workspace/api-server run dev`.
4. Start the web app with the managed AdaptLab workflow.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL for live auth |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase browser-safe publishable key |
| `GROQ_API_KEY` | Reserved for server-side AI analysis |
| `GROQ_MODEL` | Reserved for the future analysis model |
| `CLOUDFLARE_ACCOUNT_ID` | Reserved for Worker deployment |
| `CLOUDFLARE_API_TOKEN` | Reserved for Worker deployment |

Never place `GROQ_API_KEY` or a Supabase service-role key in frontend code.

## Development commands

```bash
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/adaptlab-ai run typecheck
pnpm --filter @workspace/adaptlab-ai run build
```

## Future phases

1. Supabase Auth and PostgreSQL persistence with Row Level Security
2. Adaptive contract and test profile authoring
3. Playwright-based test execution and signal capture
4. Regression comparisons and evidence views
5. Groq-backed analysis and production Worker deployment