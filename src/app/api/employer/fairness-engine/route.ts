import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute } from '@/lib/db';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  const rows = queryAll('SELECT * FROM fairness_alerts WHERE org_id = ? ORDER BY created_at DESC', [orgId]);
  const alerts = rows.map(r => ({
    ...r,
    evidence: JSON.parse(r.evidence_json || '{}')
  }));

  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, status, resolutionNotes, reviewerId } = body;

    const alert = queryOne<any>('SELECT * FROM fairness_alerts WHERE id = ?', [alertId]);
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const reviewer = reviewerId ? queryOne<any>('SELECT * FROM users WHERE id = ?', [reviewerId]) : null;
    const reviewerName = reviewer?.full_name || 'Safety Director';

    execute(
      `UPDATE fairness_alerts 
       SET status = ?, resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status || 'resolved', resolutionNotes || 'Resolved following supervisor investigation', alertId]
    );

    recordAuditEvent({
      orgId: alert.org_id,
      entityType: 'alert',
      entityId: alertId,
      actorId: reviewer?.id,
      actorName: reviewerName,
      actorRole: reviewer?.role || 'manager',
      action: `RESOLVE_FAIRNESS_ALERT`,
      reason: resolutionNotes || 'Investigated by authorized reviewer',
      details: { alertId, ruleId: alert.rule_id, status }
    });

    return NextResponse.json({ success: true, message: 'Alert updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
