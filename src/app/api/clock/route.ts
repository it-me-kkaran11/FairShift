import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, eventType, siteId, verificationMethod, notes } = body;

    if (!userId || !eventType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const eventId = `att-${Date.now()}-${crypto.randomInt(100, 999)}`;
    const timestamp = new Date().toISOString();
    const effectiveSite = siteId || user.site_id || 'site-apex-a';

    execute(
      `INSERT INTO attendance_events (id, org_id, user_id, event_type, timestamp, site_id, verification_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        user.org_id,
        user.id,
        eventType,
        timestamp,
        effectiveSite,
        verificationMethod || 'mobile_geo',
        notes || (eventType === 'clock_in' ? 'Worker initiated clock-in' : 'Worker completed shift clock-out')
      ]
    );

    // Record in immutable Fairness Ledger
    recordAuditEvent({
      orgId: user.org_id,
      entityType: 'attendance',
      entityId: eventId,
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: eventType === 'clock_in' ? 'CLOCK_IN' : 'CLOCK_OUT',
      reason: `Worker attendance ${eventType} logged via ${verificationMethod || 'mobile'}`,
      details: { timestamp, siteId: effectiveSite }
    });

    return NextResponse.json({
      success: true,
      eventId,
      eventType,
      timestamp,
      message: eventType === 'clock_in' ? 'Successfully clocked in.' : 'Successfully clocked out.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
