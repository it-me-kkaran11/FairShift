import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute } from '@/lib/db';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  const skills = queryAll<any>(
    `SELECT sk.*, u.full_name as user_name, u.job_title 
     FROM skill_credentials sk 
     JOIN users u ON sk.user_id = u.id 
     WHERE sk.org_id = ? 
     ORDER BY sk.issue_date DESC`,
    [orgId]
  );

  return NextResponse.json({ skills });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { skillId, verifiedBy, status } = body;

    const reviewer = verifiedBy ? queryOne<any>('SELECT * FROM users WHERE id = ?', [verifiedBy]) : null;

    execute(
      `UPDATE skill_credentials 
       SET verification_status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status || 'employer_verified', reviewer?.id || null, skillId]
    );

    const skill = queryOne<any>('SELECT * FROM skill_credentials WHERE id = ?', [skillId]);
    if (skill) {
      recordAuditEvent({
        orgId: skill.org_id,
        entityType: 'verification',
        entityId: skillId,
        actorId: reviewer?.id,
        actorName: reviewer?.full_name || 'Safety Inspector',
        actorRole: reviewer?.role || 'safety_officer',
        action: 'VERIFY_WORKER_CREDENTIAL',
        reason: `Verified ${skill.skill_name} credential for employee`,
        details: { skillName: skill.skill_name, verificationStatus: status || 'employer_verified' }
      });
    }

    return NextResponse.json({ success: true, message: 'Skill credential verified successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
