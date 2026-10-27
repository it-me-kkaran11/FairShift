import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  const users = queryAll<any>(
    `SELECT u.*, s.name as site_name 
     FROM users u 
     LEFT JOIN sites s ON u.site_id = s.id 
     WHERE u.org_id = ? 
     ORDER BY u.role DESC, u.full_name ASC`,
    [orgId]
  );

  return NextResponse.json({ users });
}
