import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'usr-const-w1';

  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const payslipsRaw = queryAll<any>(
    `SELECT * FROM payslips WHERE user_id = ? ORDER BY period_end DESC`,
    [userId]
  );

  const payslips = payslipsRaw.map(p => ({
    ...p,
    allowances: JSON.parse(p.allowances_json || '[]'),
    deductions: JSON.parse(p.deductions_json || '[]'),
    calculation_trace: JSON.parse(p.calculation_trace_json || '{}')
  }));

  const receipts = queryAll<any>(
    `SELECT * FROM fairness_receipts WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return NextResponse.json({ payslips, receipts });
}
