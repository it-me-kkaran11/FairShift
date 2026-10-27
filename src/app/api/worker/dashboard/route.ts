import { NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr-const-w1';

  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Today's shift
  const today = '2026-10-27';
  const todayShift = queryOne<any>(
    `SELECT s.*, site.name as site_name 
     FROM shift_assignments s 
     LEFT JOIN sites site ON s.site_id = site.id 
     WHERE s.user_id = ? AND s.shift_date = ? 
     LIMIT 1`,
    [userId, today]
  );

  // Work records with discrepancies
  const workRecordDiscrepancies = queryAll<any>(
    `SELECT * FROM work_records 
     WHERE user_id = ? AND status = 'disputed' 
     ORDER BY shift_date DESC`,
    [userId]
  );

  // Latest payslip
  const latestPayslip = queryOne<any>(
    `SELECT * FROM payslips WHERE user_id = ? ORDER BY period_end DESC LIMIT 1`,
    [userId]
  );

  // My cases
  const myCases = queryAll<any>(
    `SELECT * FROM cases WHERE reporter_user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  // Latest clock event to determine on/off duty
  const lastClock = queryOne<any>(
    `SELECT * FROM attendance_events WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1`,
    [userId]
  );

  const clockStatus = lastClock?.event_type === 'clock_in' ? 'in' : 'out';

  return NextResponse.json({
    todayShift,
    workRecordDiscrepancies,
    latestPayslip: latestPayslip ? {
      ...latestPayslip,
      allowances: JSON.parse(latestPayslip.allowances_json || '[]'),
      deductions: JSON.parse(latestPayslip.deductions_json || '[]'),
      calculation_trace: JSON.parse(latestPayslip.calculation_trace_json || '{}')
    } : null,
    myCases,
    clockStatus,
    lastClockTime: lastClock?.timestamp || ''
  });
}
