import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';
  const entityType = searchParams.get('entityType');

  let sql = 'SELECT * FROM fairness_ledger WHERE org_id = ?';
  const params: any[] = [orgId];

  if (entityType && entityType !== 'all') {
    sql += ' AND entity_type = ?';
    params.push(entityType);
  }

  sql += ' ORDER BY timestamp DESC LIMIT 100';

  const rows = queryAll<any>(sql, params);
  const events = rows.map(r => ({
    ...r,
    details: JSON.parse(r.details_json || '{}')
  }));

  return NextResponse.json({ events });
}
