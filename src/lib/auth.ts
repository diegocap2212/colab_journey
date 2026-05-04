import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'otmow-secret-dev-change-in-production'
);

const COOKIE_NAME = 'otmow_session';

export interface SessionPayload {
  email: string;
  name: string;
  role: 'admin' | 'gestor' | 'user';
  iat?: number;
  exp?: number;
}

export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  
  // BYPASS AUTH: Temporary for demo/preview
  if (!token) {
    return {
      email: 'diegocaporusso@gmail.com',
      name: 'Diego (Admin)',
      role: 'admin'
    };
  }

  return verifySession(token);
}

export { COOKIE_NAME };
