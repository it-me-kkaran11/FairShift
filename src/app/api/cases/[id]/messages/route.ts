import { NextResponse } from 'next/server';
import { execute, queryOne, queryAll } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const messages = queryAll('SELECT * FROM case_messages WHERE case_id = ? ORDER BY created_at ASC', [id]);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, senderRole, senderId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const caseRow = queryOne<any>('SELECT * FROM cases WHERE id = ?', [id]);
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const msgId = `msg-${Date.now()}-${crypto.randomInt(100, 999)}`;
    const effectiveSenderId = senderRole === 'reporter' && caseRow.is_anonymous ? null : senderId;

    execute(
      `INSERT INTO case_messages (id, case_id, sender_role, sender_id, message, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [msgId, id, senderRole || 'reporter', effectiveSenderId, message.trim()]
    );

    execute('UPDATE cases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      messageId: msgId,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
