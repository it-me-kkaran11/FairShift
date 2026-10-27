import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-construction';

  const org = queryOne<any>('SELECT * FROM organisations WHERE id = ?', [orgId]);
  if (!org) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
  }

  return NextResponse.json({
    org: {
      ...org,
      settings: JSON.parse(org.settings_json || '{}')
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, settings, updatedBy } = body;

    const org = queryOne<any>('SELECT * FROM organisations WHERE id = ?', [orgId]);
    if (!org) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

    const reviewer = updatedBy ? queryOne<any>('SELECT * FROM users WHERE id = ?', [updatedBy]) : null;

    execute(
      'UPDATE organisations SET settings_json = ? WHERE id = ?',
      [JSON.stringify(settings), orgId]
    );

    recordAuditEvent({
      orgId,
      entityType: 'shift',
      entityId: orgId,
      actorId: reviewer?.id,
      actorName: reviewer?.full_name || 'Organization Admin',
      actorRole: reviewer?.role || 'super_admin',
      action: 'UPDATE_ORGANISATION_SETTINGS',
      reason: 'Modified statutory rest and overtime rules',
      details: settings
    });

    return NextResponse.json({ success: true, message: 'Organization rules updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
