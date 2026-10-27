import { NextResponse } from 'next/server';
import { execute, queryOne, queryAll } from '@/lib/db';
import { validateCaseTransition } from '@/lib/engine/case-remedy';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetStatus, actorId, rejectionReason, appealReason, notes } = body;

    const caseRow = queryOne<any>('SELECT * FROM cases WHERE id = ?', [id]);
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const orgRow = queryOne<any>('SELECT * FROM organisations WHERE id = ?', [caseRow.org_id]);
    const orgSettings = JSON.parse(orgRow?.settings_json || '{}');
    const requiresVerification = orgSettings.requires_remedy_verification !== false;

    // Check if there is any verified corrective action
    const actions = queryAll<any>('SELECT * FROM corrective_actions WHERE case_id = ?', [id]);
    const hasVerifiedAction = actions.some(a => a.verification_status === 'verified');

    const actor = actorId ? queryOne<any>('SELECT * FROM users WHERE id = ?', [actorId]) : null;
    const actorName = actor?.full_name || 'System Reviewer';
    const actorRole = actor?.role || 'manager';

    // Validate transition
    const validation = validateCaseTransition(caseRow.status, targetStatus, {
      rejectionReason,
      hasVerifiedAction,
      requiresVerification,
      actorRole
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    // Execute transition
    let resolvedAt: string | null = null;
    if (targetStatus === 'resolved') {
      resolvedAt = new Date().toISOString();
    }

    execute(
      `UPDATE cases 
       SET status = ?, 
           rejection_reason = COALESCE(?, rejection_reason),
           appeal_reason = COALESCE(?, appeal_reason),
           resolved_at = COALESCE(?, resolved_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        targetStatus,
        rejectionReason || null,
        appealReason || null,
        resolvedAt,
        id
      ]
    );

    // Append system message to case dialogue
    const msgText = targetStatus === 'resolved'
      ? `Case verified as RESOLVED by ${actorName}. Corrective actions verified.`
      : targetStatus === 'rejected'
      ? `Case status changed to REJECTED. Reason: ${rejectionReason}`
      : targetStatus === 'appealed'
      ? `Case was APPEALED by reporter. Reason: ${appealReason}`
      : targetStatus === 'reopened'
      ? `Case was REOPENED. Investigation resumed.`
      : `Status updated to ${targetStatus} by ${actorName}.`;

    execute(
      `INSERT INTO case_messages (id, case_id, sender_role, sender_id, message, created_at)
       VALUES (?, ?, 'system', ?, ?, CURRENT_TIMESTAMP)`,
      [`msg-trans-${Date.now()}`, id, actor?.id || null, msgText]
    );

    // Record in immutable Fairness Ledger
    recordAuditEvent({
      orgId: caseRow.org_id,
      entityType: 'grievance',
      entityId: id,
      actorId: actor?.id,
      actorName,
      actorRole,
      action: `TRANSITION_TO_${targetStatus.toUpperCase()}`,
      reason: rejectionReason || appealReason || notes || `Transitioned from ${caseRow.status} to ${targetStatus}`,
      details: {
        previousStatus: caseRow.status,
        newStatus: targetStatus,
        caseNumber: caseRow.case_number
      }
    });

    return NextResponse.json({
      success: true,
      caseId: id,
      previousStatus: caseRow.status,
      newStatus: targetStatus,
      message: `Case status transitioned to ${targetStatus}.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
