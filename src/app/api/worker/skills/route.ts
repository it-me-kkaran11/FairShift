import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr-const-w1';

  const skills = queryAll('SELECT * FROM skill_credentials WHERE user_id = ? ORDER BY issue_date DESC', [userId]);
  return NextResponse.json({ skills });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, orgId, skillName, category, credentialType, issuingOrg, issueDate, expiryDate, notes } = body;

    if (!userId || !skillName) {
      return NextResponse.json({ error: 'Missing required skill fields' }, { status: 400 });
    }

    const id = `sk-${Date.now()}-${crypto.randomInt(100, 999)}`;
    execute(
      `INSERT INTO skill_credentials 
       (id, user_id, org_id, skill_name, category, credential_type, issuing_org, issue_date, expiry_date, verification_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'self_reported', ?)`,
      [
        id,
        userId,
        orgId,
        skillName,
        category || 'Competency',
        credentialType || 'competency',
        issuingOrg || 'Self Reported',
        issueDate || new Date().toISOString().split('T')[0],
        expiryDate || null,
        notes || null
      ]
    );

    return NextResponse.json({ success: true, id, message: 'Skill successfully recorded in passport.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
