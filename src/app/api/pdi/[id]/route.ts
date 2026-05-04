import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const db = getDb();

    // Only the engineer owner (or admin/gestor) can update
    const pdp = db.prepare('SELECT * FROM pdps WHERE id = ?').get(Number(id)) as any;
    if (!pdp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPrivileged = session.role === 'admin' || session.role === 'gestor';
    if (!isPrivileged && pdp.engineer_email !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newStatus = body.status === 'completed' ? 'completed' : 'active';
    db.prepare(`UPDATE pdps SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, Number(id));

    const updated = db.prepare('SELECT * FROM pdps WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const db = getDb();
    const pdp = db.prepare('SELECT * FROM pdps WHERE id = ?').get(Number(id)) as any;
    if (!pdp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPrivileged = session.role === 'admin' || session.role === 'gestor';
    if (!isPrivileged && pdp.engineer_email !== session.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM pdps WHERE id = ?').run(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
