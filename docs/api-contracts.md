<!-- Responsibility: record API conventions and the initial deterministic endpoint contracts. -->
# API contracts (initial draft)

Base URL: `/api/v1`. JSON requests and responses use camelCase. This file states intended contracts; route files are scaffolds until implemented.

## Shared conventions

- Authentication: `Authorization: Bearer <token>` on protected endpoints.
- Errors: `{ "error": { "code": "...", "message": "...", "details": [] } }`.
- IDs are opaque strings. All evaluation answers use controlled option IDs or bounded numeric values.
- Reject unexpected keys in evaluation request schemas. No free-text answers, CV/resume uploads, or file payloads.
- Include `ruleSetVersion`/`questionVersion` on reproducibility-sensitive records.

## Create opportunity

`POST /api/v1/company/opportunities` — company role required.

```json
{
  "title": "Backend Intern",
  "skillIds": ["skill-postgresql", "skill-typescript"],
  "weights": {
    "axes": [
      { "axis": "technical", "weight": 50, "items": [{ "itemId": "sql", "weight": 60 }, { "itemId": "apis", "weight": 40 }] },
      { "axis": "soft", "weight": 15, "items": [{ "itemId": "communication", "weight": 100 }] },
      { "axis": "behavioral", "weight": 15, "items": [{ "itemId": "consistency", "weight": 100 }] },
      { "axis": "interest", "weight": 10, "items": [{ "itemId": "domain-interest", "weight": 100 }] },
      { "axis": "educational", "weight": 10, "items": [{ "itemId": "education-level", "weight": 100 }] }
    ]
  }
}
```

Return `201` with the stored opportunity and immutable weight/rule version. Return `400 WEIGHTS_SUM_INVALID` if primary weights or any axis's sub-item weights do not sum to exactly 100. Also reject unknown axes/items and duplicate entries.

## Reject and calibrate after interview

`POST /api/v1/company/calibration/reject` — authorized company evaluator only.

```json
{
  "applicationId": "app_123",
  "evaluations": [
    { "skillId": "skill-typescript", "rating": 2, "rubricOptionId": "needs_guidance" }
  ]
}
```

No text/comment property is allowed. Validate each skill against `OpportunitySkills ∩ StudentSkills`, validate rubric bounds/options, then atomically apply the versioned first-strike rule, cap the normalized micro-nudge at `0.25`, increment `ProfileVersion`, and append `AuditLogs`. Return `409 SKILL_NOT_IN_INTERSECTION` for a skill outside that exact set; return a generic validation error for unexpected text fields. Any failure rolls back the complete operation.

The exact calibration function is intentionally not finalized by this scaffold. The rule version must state whether the `0.25` cap means absolute score points or normalized fraction and exactly which event counts as the first strike.

## Other route families

| Method / path | Intended purpose |
|---|---|
| `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | Account creation and session issue. |
| `GET/POST /api/v1/admin/catalog` | Admin-controlled traits/skills. |
| `GET/POST /api/v1/admin/studio/questions` | Versioned closed-ended registration questions/traps. |
| `GET/POST /api/v1/admin/rules` | Versioned weights, eligibility, depth, grace and calibration rules. |
| `POST /api/v1/student/registration/steps/:step` | Submit one validated registration stage. |
| `GET/PATCH /api/v1/student/profile` | Read/update structured student profile. |
| `GET/POST /api/v1/student/applications` | List/apply to opportunities. |
| `GET /api/v1/company/discovery` | Deterministically ranked eligible students. |
| `PATCH /api/v1/company/pipeline/:applicationId` | Move an application through allowed pipeline states. |
| `GET /api/v1/audit` | Authorized filtered audit access. |

## Status codes

`400` malformed/invalid payload; `401` unauthenticated; `403` role/resource forbidden; `404` not found; `409` conflicting state or non-intersecting skill; `500` unexpected failure. Never return secret/internal stack information to clients.
