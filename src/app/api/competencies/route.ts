import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get('cycle_id');

  const cycle = cycleId
    ? db.prepare('SELECT * FROM competency_cycles WHERE id = ?').get(cycleId) as any
    : db.prepare('SELECT * FROM competency_cycles WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get() as any;

  if (!cycle) return NextResponse.json({ error: 'Nenhum ciclo ativo' }, { status: 404 });

  const defs = db.prepare('SELECT * FROM competency_matrix_defs ORDER BY order_index ASC').all() as any[];
  const isPrivileged = session.role !== 'user';

  if (isPrivileged) {
    const allScores = db.prepare(`
      SELECT cus.user_email, cus.competency_id, cus.score, u.name as user_name
      FROM competency_user_scores cus
      LEFT JOIN users u ON u.email = cus.user_email
      WHERE cus.cycle_id = ?
    `).all(cycle.id) as any[];

    const participants = db.prepare(`
      SELECT DISTINCT u.email, u.name FROM competency_submissions cs
      JOIN users u ON u.email = cs.user_email
      WHERE cs.cycle_id = ?
    `).all(cycle.id) as any[];

    const scoreMap: Record<number, Record<string, number>> = {};
    for (const s of allScores) {
      if (!scoreMap[s.competency_id]) scoreMap[s.competency_id] = {};
      scoreMap[s.competency_id][s.user_email] = s.score;
    }

    const defsWithData = defs.map(d => {
      const scores = Object.values(scoreMap[d.id] || {});
      return {
        ...d,
        scores_by_user: scoreMap[d.id] || {},
        avg_score: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null,
      };
    });

    return NextResponse.json({
      cycle_id: cycle.id, cycle_name: cycle.name, is_active: cycle.is_active === 1,
      definitions: defsWithData, participants, is_privileged: true,
    });
  } else {
    const myScores = db.prepare(
      'SELECT competency_id, score FROM competency_user_scores WHERE cycle_id = ? AND user_email = ?'
    ).all(cycle.id, session.email) as any[];

    const scoreMap: Record<number, number> = {};
    for (const s of myScores) scoreMap[s.competency_id] = s.score;

    const submitted = !!db.prepare(
      'SELECT 1 FROM competency_submissions WHERE cycle_id = ? AND user_email = ?'
    ).get(cycle.id, session.email);

    return NextResponse.json({
      cycle_id: cycle.id, cycle_name: cycle.name, is_active: cycle.is_active === 1,
      definitions: defs, my_scores: scoreMap, user_submitted: submitted, is_privileged: false,
    });
  }
}
