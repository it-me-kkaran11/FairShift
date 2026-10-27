import { NextResponse } from 'next/server';
import { queryAll, execute } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  const shifts = queryAll<any>(
    `SELECT s.*, u.full_name as user_name, u.job_title, site.name as site_name 
     FROM shift_assignments s 
     JOIN users u ON s.user_id = u.id 
     LEFT JOIN sites site ON s.site_id = site.id 
     WHERE s.org_id = ? 
     ORDER BY s.shift_date DESC, s.start_time ASC`,
    [orgId]
  );

  return NextResponse.json({ shifts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, userId, siteId, shiftDate, startTime, endTime, plannedHours, notes } = body;

    const id = `sh-${Date.now()}-${crypto.randomInt(100, 999)}`;
    execute(
      `INSERT INTO shift_assignments (id, org_id, user_id, site_id, shift_date, start_time, end_time, planned_hours, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
      [id, orgId, userId, siteId, shiftDate, startTime, endTime, plannedHours || 8.0, notes || null]
    );

    return NextResponse.json({ success: true, id, message: 'Shift created successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
