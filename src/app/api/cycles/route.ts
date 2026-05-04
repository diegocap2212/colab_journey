import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const cycles = db.prepare('SELECT * FROM competency_cycles ORDER BY created_at DESC').all();
    return NextResponse.json(cycles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role === 'user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Nome do ciclo é obrigatório' }, { status: 400 });

    const db = getDb();
    
    // Desativar todos os outros ciclos primeiro para garantir que apenas um fique ativo
    db.prepare('UPDATE competency_cycles SET is_active = 0').run();
    
    // Inserir novo
    const result = db.prepare('INSERT INTO competency_cycles (name, is_active) VALUES (?, 1)').run(name);
    const newCycle = db.prepare('SELECT * FROM competency_cycles WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json(newCycle);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
