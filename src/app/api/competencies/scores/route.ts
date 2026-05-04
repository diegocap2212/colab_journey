import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { scores } = await req.json(); // { competency_id: score }
  const db = getDb();

  const cycle = db.prepare('SELECT id FROM competency_cycles WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get() as any;
  if (!cycle) return NextResponse.json({ error: 'Nenhum ciclo ativo' }, { status: 400 });

  const submitted = db.prepare('SELECT 1 FROM competency_submissions WHERE cycle_id = ? AND user_email = ?').get(cycle.id, session.email);
  if (submitted) return NextResponse.json({ error: 'Você já submeteu neste ciclo.' }, { status: 409 });

  const upsert = db.prepare(`
    INSERT INTO competency_user_scores (cycle_id, user_email, competency_id, score)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(cycle_id, user_email, competency_id) DO UPDATE SET score=excluded.score, last_updated=datetime('now')
  `);

  const insertMany = db.transaction((entries: [number, number][]) => {
    for (const [compId, score] of entries) {
      upsert.run(cycle.id, session.email, compId, Math.max(0, Math.min(3, score)));
    }
  });

  insertMany(Object.entries(scores).map(([k, v]) => [parseInt(k), v as number]));
  return NextResponse.json({ success: true });
}
