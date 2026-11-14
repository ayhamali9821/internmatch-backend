<!-- Responsibility: explain the initial relational model and its integrity boundaries. -->
# Initial ERD and data model

This is a domain model proposal for the scaffold, not an applied migration. Store immutable/versioned definitions separately from student and opportunity snapshots so old scores can be reproduced.

## Core entities

| Entity | Responsibility / key relationships |
|---|---|
| `Users` | Identity, login fields, account status, and role (`ADMIN`, `STUDENT`, `COMPANY`). Never store passwords in plain text. |
| `StudentProfiles` | One structured profile per student; includes monotonic `ProfileVersion`. |
| `SkillCatalog` | Controlled skill identifiers, labels, axis and optional parent category. |
| `StudentSkills` | Student-to-skill evidence/level mapping; unique `(student_id, skill_id)`. |
| `RegistrationQuestionVersions` | Versioned staged questions, allowed answer options, validation rules, and category. Closed-ended only. |
| `RegistrationAnswers` | Structured option/numeric values tied to question version; no evaluation free text. |
| `BehavioralTrapDefinitions` | Admin-authored consistency rules referencing controlled question/option IDs. |
| `BehavioralSignals` | Reproducible result/evidence references, rule version, and review state; not a declaration of intent or honesty. |
| `Opportunities` | Company internship details, status, dates, and rule/config version. |
| `OpportunitySkills` | Required skills and requirement levels per opportunity. |
| `OpportunityAxes` | Primary axis weight rows; exact sum constraint is enforced in service/transaction. |
| `OpportunityAxisItems` | Per-axis child weights; exact sum constraint is enforced for each axis. |
| `Applications` | Student/opportunity relationship and deterministic discovery/application stage. |
| `InterviewEvaluations` | Closed-ended per-skill evaluation tied to evaluator and rubric version. |
| `CalibrationEvents` | Rejection calibration event, strike number, bounded nudge, and before/after profile versions. |
| `AuditLogs` | Append-only actor/action/resource/version/timestamp record for consequential operations. |
| `RuleSetVersions` | Immutable versioned scoring, eligibility, grace, and calibration settings. |

## Integrity requirements

- Use foreign keys for every referenced user, skill, opportunity, question, rule version, and actor.
- Add unique constraints to prevent duplicate catalog links and duplicate active application records where product rules require it.
- Save the exact question and rule version used by each registration answer/evaluation.
- Enforce axis weight sums and per-axis sub-item sums transactionally when saving an opportunity; a normal SQL `CHECK` cannot validate a sum across sibling rows.
- Calibration event, `StudentProfiles.ProfileVersion` update, and `AuditLogs` insert are one transaction.
- Do not persist raw CV files or open-ended evaluation comments.

A future migration should define exact types, delete policies, indexes, tenant/company ownership, and retention policy before production data is collected.
