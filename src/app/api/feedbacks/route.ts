import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendSlackNotification, buildFeedbackNotification } from '@/lib/slack';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  let feedbacks;

  if (session.role === 'user') {
    feedbacks = db.prepare(
      `SELECT id, engineer_name, engineer_email, evaluator_name, evaluator_email, cycle,
       execution_score, communication_score, dev_score, maintain_score, study_score, ownership_score, cultural_score,
       is_draft, is_anonymous, email_sent, is_read, created_at
       FROM feedbacks WHERE engineer_email = ? OR evaluator_email = ? ORDER BY created_at DESC`
    ).all(session.email, session.email);
  } else {
    feedbacks = db.prepare(
      `SELECT id, engineer_name, engineer_email, evaluator_name, evaluator_email, cycle,
       execution_score, communication_score, dev_score, maintain_score, study_score, ownership_score, cultural_score,
       is_draft, is_anonymous, email_sent, is_read, created_at
       FROM feedbacks ORDER BY created_at DESC`
    ).all();
  }

  // Mask anonymous
  const result = (feedbacks as any[]).map(f => {
    if (f.is_anonymous && f.engineer_email === session.email && f.evaluator_email !== session.email) {
      return { ...f, evaluator_name: 'Anônimo' };
    }
    return f;
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const data = await req.json();
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO feedbacks (
      engineer_email, engineer_name, evaluator_email, evaluator_name, cycle,
      execution_score, execution_text, communication_score, communication_text,
      dev_score, dev_text, maintain_score, maintain_text,
      study_score, study_text, ownership_score, ownership_text,
      cultural_score, cultural_text, general_text,
      is_draft, is_anonymous, impacts_json
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  const info = stmt.run(
    data.engineer_email, data.engineer_name, session.email, session.name, data.cycle,
    data.execution_score ?? null, data.execution_text ?? '',
    data.communication_score ?? null, data.communication_text ?? '',
    data.dev_score ?? null, data.dev_text ?? '',
    data.maintain_score ?? null, data.maintain_text ?? '',
    data.study_score ?? null, data.study_text ?? '',
    data.ownership_score ?? null, data.ownership_text ?? '',
    data.cultural_score ?? null, data.cultural_text ?? '',
    data.general_text ?? '',
    data.is_draft ? 1 : 0,
    data.is_anonymous ? 1 : 0,
    JSON.stringify(data.impacts ?? [])
  );

  // Notify Slack if published (not draft)
  if (!data.is_draft) {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (webhook) {
      await sendSlackNotification(webhook, buildFeedbackNotification({
        engineerName: data.engineer_name,
        evaluatorName: session.name,
        cycle: data.cycle,
        appUrl: process.env.APP_URL || 'http://localhost:3000',
      }));
    }
  }

  return NextResponse.json({ success: true, id: info.lastInsertRowid }, { status: 201 });
}
