# InternMatch Backend

> Deterministic mathematical matching, behavioral trap engine, and post-interview calibration backend for InternMatch.

InternMatch helps companies discover students for internships using explicit, versioned rules. The backend is built with Node.js, TypeScript, Express, and PostgreSQL. Evaluation is deterministic: the same versioned inputs and rules produce the same outputs. There is no AI or LLM evaluation, no CV/resume upload, and no free-text field in a scored evaluation.

## Product flow

1. **Admin Rule Studio** defines and versions the registration stages, closed-ended questions, trait/skill catalog, behavioral consistency checks, validation rules, and scoring rules. “Traps” are controlled, explainable consistency checks; they must not be hidden arbitrary penalties. Admin changes affect new evaluations only unless an explicit migration/recalculation is approved.
2. **Student 5-Step Registration** collects structured answers across five configurable stages. The current profile is calculated from validated answers, selected skills, and demonstrated depth. Each answer is tied to the question/rule version that produced it.
3. **Company Nested Weights** lets a company select required skills and configure weights at two levels: primary axes (Technical, Soft, Behavioral, Interest, Educational) sum to exactly 100%; within every selected axis, its sub-item weights sum to exactly 100%. Invalid configurations are rejected with HTTP 400.
4. **Post-Interview Micro-Nudge Calibration** records structured, closed-ended skill evaluations after a rejection. It evaluates only skills in `OpportunitySkills ∩ StudentSkills`, applies the configured first-strike grace and a bounded micro-nudge (maximum `0.25` in the configured normalized scale), increments the profile version, and records the audit event in the same database transaction.

```text
Admin Rule Studio → Student 5-Step Registration → Company Nested Weights → Post-Interview Micro-Nudge Calibration
```

## Determinism and product boundaries

- Do not add AI, LLM, embedding, probabilistic, or opaque ranking dependencies to matching/evaluation.
- Do not add CV/resume upload or free-text evaluation answers. Use enumerated choices, validated numeric values, and controlled identifiers.
- Keep scoring rules inspectable, versioned, and auditable. Store the rule/question/catalog version used for each result so a result can be reproduced.
- Behavioral “traps” should detect contradictions or low-confidence response patterns using pre-authored closed-ended questions. They should not assume that one answer proves dishonesty; expose a review/credibility signal and retain the evidence.
- The math engine is deliberately separate from HTTP and persistence. API handlers validate/authorize requests, services coordinate transactions, and pure engine functions calculate outcomes.

## Repository layout

- `src/engine/`: pure deterministic calculations and validations.
- `src/modules/`: HTTP route/controller/service boundaries grouped by actor/domain.
- `src/common/`: shared middleware and small infrastructure helpers.
- `database/migrations/`: schema migrations; `database/seeds/`: versioned starter catalogs/rules.
- `docs/`: initial ERD and API contract notes.
- `tests/`: unit-test starter files for math and calibration behavior.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 15 or newer

## Local setup

1. Clone the private repository and install packages:

   ```bash
   npm install
   ```

2. Create a local `.env` file at the repository root using the table below. Do not commit it. No `.env` or `.env.example` is tracked in this repository.
3. Create the local PostgreSQL database named in `DATABASE_URL`.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Build for deployment:

   ```bash
   npm run build
   npm start
   ```

### Environment variables

These are local format examples, not production credentials. Generate a unique, high-entropy `JWT_SECRET` locally and manage production values in the deployment secret manager.

| Key | Required | Description | Local format example |
|---|---:|---|---|
| `PORT` | Yes | HTTP port for Express. | `5080` |
| `DATABASE_URL` | Yes | PostgreSQL connection string. | `postgresql://internmatch:local_password@localhost:5432/internmatch_dev` |
| `JWT_SECRET` | Yes | Secret used to sign/verify access tokens; never use the example placeholder in production. | `replace-with-a-long-random-local-secret` |
| `JWT_EXPIRES_IN` | Yes | Access-token lifetime supported by the auth configuration. | `15m` |
| `NODE_ENV` | Yes | Runtime mode (`development`, `test`, or `production`). | `development` |

The `.gitignore` excludes `.env` and `.env.*` (including `.env.example`), plus `node_modules/`, `dist/`, and `coverage/`. Do not add environment files to commits.

## 3 Golden Backend Rules

### Rule 1 — Pure Math Engine

Files inside `src/engine/` must remain 100% pure TypeScript functions with **zero database or HTTP imports**. They accept plain data and return plain data, so they can be unit-tested independently and reproduce the same result for the same input. Database reads/writes belong in module services, never in the engine.

