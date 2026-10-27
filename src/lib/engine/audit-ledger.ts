import { execute, queryAll } from '../db/index.ts';
import type { FairnessLedgerEvent } from '../../types/index.ts';
import crypto from 'node:crypto';

export interface RecordAuditEventInput {
  orgId: string;
  entityType: 'attendance' | 'shift' | 'payroll' | 'grievance' | 'corrective_action' | 'verification' | 'alert';
  entityId: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  reason?: string;
  details?: Record<string, any>;
}

/**
 * Appends an auditable, immutable event to the Fairness Ledger
 */
export function recordAuditEvent(input: RecordAuditEventInput): FairnessLedgerEvent {
  const id = `ledger-${Date.now()}-${crypto.randomInt(100, 999)}`;
  const timestamp = new Date().toISOString();
  const detailsJson = JSON.stringify(input.details || {});

  execute(
    `INSERT INTO fairness_ledger 
     (id, org_id, entity_type, entity_id, actor_id, actor_name, actor_role, action, reason, details_json, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.orgId,
      input.entityType,
      input.entityId,
      input.actorId || null,
      input.actorName,
      input.actorRole,
      input.action,
      input.reason || null,
      detailsJson,
      timestamp
    ]
  );

  return {
    id,
    org_id: input.orgId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    actor_id: input.actorId,
    actor_name: input.actorName,
    actor_role: input.actorRole,
    action: input.action,
    reason: input.reason,
    details: input.details || {},
    timestamp
  };
}

/**
 * Retrieves chronological audit history for an organisation or specific entity
 */
export function getAuditEvents(orgId: string, entityId?: string, limit: number = 100): FairnessLedgerEvent[] {
  let sql = `SELECT * FROM fairness_ledger WHERE org_id = ?`;
  const params: any[] = [orgId];

  if (entityId) {
    sql += ` AND entity_id = ?`;
    params.push(entityId);
  }

  sql += ` ORDER BY timestamp DESC LIMIT ?`;
  params.push(limit);

  const rows = queryAll(sql, params);
  return rows.map(r => ({
    ...r,
    details: JSON.parse(r.details_json || '{}')
  }));
}
