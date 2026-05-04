import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const fb = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as any;
  if (!fb) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'user' && fb.engineer_email !== session.email && fb.evaluator_email !== session.email) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  fb.impacts = JSON.parse(fb.impacts_json || '[]');
  if (fb.is_anonymous && fb.engineer_email === session.email && fb.evaluator_email !== session.email) {
    fb.evaluator_name = 'Anônimo';
  }
  return NextResponse.json(fb);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const fb = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as any;
  if (!fb) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'user' && fb.evaluator_email !== session.email) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const data = await req.json();
  db.prepare(`
    UPDATE feedbacks SET
      engineer_email=?, engineer_name=?, cycle=?,
      execution_score=?, execution_text=?, communication_score=?, communication_text=?,
      dev_score=?, dev_text=?, maintain_score=?, maintain_text=?,
      study_score=?, study_text=?, ownership_score=?, ownership_text=?,
      cultural_score=?, cultural_text=?, general_text=?,
      is_draft=?, is_anonymous=?, impacts_json=?,
      updated_at=datetime('now')
    WHERE id=?
  `).run(
    data.engineer_email, data.engineer_name, data.cycle,
    data.execution_score ?? null, data.execution_text ?? '',
    data.communication_score ?? null, data.communication_text ?? '',
    data.dev_score ?? null, data.dev_text ?? '',
    data.maintain_score ?? null, data.maintain_text ?? '',
    data.study_score ?? null, data.study_text ?? '',
    data.ownership_score ?? null, data.ownership_text ?? '',
    data.cultural_score ?? null, data.cultural_text ?? '',
    data.general_text ?? '',
    data.is_draft ? 1 : 0, data.is_anonymous ? 1 : 0,
    JSON.stringify(data.impacts ?? []),
    id
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const fb = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as any;
  if (!fb) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'user' && fb.evaluator_email !== session.email) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  db.prepare('DELETE FROM feedbacks WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
