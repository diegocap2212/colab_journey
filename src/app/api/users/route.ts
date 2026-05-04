import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'gestor'].includes(session.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const db = getDb();
  const users = db.prepare('SELECT id, email, name, role, job_title, job_level, phone, profile_picture, created_at FROM users ORDER BY created_at ASC').all();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'gestor'].includes(session.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { email, name, role } = await req.json();
  if (!email || !name) return NextResponse.json({ error: 'Email e nome são obrigatórios' }, { status: 400 });

  const validRoles = ['admin', 'gestor', 'user'];
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
  if (role === 'admin' && session.role !== 'admin') return NextResponse.json({ error: 'Apenas admins podem criar admins' }, { status: 403 });

  const db = getDb();
  try {
    db.prepare('INSERT INTO users (email, name, role) VALUES (?, ?, ?)').run(email.toLowerCase().trim(), name, role);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
  }
}
