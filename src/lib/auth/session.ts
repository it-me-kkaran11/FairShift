import { queryOne, queryAll } from '../db/index.ts';
import type { User, Organisation, UserRole } from '../../types/index.ts';

export { DEMO_PERSONAS } from './personas';

export interface SessionContext {
  user: User;
  org: Organisation;
}

export function getUserById(userId: string): User | null {
  const row = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!row) return null;
  return row as User;
}

export function getOrgById(orgId: string): Organisation | null {
  const row = queryOne<any>('SELECT * FROM organisations WHERE id = ?', [orgId]);
  if (!row) return null;
  return {
    ...row,
    settings: JSON.parse(row.settings_json || '{}')
  };
}

export function getSession(userId?: string): SessionContext {
  const targetId = userId || 'usr-const-w1'; // Default: Ramanathan
  const user = getUserById(targetId) || getUserById('usr-const-w1')!;
  const org = getOrgById(user.org_id) || getOrgById('org-construction')!;

  return { user, org };
}

/**
 * Validates permission boundary: Ensures a user cannot view or mutate another tenant's records
 */
export function validateTenantAccess(userOrgId: string, requestedOrgId: string): boolean {
  return userOrgId === requestedOrgId;
}

/**
 * Validates worker record ownership: Worker can only access personal records
 */
export function validateWorkerRecordOwnership(userId: string, recordOwnerId: string, userRole: UserRole): boolean {
  if (userRole === 'manager' || userRole === 'safety_officer' || userRole === 'payroll_admin' || userRole === 'super_admin') {
    return true; // Authorized reviewer within tenant
  }
  return userId === recordOwnerId;
}
