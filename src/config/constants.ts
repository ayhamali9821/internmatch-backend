/** Responsibility: define shared immutable API, role, axis, and calibration constants. */
export const API_PREFIX = "/api/v1" as const;
export const USER_ROLES = ["ADMIN", "STUDENT", "COMPANY"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const MATCH_AXES = ["technical", "soft", "behavioral", "interest", "educational"] as const;
export type MatchAxis = (typeof MATCH_AXES)[number];
export const MAX_MICRO_NUDGE = 0.25 as const;
