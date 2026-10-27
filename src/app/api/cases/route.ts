import { NextResponse } from 'next/server';
import { execute, queryAll, queryOne } from '@/lib/db';
import { generateTrackingCode, generatePasscode, hashPasscode } from '@/lib/engine/crypto';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';
import crypto from 'node:crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';
  const userId = searchParams.get('userId');
  const role = searchParams.get('role') || 'worker';

  let sql = 'SELECT * FROM cases WHERE org_id = ?';
  const params: any[] = [orgId];

  if (role === 'worker' && userId) {
    // Workers can only see cases they personally authored (non-anonymous)
    sql += ' AND reporter_user_id = ?';
    params.push(userId);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = queryAll(sql, params);
  return NextResponse.json({ cases: rows });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, isAnonymous, reporterUserId, category, priority, title, description, siteId, locationDetail } = body;

    if (!orgId || !category || !title || !description || !siteId) {
      return NextResponse.json({ error: 'Missing required case fields' }, { status: 400 });
    }

    const caseId = `case-${Date.now()}-${crypto.randomInt(100, 999)}`;
    const categoryPrefix = category === 'safety_hazard' ? 'SAFE' : category === 'wage_dispute' ? 'WAGE' : 'CASE';
    const trackingCode = generateTrackingCode(categoryPrefix);

    let passcode: string | null = null;
    let passcodeHash: string | null = null;
    let effectiveReporterId: string | null = reporterUserId;

    if (isAnonymous) {
      effectiveReporterId = null; // Strictly decoupled
      passcode = generatePasscode();
      passcodeHash = hashPasscode(passcode);
    }

    // Default 48-hour response deadline for urgent cases, 5 days for others
    const deadlineDays = priority === 'urgent' ? 2 : priority === 'high' ? 3 : 5;
    const targetDeadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString();

    execute(
      `INSERT INTO cases 
       (id, case_number, org_id, is_anonymous, reporter_user_id, anonymous_tracking_code, anonymous_passcode_hash, category, priority, title, description, site_id, location_detail, status, target_deadline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        caseId,
        trackingCode,
        orgId,
        isAnonymous ? 1 : 0,
        effectiveReporterId,
        trackingCode,
        passcodeHash,
        category,
        priority || 'medium',
        title,
        description,
        siteId,
        locationDetail || null,
        targetDeadline
      ]
    );

    // Initial case message
    execute(
      `INSERT INTO case_messages (id, case_id, sender_role, sender_id, message, created_at)
       VALUES (?, ?, 'reporter', ?, ?, CURRENT_TIMESTAMP)`,
      [`msg-${Date.now()}`, caseId, effectiveReporterId, description]
    );

    // Record in Fairness Ledger
    recordAuditEvent({
      orgId,
      entityType: 'grievance',
      entityId: caseId,
      actorId: effectiveReporterId || undefined,
      actorName: isAnonymous ? 'Anonymous Reporter' : 'Identified Worker',
      actorRole: 'worker',
      action: 'SUBMIT_CASE',
      reason: `Case filed under category: ${category}`,
      details: {
        caseNumber: trackingCode,
        category,
        priority: priority || 'medium',
        isAnonymous: Boolean(isAnonymous)
      }
    });

    return NextResponse.json({
      success: true,
      caseId,
      caseNumber: trackingCode,
      isAnonymous: Boolean(isAnonymous),
      anonymousTrackingCode: trackingCode,
      anonymousPasscode: passcode, // Returned ONCE to reporter
      message: 'Report successfully submitted to the auditable fairness system.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
