import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/admin/bootstrap — sets admin password directly (only if no password is set)
// This is a one-time setup endpoint for the initial admin account
export async function POST(req: NextRequest) {
  const { secret, password } = await req.json();

  // Simple secret check to prevent abuse
  if (secret !== (process.env.BOOTSTRAP_SECRET || 'otmow-bootstrap')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = getDb();
  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get() as any;
  if (!admin) return NextResponse.json({ error: 'No admin user found' }, { status: 404 });

  if (admin.password_hash) {
    return NextResponse.json({ error: 'Admin password already set. Use reset-code flow.' }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(hash, 'admin');

  return NextResponse.json({ success: true, email: admin.email, message: 'Admin password set. You can now log in.' });
}
