'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from './layout';
import { Hand, ClipboardList, Edit3, Star, Bell, Inbox, PenSquare, Zap } from 'lucide-react';

const SCORE_LABELS = ['Não conhece', 'Pouca exp.', 'Executa', 'Domina'];
const DIMENSION_LABELS: Record<string, string> = {
  execution: 'Execução', communication: 'Comunicação', dev: 'Desenvolvimento',
  maintain: 'Manutenção', study: 'Estudo', ownership: 'Ownership', cultural: 'Cultura',
};

function ScoreBar({ value, max = 3 }: { value: number | null; max?: number }) {
  if (value === null || value === undefined) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span>;
  const pct = (value / max) * 100;
  const color = value === 0 ? 'var(--red)' : value === 1 ? 'var(--yellow)' : value === 2 ? 'var(--green)' : 'var(--brand-primary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: '16px' }}>{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const user = useUser();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feedbacks').then(r => r.json()).then(data => {
      setFeedbacks(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const isPrivileged = user?.role !== 'user';
  const published = feedbacks.filter(f => !f.is_draft);
  const drafts = feedbacks.filter(f => f.is_draft);
  const unread = feedbacks.filter(f => !f.is_read && f.engineer_email === user?.email && !f.is_draft);

  // Average score calculation
  const dims = ['execution_score', 'communication_score', 'dev_score', 'maintain_score', 'study_score', 'ownership_score', 'cultural_score'];
  function avgScore(fbs: any[]) {
    const scores = fbs.flatMap(f => dims.map(d => f[d]).filter(v => v !== null && v !== undefined));
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  }

  const recentFeedbacks = feedbacks.filter(f => !f.is_draft).slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {greeting}, {user?.name?.split(' ')[0]} <Hand size={28} color="var(--brand-accent)" />
          </h1>
          {isPrivileged && (
            <Link href="/dashboard/new-feedback" className="btn btn-primary">
              <PenSquare size={16} /> Avaliar Engenheiro
            </Link>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isPrivileged ? 'Visão geral do time e performance' : 'Seu painel de evolução técnica'}
        </p>
      </div>

      {/* Action Banner for Engineers */}
      {!isPrivileged && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(14,165,233,0.1) 100%)',
          border: '1px solid var(--border-brand)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--brand-primary-light)' }}>Sua autoavaliação aguarda!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>O ciclo atual está aberto. Preencha ou revise suas competências e acompanhe sua evolução.</p>
          </div>
          <Link href="/dashboard/matrix" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Ir para Minhas Competências →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--brand-primary)' }}><ClipboardList size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--brand-primary-light)' }}>{published.length}</div>
            <div className="stat-label">Feedbacks publicados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--yellow)' }}><Edit3 size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{drafts.length}</div>
            <div className="stat-label">Rascunhos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}><Star size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{avgScore(published)}</div>
            <div className="stat-label">Score médio geral</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)' }}><Bell size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{unread.length}</div>
            <div className="stat-label">Não lidos</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Recent feedbacks table */}
        <div className="card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Feedbacks Recentes</h3>
            <Link href="/dashboard/feedbacks" className="btn btn-ghost btn-sm">Ver todos →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : recentFeedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Inbox size={48} color="var(--text-tertiary)" /></div>
              <div className="empty-title">Nenhum feedback ainda</div>
              <div className="empty-description">
                {isPrivileged ? 'Crie o primeiro feedback para um engenheiro.' : 'Você ainda não recebeu feedbacks publicados.'}
              </div>
              {isPrivileged && (
                <Link href="/dashboard/new-feedback" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                  + Novo Feedback
                </Link>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Engenheiro</th>
                    <th>Ciclo</th>
                    <th>Score Médio</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFeedbacks.map(f => {
                    const scores = dims.map(d => f[d]).filter(v => v !== null && v !== undefined);
                    const avg = scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '—';
                    const scoreNum = parseFloat(avg);
                    const scoreClass = isNaN(scoreNum) ? '' : scoreNum < 1 ? 'score-0' : scoreNum < 2 ? 'score-1' : scoreNum < 2.7 ? 'score-2' : 'score-3';
                    return (
                      <tr key={f.id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {f.engineer_name}
                          {!f.is_read && f.engineer_email === user?.email && (
                            <span style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--brand-primary)', borderRadius: '50%', marginLeft: 8 }} />
                          )}
                        </td>
                        <td>{f.cycle}</td>
                        <td>
                          {avg !== '—' && <span className={`score-pill ${scoreClass}`}>{avg}</span>}
                          {avg === '—' && <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td>
                          <span className={`badge ${f.is_draft ? 'badge-yellow' : 'badge-green'}`}>
                            {f.is_draft ? 'Rascunho' : 'Publicado'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {new Date(f.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-elevated">
            <h3 style={{ marginBottom: '16px' }}>Ações Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isPrivileged && (
                <Link href="/dashboard/new-feedback" className="btn btn-primary btn-full">
                  <PenSquare size={16} /> Avaliar Engenheiro
                </Link>
              )}
              <Link href="/dashboard/matrix" className="btn btn-secondary btn-full">
                <Zap size={16} /> Minhas Competências
              </Link>
              <Link href="/dashboard/feedbacks" className="btn btn-secondary btn-full">
                <ClipboardList size={16} /> Ver Feedbacks
              </Link>
            </div>
          </div>

          {/* Dimensions breakdown */}
          {published.length > 0 && (
            <div className="card-elevated">
              <h3 style={{ marginBottom: '16px' }}>Scores por Dimensão</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
                  const dimKey = `${key}_score`;
                  const scores = published.map(f => f[dimKey]).filter(v => v !== null && v !== undefined) as number[];
                  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{avg !== null ? avg.toFixed(1) : '—'}</span>
                      </div>
                      <ScoreBar value={avg !== null ? Math.round(avg * 10) / 10 : null} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
