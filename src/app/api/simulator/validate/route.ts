import { NextResponse } from 'next/server';
import { simulateSchedule, ProposedShift } from '@/lib/engine/shift-simulator';
import { queryOne } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, shifts } = body;

    if (!Array.isArray(shifts)) {
      return NextResponse.json({ error: 'Shifts must be an array' }, { status: 400 });
    }

    const org = queryOne<any>('SELECT * FROM organisations WHERE id = ?', [orgId || 'org-construction']);
    const orgSettings = JSON.parse(org?.settings_json || '{}');

    const result = simulateSchedule(shifts as ProposedShift[], orgSettings);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
