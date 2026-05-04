import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendSlackNotification, buildCycleReminderNotification } from '@/lib/slack';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  const cycle = db.prepare('SELECT id, name FROM competency_cycles WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get() as any;
  if (!cycle) return NextResponse.json({ error: 'Nenhum ciclo ativo' }, { status: 400 });

  const count = (db.prepare('SELECT COUNT(*) as c FROM competency_user_scores WHERE cycle_id = ? AND user_email = ?').get(cycle.id, session.email) as any).c;
  if (count === 0) return NextResponse.json({ error: 'Preencha pelo menos uma competência.' }, { status: 400 });

  try {
    db.prepare('INSERT INTO competency_submissions (cycle_id, user_email) VALUES (?, ?)').run(cycle.id, session.email);
  } catch {
    return NextResponse.json({ error: 'Você já submeteu neste ciclo.' }, { status: 409 });
  }

  // Notify Slack
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (webhook) {
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('user') as any).c;
    const submitted = (db.prepare('SELECT COUNT(*) as c FROM competency_submissions WHERE cycle_id = ?').get(cycle.id) as any).c;
    const pending = Math.max(0, totalUsers - submitted);
    await sendSlackNotification(webhook, buildCycleReminderNotification({
      cycleName: cycle.name,
      pendingCount: pending,
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    }));
  }

  return NextResponse.json({ success: true });
}
