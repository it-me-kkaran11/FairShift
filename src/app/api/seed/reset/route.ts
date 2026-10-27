import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';

export async function POST() {
  try {
    seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Demo state successfully restored for both Construction and Higher Education organizations.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
