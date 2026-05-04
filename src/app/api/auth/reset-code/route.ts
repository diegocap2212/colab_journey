import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/auth/reset-code — admin generates a verification code for a user
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !['admin', 'gestor'].includes(session.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const { email } = await req.json();
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase()) as any;
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  db.prepare('UPDATE users SET verification_code = ?, code_expiry = ?, password_hash = NULL WHERE email = ?').run(code, expiry, email);

  return NextResponse.json({ success: true, code, email });
}
