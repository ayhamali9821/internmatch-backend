/** Responsibility: append and query auditable domain events using the caller's transaction where needed. */
import type { PoolClient } from "pg";
export interface AuditEvent { actorId: string; action: string; resourceType: string; resourceId: string; metadata: Record<string, string | number | boolean | null>; }
export async function appendAuditEvent(client: PoolClient, event: AuditEvent): Promise<void> {
  // TODO: replace with parameterized INSERT after the AuditLogs migration is defined.
  void client; void event;
}
