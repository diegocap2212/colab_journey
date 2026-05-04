import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, COOKIE_NAME } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/auth/setup — first access: verify code and set password
export async function POST(req: NextRequest) {
  const { email, code, password } = await req.json();

  if (!email || !code || !password || password.length < 6) {
    return NextResponse.json({ error: 'Preencha todos os campos (senha mínimo 6 caracteres)' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;

  if (!user) return NextResponse.json({ error: 'E-mail não encontrado' }, { status: 404 });
  if (user.verification_code !== code) return NextResponse.json({ error: 'Código inválido' }, { status: 401 });

  if (user.code_expiry) {
    const expiry = new Date(user.code_expiry);
    if (new Date() > expiry) return NextResponse.json({ error: 'Código expirado. Solicite outro.' }, { status: 401 });
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password_hash = ?, verification_code = NULL, code_expiry = NULL WHERE email = ?').run(hash, email.toLowerCase());

  const token = await createSession({ email: user.email, name: user.name, role: user.role });
  const res = NextResponse.json({ success: true, email: user.email, name: user.name, role: user.role });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 8, path: '/' });
  return res;
}
