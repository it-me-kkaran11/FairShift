import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  // Work records joined with user info
  const workRecords = queryAll<any>(
    `SELECT wr.*, u.full_name as user_name, u.job_title, u.hourly_rate
     FROM work_records wr
     JOIN users u ON wr.user_id = u.id
     WHERE wr.org_id = ?
     ORDER BY wr.shift_date DESC`,
    [orgId]
  );

  // Payslips joined with user info
  const payslipsRaw = queryAll<any>(
    `SELECT p.*, u.full_name as user_name, u.job_title
     FROM payslips p
     JOIN users u ON p.user_id = u.id
     WHERE p.org_id = ?
     ORDER BY p.period_end DESC`,
    [orgId]
  );

  const payslips = payslipsRaw.map(p => ({
    ...p,
    allowances: JSON.parse(p.allowances_json || '[]'),
    deductions: JSON.parse(p.deductions_json || '[]'),
    calculation_trace: JSON.parse(p.calculation_trace_json || '{}')
  }));

  return NextResponse.json({ workRecords, payslips });
}
