import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';
import crypto from 'node:crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();
    const { actionDescription, assignedTo, dueDate, completionEvidence, verifyNow, verifiedBy, notes } = body;

    const caseRow = queryOne<any>('SELECT * FROM cases WHERE id = ?', [caseId]);
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const actionId = `ca-${Date.now()}-${crypto.randomInt(100, 999)}`;
    const isVerified = Boolean(verifyNow);

    execute(
      `INSERT INTO corrective_actions 
       (id, case_id, action_description, assigned_to, due_date, completed_at, completion_evidence, verification_status, verified_by, verified_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actionId,
        caseId,
        actionDescription,
        assignedTo || caseRow.assigned_to || 'usr-const-mgr',
        dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completionEvidence ? new Date().toISOString() : null,
        completionEvidence || null,
        isVerified ? 'verified' : 'pending',
        isVerified ? (verifiedBy || 'usr-const-safe') : null,
        isVerified ? new Date().toISOString() : null,
        notes || null
      ]
    );

    // Update case status to awaiting_verification or action_proposed
    const nextStatus = isVerified ? 'awaiting_verification' : 'action_proposed';
    execute('UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextStatus, caseId]);

    // Record in Fairness Ledger
    recordAuditEvent({
      orgId: caseRow.org_id,
      entityType: 'corrective_action',
      entityId: actionId,
      actorName: 'Remedy Manager',
      actorRole: 'manager',
      action: isVerified ? 'VERIFY_CORRECTIVE_ACTION' : 'CREATE_CORRECTIVE_ACTION',
      reason: actionDescription,
      details: { caseId, caseNumber: caseRow.case_number, isVerified }
    });

    return NextResponse.json({
      success: true,
      actionId,
      verificationStatus: isVerified ? 'verified' : 'pending',
      message: isVerified ? 'Corrective action verified by safety inspector.' : 'Corrective action recorded.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
