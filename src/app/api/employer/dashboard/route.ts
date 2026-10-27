import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  const workersCount = queryOne<any>('SELECT COUNT(*) as count FROM users WHERE org_id = ? AND role = "worker"', [orgId])?.count || 0;
  const activeAlertsCount = queryOne<any>('SELECT COUNT(*) as count FROM fairness_alerts WHERE org_id = ? AND status = "open"', [orgId])?.count || 0;
  const disputedPayrollCount = queryOne<any>('SELECT COUNT(*) as count FROM work_records WHERE org_id = ? AND status = "disputed"', [orgId])?.count || 0;
  const openCasesCount = queryOne<any>('SELECT COUNT(*) as count FROM cases WHERE org_id = ? AND status NOT IN ("resolved", "rejected")', [orgId])?.count || 0;
  const verifiedCasesCount = queryOne<any>('SELECT COUNT(*) as count FROM cases WHERE org_id = ? AND status = "resolved"', [orgId])?.count || 0;
  const overdueActionsCount = queryOne<any>(
    `SELECT COUNT(*) as count FROM corrective_actions ca
     JOIN cases c ON ca.case_id = c.id
     WHERE c.org_id = ? AND ca.completed_at IS NULL AND ca.due_date < date('now')`,
    [orgId]
  )?.count || 0;

  // Recent alerts
  const recentAlerts = queryAll<any>(
    `SELECT * FROM fairness_alerts WHERE org_id = ? ORDER BY created_at DESC LIMIT 5`,
    [orgId]
  );

  // Recent cases
  const recentCases = queryAll<any>(
    `SELECT * FROM cases WHERE org_id = ? ORDER BY created_at DESC LIMIT 5`,
    [orgId]
  );

  // Attendance trends
  const shiftsCount = queryOne<any>('SELECT COUNT(*) as count FROM shift_assignments WHERE org_id = ?', [orgId])?.count || 0;

  return NextResponse.json({
    metrics: {
      workersCount,
      activeAlertsCount,
      disputedPayrollCount,
      openCasesCount,
      verifiedCasesCount,
      overdueActionsCount,
      shiftsCount
    },
    recentAlerts: recentAlerts.map(a => ({
      ...a,
      evidence: JSON.parse(a.evidence_json || '{}')
    })),
    recentCases
  });
}
