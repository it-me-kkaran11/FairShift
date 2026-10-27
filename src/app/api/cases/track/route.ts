import { NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';
import { verifyPasscode } from '@/lib/engine/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackingCode, passcode } = body;

    if (!trackingCode || !passcode) {
      return NextResponse.json({ error: 'Please enter both Tracking Code and Passcode.' }, { status: 400 });
    }

    const caseRow = queryOne<any>(
      `SELECT * FROM cases WHERE anonymous_tracking_code = ? OR case_number = ?`,
      [trackingCode.trim().toUpperCase(), trackingCode.trim().toUpperCase()]
    );

    if (!caseRow || !caseRow.anonymous_passcode_hash) {
      return NextResponse.json({ error: 'No matching anonymous report found for the provided credentials.' }, { status: 404 });
    }

    const isValid = verifyPasscode(passcode.trim(), caseRow.anonymous_passcode_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid passcode for this tracking code. Check your credentials and try again.' }, { status: 401 });
    }

    // Retrieve messages and actions
    const messages = queryAll(`SELECT * FROM case_messages WHERE case_id = ? ORDER BY created_at ASC`, [caseRow.id]);
    const actions = queryAll(`SELECT * FROM corrective_actions WHERE case_id = ? ORDER BY due_date ASC`, [caseRow.id]);

    // Redact internal reviewer IDs from anonymous output
    const safeCase = {
      ...caseRow,
      anonymous_passcode_hash: undefined, // Never send hash to client
      messages: messages.map(m => ({
        ...m,
        sender_id: m.sender_role === 'reporter' ? undefined : m.sender_id
      })),
      correctiveActions: actions
    };

    return NextResponse.json({ success: true, case: safeCase });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
