import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr-const-w1';

  // Join shift assignments with work records
  const shifts = queryAll<any>(
    `SELECT s.*, 
            COALESCE(wr.recorded_hours, s.planned_hours) as recorded_hours,
            COALESCE(wr.approved_hours, s.planned_hours) as approved_hours,
            wr.status as work_status,
            wr.reconciliation_notes,
            site.name as site_name
     FROM shift_assignments s
     LEFT JOIN work_records wr ON s.user_id = wr.user_id AND s.shift_date = wr.shift_date
     LEFT JOIN sites site ON s.site_id = site.id
     WHERE s.user_id = ?
     ORDER BY s.shift_date DESC`,
    [userId]
  );

  const events = queryAll<any>(
    `SELECT * FROM attendance_events 
     WHERE user_id = ? 
     ORDER BY timestamp DESC LIMIT 50`,
    [userId]
  );

  return NextResponse.json({ shifts, events });
}
