import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  
  // BYPASS AUTH: Temporary for demo/preview as requested by user
  if (!session) {
    return NextResponse.json({
      email: 'diegocaporusso@gmail.com',
      name: 'Diego (Admin)',
      role: 'admin'
    });
  }
  
  return NextResponse.json(session);
}
