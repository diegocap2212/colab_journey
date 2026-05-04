import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  let rows: any[];

  if (session.role === 'user') {
    rows = db.prepare('SELECT * FROM feedbacks WHERE engineer_email = ? ORDER BY created_at ASC').all(session.email);
  } else {
    rows = db.prepare('SELECT * FROM feedbacks ORDER BY created_at ASC').all();
  }

  // Group by engineer
  const data: Record<string, any[]> = {};
  for (const r of rows as any[]) {
    const key = r.engineer_email;
    if (!data[key]) data[key] = [];
    data[key].push(r);
  }

  return NextResponse.json(data);
}
