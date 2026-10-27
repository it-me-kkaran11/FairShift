import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { analyzeWorkloadBurden, WorkerWorkloadSummary } from '@/lib/engine/hidden-burden';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-university';

  // Get workers in this org
  const workers = queryAll<any>('SELECT * FROM users WHERE org_id = ? AND role = "worker"', [orgId]);

  // Aggregate work records per worker
  const workerSummaries: WorkerWorkloadSummary[] = workers.map(w => {
    const records = queryAll<any>('SELECT * FROM work_records WHERE user_id = ?', [w.id]);
    const shifts = queryAll<any>('SELECT * FROM shift_assignments WHERE user_id = ?', [w.id]);

    const reg = records.reduce((sum, r) => sum + (r.approved_hours > 8 ? 8 : r.approved_hours), 0) || 40;
    const ot = records.reduce((sum, r) => sum + r.overtime_hours, 0);

    // Count night shifts (start_time >= 18:00 or < 06:00)
    const nightCount = shifts.filter(s => {
      const h = Number(s.start_time?.split(':')[0] || 0);
      return h >= 18 || h < 6;
    }).length;

    return {
      userId: w.id,
      userName: w.full_name,
      department: w.department,
      jobTitle: w.job_title,
      regularHours: reg,
      overtimeHours: ot,
      nightShiftCount: nightCount,
      weekendShiftCount: 1,
      totalHours: reg + ot
    };
  });

  const departmentName = workers[0]?.department || 'General Operations';
  const analysis = analyzeWorkloadBurden(departmentName, workerSummaries);

  return NextResponse.json({ analysis });
}
