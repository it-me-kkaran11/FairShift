import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workRecordId, userId, notes } = body;

    const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    execute(
      `UPDATE work_records 
       SET status = 'disputed', reconciliation_notes = ? 
       WHERE id = ?`,
      [`Worker dispute: ${notes}`, workRecordId]
    );

    // Record in Fairness Ledger
    recordAuditEvent({
      orgId: user.org_id,
      entityType: 'attendance',
      entityId: workRecordId,
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'REQUEST_ATTENDANCE_CORRECTION',
      reason: notes,
      details: { workRecordId, employeeNote: notes }
    });

    return NextResponse.json({ success: true, message: 'Correction request submitted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
