import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const isGestorOrAdmin = session.role === 'admin' || session.role === 'gestor';
    
    let pdps;
    if (isGestorOrAdmin) {
      pdps = db.prepare('SELECT p.*, u.name as engineer_name FROM pdps p JOIN users u ON p.engineer_email = u.email ORDER BY p.created_at DESC').all();
    } else {
      pdps = db.prepare('SELECT p.*, u.name as engineer_name FROM pdps p JOIN users u ON p.engineer_email = u.email WHERE p.engineer_email = ? ORDER BY p.created_at DESC').all(session.email);
    }
    
    return NextResponse.json(pdps);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description, competency_area, target_date, engineer_email, feedback_id } = await req.json();
    if (!title || !competency_area) return NextResponse.json({ error: 'Título e Área são obrigatórios' }, { status: 400 });

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO pdps (engineer_email, feedback_id, title, description, competency_area, target_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(engineer_email || session.email, feedback_id || null, title, description || '', competency_area, target_date || null, session.email);
    
    const newPdp = db.prepare('SELECT * FROM pdps WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(newPdp);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
