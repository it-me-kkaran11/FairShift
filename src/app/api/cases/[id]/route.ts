import { NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const caseRow = queryOne<any>('SELECT * FROM cases WHERE id = ? OR case_number = ?', [id, id]);
  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const messages = queryAll('SELECT * FROM case_messages WHERE case_id = ? ORDER BY created_at ASC', [caseRow.id]);
  const actions = queryAll('SELECT * FROM corrective_actions WHERE case_id = ? ORDER BY due_date ASC', [caseRow.id]);

  const safeCase = {
    ...caseRow,
    anonymous_passcode_hash: undefined, // Never send hash to client
    correctiveActions: actions
  };

  return NextResponse.json({
    case: safeCase,
    messages
  });
}