### Rule 2 — Strict 100% Nested Weight Validation

`POST /company/opportunities` must reject any payload with **400 Bad Request** if primary axis weights do not sum to exactly `100`, or if the sub-item weights inside **any** axis do not sum to exactly `100`. Require all five primary axes to be represented exactly once, including axes assigned a zero primary weight; reject any axis with missing/empty sub-items. Avoid floating-point drift: represent percentages as integer basis points (for example, `25.50% = 2550`) or use a decimal-safe representation at API boundaries. The starter contract uses percentage values and the pure validator; production persistence should normalize safely.

### Rule 3 — Atomic Post-Interview Calibration

`POST /company/calibration/reject` accepts **zero free-text fields**. It must validate that every evaluated skill belongs to the strict set intersection `OpportunitySkills ∩ StudentSkills`; apply the configured first-strike grace and a micro-nudge bounded to `0.25` in the normalized scoring scale; increment `ProfileVersion`; and write the corresponding `AuditLogs` record inside **one atomic database transaction**. If any step fails, roll back all writes. The precise trigger semantics and unit for the first-strike/nudge must be defined in the versioned rule configuration before production scoring is enabled.

## API surface (starter)

Base prefix: `/api/v1`. Route files are mounted by domain in `src/app.ts`.

| Domain | Starter path | Purpose |
|---|---|---|
| Auth | `/auth` | Registration/login/session endpoints. |
| Admin catalog | `/admin/catalog` | Manage controlled traits and skill catalog. |
| Admin studio | `/admin/studio` | Manage staged questions and trap definitions. |
| Admin rules | `/admin/rules` | Manage versioned scoring and eligibility rules. |
| Admin credibility | `/admin/credibility` | Review structured credibility signals. |
| Admin governance | `/admin/governance` | Audit/governance operations. |
| Student registration | `/student/registration` | Five-stage structured registration. |
| Student profile | `/student/profile` | Read/update structured profile attributes. |
| Student applications | `/student/applications` | Internship application lifecycle. |
| Company opportunities | `/company/opportunities` | Create internships with strict nested weights. |
| Company discovery | `/company/discovery` | Deterministic eligible-candidate ranking. |
| Company pipeline | `/company/pipeline` | Manage candidate stages. |
| Company calibration | `/company/calibration` | Structured post-interview calibration. |
| Audit | `/audit` | Authorized audit-log access. |

Route modules are starter scaffolds; they do not imply that every business operation is implemented yet. Document endpoint request/response shapes in `docs/api-contracts.md` before implementing them.

## Weighting and matching model

Let the primary axes be `A = {technical, soft, behavioral, interest, educational}`. For each axis `a`, company-defined axis weight `W_a` is a percentage, and child item `i` has within-axis weight `w_{a,i}`. Configuration is valid only when:

$$\sum_{a \in A} W_a = 100 \qquad\text{and}\qquad \forall a,\;\sum_i w_{a,i}=100$$

A student match score for an item is normalized to `[0, 100]`. The axis score is:

$$S_a = \sum_i \left(\frac{w_{a,i}}{100}\right) s_{a,i}$$

The opportunity score is:

$$S = \sum_a \left(\frac{W_a}{100}\right) S_a$$

Only comparable, eligible items participate. Missing student evidence is handled by an explicit versioned rule (for example, exclude/re-normalize or score as zero); do not silently choose a policy in code. The starter calculator rejects missing required item scores rather than inventing a policy.

## Security and data handling

- Keep secrets in local `.env` (ignored by Git) or managed secret storage; rotate any secret exposed in history.
- Validate schemas at the API boundary, authenticate protected routes, authorize by role/resource, and use parameterized SQL.
- Treat all evaluation fields as structured data. Do not persist free-text evaluation answers or uploaded CVs/resumes.
- Keep audit records append-only for consequential actions and avoid logging credentials/tokens.
- Use migrations for schema changes; seeds must be repeatable and must not contain personal student data.

## Git branching workflow

Do not push feature work directly to `main`. Use these branches:

- `dev` — shared integration branch.
- `feat/math-engine` — pure scoring, nested-weight, trap, and calibration logic.
- `feat/api-modules` — Express routes, validation, persistence, and module services.

Open pull requests into `dev`, review changes, then promote a stable release from `dev` to `main`. Keep commits small and describe the rule/config version changes in pull requests.

## Current implementation status

This repository begins as a scaffold. Route files and seed files are intentionally small placeholders; production behavior, database schema, migrations, authentication policy, complete five-step question catalog, and product-approved scoring/calibration semantics remain to be implemented. Never treat a placeholder rule as an approved hiring decision policy.
