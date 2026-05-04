import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, COOKIE_NAME } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;

  if (!user) {
    return NextResponse.json({ error: 'E-mail não cadastrado' }, { status: 404 });
  }

  if (!user.password_hash) {
    return NextResponse.json({ error: 'Senha não definida. Faça o primeiro acesso.', needs_setup: true }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const token = await createSession({
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: user.role,
  });

  const res = NextResponse.json({ success: true, email: user.email, name: user.name, role: user.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8h
    path: '/',
  });
  return res;
}
