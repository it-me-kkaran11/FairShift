import { NextResponse } from 'next/server';
import { getSession, DEMO_PERSONAS, getUserById, getOrgById } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;
  const session = getSession(userId);

  return NextResponse.json({
    session,
    availablePersonas: DEMO_PERSONAS
  });
}
