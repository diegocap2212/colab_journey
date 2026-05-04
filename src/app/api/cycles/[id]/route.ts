import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role === 'user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const { is_active } = await req.json();
    const db = getDb();

    if (is_active) {
      db.prepare('UPDATE competency_cycles SET is_active = 0').run();
    }
    
    db.prepare('UPDATE competency_cycles SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
