'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, AlertTriangle, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // BYPASS LOGIN: Redirect to dashboard automatically
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  const [step, setStep] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.needs_setup) {
        setStep('setup');
        return;
      }
      setError(data.error || 'Erro ao fazer login');
      return;
    }

    router.push('/dashboard');
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao configurar senha');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            borderRadius: '16px', marginBottom: '16px',
            boxShadow: 'var(--shadow-brand)',
            color: '#fff',
          }}>
            <Zap size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Ótmow People
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            {step === 'login' ? 'Plataforma de performance técnica' : 'Primeiro acesso — crie sua senha'}
          </p>
        </div>

        {step === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="voce@otmow.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? <span className="spinner spinner-sm" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              style={{ fontSize: '0.8125rem' }}
              onClick={() => { setStep('setup'); setError(''); }}
            >
              Primeiro acesso ou esqueci minha senha
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="alert alert-info" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} /> Insira o código que o administrador enviou para o seu e-mail.
            </div>

            <div className="input-group">
              <label className="input-label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="voce@otmow.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Código de verificação</label>
              <input
                type="text"
                className="input"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Nova senha (mín. 6 caracteres)</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? <span className="spinner spinner-sm" /> : null}
              {loading ? 'Configurando...' : 'Criar senha e entrar'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              style={{ fontSize: '0.8125rem' }}
              onClick={() => { setStep('login'); setError(''); }}
            >
              ← Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
